import { BACKEND_URL } from '../constants/config';

export async function sendMessage(message: string, conversationId: string) {
  console.log("🚀 sendMessage CALLED with:", message);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, conversationId }),
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
