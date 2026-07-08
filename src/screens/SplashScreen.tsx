import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { loadSettings } from '../services/settings';
import { COLORS } from '../constants/theme';

type RootStackParamList = {
  Splash: undefined;
  PortalTransition: undefined;
  SignUp: undefined;
  Language: undefined;
  DateOfBirth: undefined;
  Permissions: undefined;
  AvatarSelect: undefined;
  CinematicIntro: undefined;
  Chat: undefined;
};

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

interface Props {
  navigation: SplashScreenNavigationProp;
}

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    const checkNavigationFlow = async () => {
      const settings = await loadSettings();

      // Delay for splash effect
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!settings.language) {
        navigation.replace('PortalTransition');
      } else if (!settings.permissionsGranted) {
        navigation.replace('Permissions');
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
