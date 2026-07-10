import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { saveSettings } from '../services/settings';
import { sendOtp, verifyOtp, googleSignIn, useGoogleAuth } from '../services/auth';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Splash: undefined;
  SignUp: undefined;
  DateOfBirth: undefined;
  Language: undefined;
  Permissions: undefined;
  CinematicIntro: undefined;
  Chat: undefined;
};

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignUp'>;

interface Props {
  navigation: SignUpScreenNavigationProp;
}

enum AuthStep {
  GOOGLE_STEP,
  PHONE_STEP,
  OTP_STEP,
}

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState<AuthStep>(AuthStep.GOOGLE_STEP);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { request, response, promptAsync } = useGoogleAuth();

  const transitionTo = (nextStep: AuthStep) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      setError(null);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await promptAsync();
    } catch (err) {
      setError('Google Sign-In failed');
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        const accessToken = response.authentication?.accessToken;
        if (!accessToken) {
          setError('Google Sign-In failed');
          setLoading(false);
          return;
        }
        const result = await googleSignIn(accessToken);
        setLoading(false);
        if (result.success) {
          await saveSettings({
            googleSignInComplete: true,
            userId: result.userId,
            user: {
              name: result.name || '',
              email: result.email || '',
              phoneNumber: '',
            },
          });
          transitionTo(AuthStep.PHONE_STEP);
        } else {
          setError(result.error || 'Google Sign-In failed');
        }
      } else if (response?.type === 'error') {
        setError('Google Sign-In failed');
        setLoading(false);
      } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
        setLoading(false);
      }
    };

    handleGoogleResponse();
  }, [response]);

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    const result = await sendOtp(phone);
    setLoading(false);
    if (result.success) {
      transitionTo(AuthStep.OTP_STEP);
    } else {
      setError(result.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setError('Please enter the OTP');
      return;
    }
    setLoading(true);
    const result = await verifyOtp(phone, otp);
    setLoading(false);
    if (result.success) {
      await saveSettings({
        signUpComplete: true,
        userId: result.userId,
        phone: phone,
      });
      navigation.replace('DateOfBirth');
    } else {
      setError(result.error || 'Invalid OTP');
    }
  };

  const renderGoogleStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Welcome to Tulip</Text>
      <Text style={styles.subtitle}>Connect with your spiritual guide</Text>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignIn}
        disabled={loading || !request}
      >
        <BlurView intensity={20} tint="light" style={styles.blurButton}>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.buttonText}>Continue with Google</Text>
          )}
        </BlurView>
      </TouchableOpacity>

      {__DEV__ && (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => transitionTo(AuthStep.PHONE_STEP)}
        >
          <Text style={styles.linkText}>Skip (dev only)</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  const renderPhoneStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Mobile Number</Text>
      <Text style={styles.subtitle}>Enter your phone for verification</Text>

      <BlurView intensity={15} tint="light" style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          autoFocus
        />
      </BlurView>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSendOtp}
        disabled={loading}
      >
        <BlurView intensity={30} tint="light" style={styles.blurButton}>
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={[styles.buttonText, { color: COLORS.background }]}>Send OTP</Text>
          )}
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderOtpStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>Enter the code sent to {phone}</Text>

      <BlurView intensity={15} tint="light" style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter OTP (try 123456)"
          placeholderTextColor="#888"
          keyboardType="number-pad"
          value={otp}
          onChangeText={setOtp}
          autoFocus
        />
      </BlurView>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleVerifyOtp}
        disabled={loading}
      >
        <BlurView intensity={30} tint="light" style={styles.blurButton}>
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={[styles.buttonText, { color: COLORS.background }]}>Verify & Continue</Text>
          )}
        </BlurView>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => transitionTo(AuthStep.PHONE_STEP)}
      >
        <Text style={styles.linkText}>Edit Phone Number</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.backgroundDecoration1} />
      <View style={styles.backgroundDecoration2} />

      <View style={styles.content}>
        <Text style={styles.logo}>Tulip 🌸</Text>

        {step === AuthStep.GOOGLE_STEP && renderGoogleStep()}
        {step === AuthStep.PHONE_STEP && renderPhoneStep()}
        {step === AuthStep.OTP_STEP && renderOtpStep()}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundDecoration1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
  },
  backgroundDecoration2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: COLORS.primary,
    opacity: 0.05,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xxl * 2,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    opacity: 0.7,
  },
  inputContainer: {
    width: '100%',
    borderRadius: 16,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    color: COLORS.text,
    fontSize: 18,
  },
  googleButton: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
  },
  blurButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  errorText: {
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  linkButton: {
    marginTop: SPACING.lg,
  },
  linkText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen;
