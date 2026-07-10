import * as Google from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE_CLIENT_ID, BACKEND_URL } from '../constants/config';

WebBrowser.maybeCompleteAuthSession();

export interface AuthResponse {
  success: boolean;
  userId?: string;
  error?: string;
}

export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to send OTP' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error: 'Network error while sending OTP' };
  }
}

export async function verifyOtp(phone: string, code: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Invalid OTP' };
    }

    return { success: true, userId: data.userId };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: 'Network error while verifying OTP' };
  }
}

export async function googleSignIn(accessToken: string): Promise<AuthResponse & { email?: string; name?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/google-signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Google sign-in failed' };
    }

    return { success: true, userId: data.userId, email: data.email, name: data.name };
  } catch (error) {
    console.error('Error during Google sign-in:', error);
    return { success: false, error: 'Network error during Google sign-in' };
  }
}

export async function emailSignUp(email: string, password: string, name?: string): Promise<AuthResponse & { email?: string; name?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/email-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Sign up failed' };
    }

    return { success: true, userId: data.userId, email: data.email, name: data.name };
  } catch (error) {
    console.error('Error during email sign-up:', error);
    return { success: false, error: 'Network error during sign-up' };
  }
}

export async function emailLogin(email: string, password: string): Promise<AuthResponse & { email?: string; name?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/email-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Login failed' };
    }

    return { success: true, userId: data.userId, email: data.email, name: data.name };
  } catch (error) {
    console.error('Error during email login:', error);
    return { success: false, error: 'Network error during login' };
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
    responseType: ResponseType.Token,
    scopes: ['openid', 'profile', 'email'],
    // Add other client IDs if needed (iosClientId, webClientId, etc.)
  });

  return {
    request,
    response,
    promptAsync,
  };
}
