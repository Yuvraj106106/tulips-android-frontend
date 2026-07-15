import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { VoiceProcessor, VoiceProcessorError } from '@picovoice/react-native-voice-processor';
import { Asset } from 'expo-asset';

/**
 * Free, on-device wake-word detection using openWakeWord (Apache-2.0, free forever).
 *
 * Picovoice Porcupine's free tier was discontinued by Picovoice on June 30, 2026 (no
 * non-commercial tier remains — plans now start around $6,000/yr via sales). This module
 * replaces it with openWakeWord, which runs 100% on-device via ONNX Runtime and has no
 * account, no AccessKey, and no usage cap — so it scales to any number of users at zero cost.
 *
 * Pipeline (ported from github.com/dscripka/openWakeWord, verified numerically against the
 * reference Python implementation before porting):
 *   raw 16-bit PCM audio (16kHz)
 *     -> melspectrogram.onnx      (produces 32-bin mel frames)
 *     -> embedding_model.onnx     (76-frame sliding window -> 96-dim embedding, every 8 frames)
 *     -> <wakeword>.onnx          (last 16 embeddings -> single 0-1 detection score)
 *
 * NOTE: The bundled wake-word model (hey_jarvis_v0.1.onnx) is openWakeWord's pre-trained
 * "Hey Jarvis" model, used as a working placeholder. Training a custom "Hey Krishna" model
 * requires openWakeWord's Google Colab training notebook (needs synthetic TTS + noise data
 * not reachable from this environment) — swap the model file + WAKEWORD_MODEL_ASSET below
 * once that's done, no other code changes needed.
 */

const SAMPLE_RATE = 16000;
const FRAME_LENGTH = 1280; // 80ms @ 16kHz, matches openWakeWord's expected chunk size
const MEL_BINS = 32;
const EMBED_WINDOW = 76; // frames of melspectrogram consumed per embedding
const EMBED_STEP = 8;
const EMBED_DIM = 96;
const MELSPEC_MAX_LEN = 970; // 10s of mel frames, matches openWakeWord's ring buffer cap
const FEATURE_MAX_LEN = 120; // ~10s of embeddings
const WAKEWORD_INPUT_FRAMES = 16; // hey_jarvis_v0.1 expects the last 16 embeddings
const DETECTION_THRESHOLD = 0.5;
const RETRIGGER_COOLDOWN_MS = 2000;

// Model assets bundled with the app (see metro.config.js — 'onnx' registered as an assetExt)
const MELSPEC_MODEL_ASSET = require('../../assets/models/melspectrogram.onnx');
const EMBEDDING_MODEL_ASSET = require('../../assets/models/embedding_model.onnx');
const WAKEWORD_MODEL_ASSET = require('../../assets/models/hey_jarvis_v0.1.onnx');

let melSession: InferenceSession | null = null;
let embedSession: InferenceSession | null = null;
let wakewordSession: InferenceSession | null = null;

let melspecTransformedTail: number[][] = Array.from({ length: EMBED_WINDOW }, () => new Array(MEL_BINS).fill(1.0));
let featureBuffer: number[][] = [];
let rawDataBuffer: number[] = [];
let accumulatedSamples = 0;
let lastDetectionAt = 0;
let running = false;

async function loadSessionFromAsset(moduleAsset: number): Promise<InferenceSession> {
  const asset = Asset.fromModule(moduleAsset);
  await asset.downloadAsync();
  const uri = asset.localUri || asset.uri;
  return InferenceSession.create(uri);
}

/** Runs melspectrogram.onnx on a chunk of raw int16 samples, applies openWakeWord's x/10+2 transform. */
async function computeMelspectrogram(samples: number[]): Promise<number[][]> {
  if (!melSession) throw new Error('melSession not loaded');
  const input = new Tensor('float32', Float32Array.from(samples), [1, samples.length]);
  const results = await melSession.run({ input });
  const outputTensor = results[melSession.outputNames[0]];
  const data = outputTensor.data as Float32Array;
  const dims = outputTensor.dims; // [time, 1, X, 32] — squeeze to [time, 32]
  const nFrames = dims[0];
  const frames: number[][] = [];
  for (let t = 0; t < nFrames; t++) {
    const frame: number[] = [];
    for (let b = 0; b < MEL_BINS; b++) {
      const v = data[t * MEL_BINS + b];
      frame.push(v / 10 + 2); // openWakeWord's melspec_transform
    }
    frames.push(frame);
  }
  return frames;
}

/** Runs embedding_model.onnx on one or more 76-frame melspectrogram windows. */
async function computeEmbeddings(windows: number[][][]): Promise<number[][]> {
  if (!embedSession) throw new Error('embedSession not loaded');
  const batch = windows.length;
  const flat = new Float32Array(batch * EMBED_WINDOW * MEL_BINS * 1);
  let idx = 0;
  for (const window of windows) {
    for (let f = 0; f < EMBED_WINDOW; f++) {
      for (let b = 0; b < MEL_BINS; b++) {
        flat[idx++] = window[f][b];
      }
    }
  }
  const input = new Tensor('float32', flat, [batch, EMBED_WINDOW, MEL_BINS, 1]);
  const results = await embedSession.run({ input_1: input });
  const outputTensor = results[embedSession.outputNames[0]];
  const data = outputTensor.data as Float32Array;
  const embeddings: number[][] = [];
  for (let i = 0; i < batch; i++) {
    embeddings.push(Array.from(data.slice(i * EMBED_DIM, (i + 1) * EMBED_DIM)));
  }
  return embeddings;
}

/** Runs the wake-word classifier on the last WAKEWORD_INPUT_FRAMES embeddings. Returns score 0-1. */
async function computeWakewordScore(): Promise<number> {
  if (!wakewordSession) throw new Error('wakewordSession not loaded');
  const frames = featureBuffer.slice(-WAKEWORD_INPUT_FRAMES);
  if (frames.length < WAKEWORD_INPUT_FRAMES) return 0;

  const flat = new Float32Array(WAKEWORD_INPUT_FRAMES * EMBED_DIM);
  let idx = 0;
  for (const frame of frames) {
    for (let d = 0; d < EMBED_DIM; d++) flat[idx++] = frame[d];
  }
  const inputName = wakewordSession.inputNames[0];
  const input = new Tensor('float32', flat, [1, WAKEWORD_INPUT_FRAMES, EMBED_DIM]);
  const results = await wakewordSession.run({ [inputName]: input });
  const outputTensor = results[wakewordSession.outputNames[0]];
  return (outputTensor.data as Float32Array)[0];
}

/**
 * Streaming step, mirrors openWakeWord's `_streaming_features`: buffers raw audio,
 * recomputes the melspectrogram tail every ~80ms, and derives new embeddings from it.
 */
async function processAudioChunk(samples: number[]): Promise<number> {
  rawDataBuffer.push(...samples);
  if (rawDataBuffer.length > SAMPLE_RATE * 10) {
    rawDataBuffer = rawDataBuffer.slice(-SAMPLE_RATE * 10);
  }
  accumulatedSamples += samples.length;

  if (accumulatedSamples < FRAME_LENGTH) return 0;

  const tailSamples = rawDataBuffer.slice(-(accumulatedSamples + 160 * 3));
  const newMelFrames = await computeMelspectrogram(tailSamples);
  melspecTransformedTail = melspecTransformedTail.concat(newMelFrames);
  if (melspecTransformedTail.length > MELSPEC_MAX_LEN) {
    melspecTransformedTail = melspecTransformedTail.slice(-MELSPEC_MAX_LEN);
  }

  const steps = Math.floor(accumulatedSamples / FRAME_LENGTH);
  const windowsToCompute: number[][][] = [];
  const L = melspecTransformedTail.length;
  for (let i = steps - 1; i >= 0; i--) {
    let ndx = -EMBED_STEP * i;
    if (ndx === 0) ndx = L;
    // Mirror Python's arr[-76+ndx : ndx] slicing, where ndx may be a Python-style
    // negative index (i > 0) or the absolute buffer length (i === 0). Each bound
    // must be resolved to an absolute index independently.
    const rawStart = -EMBED_WINDOW + ndx;
    const rawStop = ndx;
    const start = rawStart >= 0 ? rawStart : L + rawStart;
    const stop = rawStop >= 0 ? rawStop : L + rawStop;
    const window = melspecTransformedTail.slice(start, stop);
    if (window.length === EMBED_WINDOW) windowsToCompute.push(window);
  }

  if (windowsToCompute.length > 0) {
    const newEmbeddings = await computeEmbeddings(windowsToCompute);
    featureBuffer = featureBuffer.concat(newEmbeddings);
    if (featureBuffer.length > FEATURE_MAX_LEN) {
      featureBuffer = featureBuffer.slice(-FEATURE_MAX_LEN);
    }
  }

  accumulatedSamples = 0;
  return computeWakewordScore();
}

export async function startWakeWordDetection(
  onDetected: () => void,
  onError?: (error: any) => void
): Promise<void> {
  try {
    if (running) {
      await stopWakeWordDetection();
    }

    if (!melSession || !embedSession || !wakewordSession) {
      console.log('🧠 Loading openWakeWord ONNX models...');
      [melSession, embedSession, wakewordSession] = await Promise.all([
        loadSessionFromAsset(MELSPEC_MODEL_ASSET),
        loadSessionFromAsset(EMBEDDING_MODEL_ASSET),
        loadSessionFromAsset(WAKEWORD_MODEL_ASSET),
      ]);
      console.log('✅ openWakeWord models loaded');
    }

    const voiceProcessor = VoiceProcessor.instance;

    const frameListener = (frame: number[]) => {
      processAudioChunk(frame)
        .then((score) => {
          if (score > 0.05) console.log('🔎 wakeword score=', score.toFixed(3));
          const now = Date.now();
          if (score > DETECTION_THRESHOLD && now - lastDetectionAt > RETRIGGER_COOLDOWN_MS) {
            lastDetectionAt = now;
            console.log('🎯 Wake word detected! score=', score);
            onDetected();
          }
        })
        .catch((err) => {
          console.error('❌ Wake word processing error:', err);
          if (onError) onError(err);
        });
    };

    const errorListener = (error: VoiceProcessorError) => {
      console.error('❌ VoiceProcessor error:', error);
      if (onError) onError(error);
    };

    voiceProcessor.addFrameListener(frameListener);
    voiceProcessor.addErrorListener(errorListener);

    const hasPermission = await voiceProcessor.hasRecordAudioPermission();
    if (!hasPermission) {
      console.warn('⚠️ Microphone permission not granted, cannot start wake-word detection.');
      if (onError) onError(new Error('Microphone permission not granted.'));
      return;
    }

    await voiceProcessor.start(FRAME_LENGTH, SAMPLE_RATE);
    running = true;
    console.log('🎙️ openWakeWord detection started (listening for "Hey Jarvis" placeholder wake word)');
  } catch (error: any) {
    console.error('❌ Failed to start openWakeWord detection:', error);
    if (onError) onError(error);
  }
}

export async function stopWakeWordDetection(): Promise<void> {
  try {
    if (running) {
      const voiceProcessor = VoiceProcessor.instance;
      await voiceProcessor.stop();
      voiceProcessor.clearFrameListeners();
      running = false;
      console.log('⏹️ openWakeWord detection stopped');
    }
  } catch (error) {
    console.error('❌ Failed to stop openWakeWord detection:', error);
  }
}
