import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { saveSettings } from '../services/settings';

type RootStackParamList = {
  Splash: undefined;
  SignUp: undefined;
  DateOfBirth: undefined;
  Language: undefined;
  Permissions: undefined;
  AvatarSelect: undefined;
  PortalTransition: undefined;
  CinematicIntro: undefined;
  Chat: undefined;
};

type DateOfBirthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DateOfBirth'>;

interface Props {
  navigation: DateOfBirthScreenNavigationProp;
}

const currentYear = new Date().getFullYear();

const DateOfBirthScreen: React.FC<Props> = ({ navigation }) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (!d || !m || !y) {
      setError('Please fill in your full date of birth');
      return false;
    }
    if (m < 1 || m > 12) {
      setError('Please enter a valid month (1-12)');
      return false;
    }
    if (d < 1 || d > 31) {
      setError('Please enter a valid day (1-31)');
      return false;
    }
    if (y < 1900 || y > currentYear) {
      setError('Please enter a valid year');
      return false;
    }

    // Check the date actually exists (e.g. no Feb 30)
    const date = new Date(y, m - 1, d);
    if (date.getMonth() !== m - 1 || date.getDate() !== d) {
      setError('That date does not exist, please check again');
      return false;
    }

    setError('');
    return true;
  };

  const handleContinue = async () => {
    if (!validate()) return;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const isoDate = `${year}-${pad(parseInt(month, 10))}-${pad(parseInt(day, 10))}`;

    await saveSettings({ dateOfBirth: isoDate });
    navigation.replace('Language');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Aapki janm tithi kya hai?</Text>
          <Text style={styles.subtitle}>
            Isse hum aapke liye zyada personal aur meaningful baatein la sakte hain
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Din</Text>
              <TextInput
                style={styles.input}
                value={day}
                onChangeText={(v) => setDay(v.replace(/[^0-9]/g, '').slice(0, 2))}
                placeholder="DD"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="number-pad"
                maxLength={2}
                returnKeyType="next"
                onSubmitEditing={() => monthRef.current?.focus()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mahina</Text>
              <TextInput
                ref={monthRef}
                style={styles.input}
                value={month}
                onChangeText={(v) => setMonth(v.replace(/[^0-9]/g, '').slice(0, 2))}
                placeholder="MM"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="number-pad"
                maxLength={2}
                returnKeyType="next"
                onSubmitEditing={() => yearRef.current?.focus()}
              />
            </View>

            <View style={[styles.inputGroup, styles.yearGroup]}>
              <Text style={styles.inputLabel}>Saal</Text>
              <TextInput
                ref={yearRef}
                style={styles.input}
                value={year}
                onChangeText={(v) => setYear(v.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="YYYY"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="number-pad"
                maxLength={4}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    flex: 1,
  },
  yearGroup: {
    flex: 1.4,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    fontSize: 20,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  continueButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DateOfBirthScreen;
