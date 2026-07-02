import { Audio } from 'expo-av';

let currentSound: Audio.Sound | null = null;

export async function playBase64Audio(base64: string, onFinish?: () => void): Promise<void> {
  try {
    if (currentSound) {
      await currentSound.unloadAsync();
      currentSound = null;
    }

    const dataUri = `data:audio/mp3;base64,${base64}`;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: dataUri },
      { shouldPlay: true }
    );

    currentSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        currentSound = null;
        if (onFinish) onFinish();
      }
    });
  } catch (e) {
    console.error('❌ Audio play error:', e);
  }
}

export async function stopAudio(): Promise<void> {
  if (currentSound) {
    await currentSound.unloadAsync();
    currentSound = null;
  }
}
