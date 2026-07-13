import { PorcupineManager } from '@picovoice/porcupine-react-native';
import { Platform } from 'react-native';

// TODO: Replace with your actual Picovoice Access Key trained/obtained from Picovoice Console (https://console.picovoice.ai/)
const PICOVOICE_ACCESS_KEY = "YOUR_PICOVOICE_ACCESS_KEY";

// TODO: Replace with your actual trained .ppn keyword file path/name.
// On Android, place the .ppn file in android/app/src/main/assets/
// On iOS, add the .ppn file to your Xcode project resources.
const KEYWORD_FILE_PATH = Platform.OS === 'android' ? 'tulip_android.ppn' : 'tulip_ios.ppn';

let porcupineManager: PorcupineManager | null = null;

/**
 * Starts the Picovoice Porcupine wake-word detection engine using high-level PorcupineManager.
 * Logs a warning and fails gracefully if AccessKey is unconfigured.
 */
export async function startWakeWordDetection(
  onDetected: () => void,
  onError?: (error: any) => void
): Promise<void> {
  try {
    if (porcupineManager) {
      await stopWakeWordDetection();
    }

    if (!PICOVOICE_ACCESS_KEY || PICOVOICE_ACCESS_KEY === "YOUR_PICOVOICE_ACCESS_KEY") {
      console.warn("⚠️ Picovoice Access Key is not configured. Wake word detection will not start.");
      if (onError) {
        onError(new Error("Picovoice Access Key is unconfigured."));
      }
      return;
    }

    const detectionCallback = (keywordIndex: number) => {
      if (keywordIndex === 0) {
        console.log("🎯 Wake word detected!");
        onDetected();
      }
    };

    const processErrorCallback = (error: any) => {
      console.error("❌ Porcupine detection process error:", error);
      if (onError) {
        onError(error);
      }
    };

    porcupineManager = await PorcupineManager.fromKeywordPaths(
      PICOVOICE_ACCESS_KEY,
      [KEYWORD_FILE_PATH],
      detectionCallback,
      processErrorCallback
    );

    await porcupineManager.start();
    console.log("🎙️ Porcupine Wake Word detection started with keyword:", KEYWORD_FILE_PATH);
  } catch (error: any) {
    console.error("❌ Failed to start Porcupine Wake Word detection:", error);
    if (onError) {
      onError(error);
    }
  }
}

/**
 * Stops and releases resources for the Porcupine Wake Word detection engine.
 */
export async function stopWakeWordDetection(): Promise<void> {
  try {
    if (porcupineManager) {
      await porcupineManager.stop();
      await porcupineManager.delete();
      porcupineManager = null;
      console.log("⏹️ Porcupine Wake Word detection stopped");
    }
  } catch (error) {
    console.error("❌ Failed to stop Porcupine Wake Word detection:", error);
  }
}
