import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import auth from '@react-native-firebase/auth';
import { GOOGLE_CLIENT_ID, BACKEND_URL } from '../constants/config';

WebBrowser.maybeCompleteAuthSession();

export interface AuthResponse {
  success: boolean;
  userId?: string;
  error?: string;
}

// Holds the in-progress Firebase phone auth session between sendOtp() and verifyOtp()
let confirmationResult: any = null;

export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Firebase requires E.164 format, e.g. +91XXXXXXXXXX
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    confirmationResult = await auth().signInWithPhoneNumber(formattedPhone);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
}

export async function verifyOtp(phone: string, code: string): Promise<AuthResponse> {
  try {
    if (!confirmationResult) {
      return { success: false, error: 'OTP session expired, please resend' };
    }

    const userCredential = await confirmationResult.confirm(code);
    const idToken = await userCredential.user.getIdToken();

    // Send the verified Firebase ID token to our backend so it can create/update
    // the user record in Realtime Database and hand back our own userId.
    const response = await fetch(`${BACKEND_URL}/api/auth/verify-firebase-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Verification failed' };
    }

    return { success: true, userId: data.userId };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: error.message || 'Invalid OTP' };
  }
}

/**
 * Hook to use Google Authentication
 * Note: This requires proper setup in Google Cloud Console
 * and configuring the GOOGLE_CLIENT_ID in src/constants/config.ts
 */
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_CLIENT_ID,
    // Add other client IDs if needed (iosClientId, webClientId, etc.)
  });

  return {
    request,
    response,
    promptAsync,
  };
}
