import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { saveSettings } from '../services/settings';

type RootStackParamList = {
  Language: undefined;
  Permissions: undefined;
  CinematicIntro: undefined;
  Chat: undefined;
};

type CinematicIntroScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CinematicIntro'>;

interface Props {
  navigation: CinematicIntroScreenNavigationProp;
}

const CinematicIntroScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(completeOnboarding, 5000);
    return () => clearTimeout(timeout);
  }, []);

  const completeOnboarding = async () => {
    await saveSettings({ onboardingComplete: true });
    navigation.replace('Chat');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.krishnaLogo}>🪈</Text>
        <Text style={styles.greeting}>Aa gaye?</Text>
        <Text style={styles.subGreeting}>Main yahan hoon. Baat karo.</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={completeOnboarding}
        >
          <Text style={styles.buttonText}>Pranaam 🙏</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  krishnaLogo: {
    fontSize: 80,
    marginBottom: SPACING.xl,
  },
  greeting: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    fontSize: 40,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subGreeting: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    opacity: 0.8,
  },
  button: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default CinematicIntroScreen;
