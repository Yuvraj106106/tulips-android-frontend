import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { loadSettings, resetSettings } from '../services/settings';
import { COLORS } from '../constants/theme';
import { preloadCompanionVideos } from '../services/videoPreloader';

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

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

interface Props {
  navigation: SplashScreenNavigationProp;
}

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    // Kick off video preloading as early as possible
    preloadCompanionVideos();

    const checkNavigationFlow = async () => {
      // ⚠️ TEMP FOR TESTING — remove this line once onboarding flow testing is done.
      // Forces every app launch/reload to behave like a fresh install.
      await resetSettings();

      const settings = await loadSettings();

      // Delay for splash effect
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!settings.signUpComplete) {
        navigation.replace('SignUp');
      } else if (!settings.dateOfBirth) {
        navigation.replace('DateOfBirth');
      } else if (!settings.language) {
        navigation.replace('Language');
      } else if (!settings.permissionsGranted) {
        navigation.replace('Permissions');
      } else if (!settings.selectedCompanion) {
        navigation.replace('AvatarSelect');
      } else if (!settings.onboardingComplete) {
        navigation.replace('CinematicIntro');
      } else {
        navigation.replace('Chat');
      }
    };

    checkNavigationFlow();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Tulip 🌸</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFBF00', // Golden color
  },
});

export default SplashScreen;
