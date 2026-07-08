import * as FileSystem from 'expo-file-system/legacy';
import { CompanionId } from '../companions/config';

const SETTINGS_FILE = `${FileSystem.documentDirectory}settings.json`;

export interface Settings {
  language?: 'Hindi' | 'Hinglish' | 'English';
  permissionsGranted?: boolean;
  onboardingComplete?: boolean;
  signUpComplete?: boolean;
  userId?: string;
  phone?: string;
  dateOfBirth?: string; // ISO format YYYY-MM-DD
  voiceEnabled?: boolean;
  voiceSpeed?: 'slow' | 'normal' | 'fast';
  notificationsEnabled?: boolean;
  selectedCompanion?: CompanionId;
  user?: {
    name: string;
    email: string;
    phoneNumber: string;
  };
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
      const settings = JSON.parse(content);
      return {
        voiceEnabled: true,
        voiceSpeed: 'normal',
        notificationsEnabled: true,
        selectedCompanion: 'krishna',
        ...settings,
      };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return {
    voiceEnabled: true,
    voiceSpeed: 'normal',
    notificationsEnabled: true,
    selectedCompanion: 'krishna',
  };
}
