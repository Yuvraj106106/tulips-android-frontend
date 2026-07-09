import { BACKEND_URL, BACKEND_API_SECRET, TEMP_USER_ID } from '../constants/config';
import { loadSettings } from './settings';

export async function sendMessage(message: string, conversationId: string) {
  console.log("🚀 sendMessage CALLED with:", message);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const settings = await loadSettings();
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': BACKEND_API_SECRET,
      },
      body: JSON.stringify({
        message,
        conversationId,
        userId: TEMP_USER_ID,
        language: settings.language,
        voiceSpeed: settings.voiceSpeed,
        voiceEnabled: settings.voiceEnabled,
        companionId: settings.selectedCompanion,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error sending message:', error);
    if (error.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw error;
  }
}
