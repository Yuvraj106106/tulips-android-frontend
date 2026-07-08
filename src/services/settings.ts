import * as FileSystem from 'expo-file-system/legacy';

const SETTINGS_FILE = `${FileSystem.documentDirectory}settings.json`;

export interface Settings {
  language?: 'Hindi' | 'Hinglish' | 'English';
  permissionsGranted?: boolean;
  onboardingComplete?: boolean;
  dateOfBirth?: string; // ISO format (YYYY-MM-DD)
}

export async function saveSettings(settings: Partial<Settings>) {
  try {
    const existingSettings = await loadSettings();
    const newSettings = { ...existingSettings, ...settings };
    await FileSystem.writeAsStringAsync(SETTINGS_FILE, JSON.stringify(newSettings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export async function loadSettings(): Promise<Settings> {
  try {
    const info = await FileSystem.getInfoAsync(SETTINGS_FILE);
    if (info.exists) {
      const content = await FileSystem.readAsStringAsync(SETTINGS_FILE);
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return {};
}
