import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { saveSettings, loadSettings } from '../services/settings';
import { companions, CompanionId, DEFAULT_COMPANION } from '../companions/config';

type RootStackParamList = {
  Splash: undefined;
  SignUp: undefined;
  Language: undefined;
  Permissions: undefined;
  AvatarSelect: undefined;
  CinematicIntro: undefined;
  Chat: undefined;
};

type CinematicIntroScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CinematicIntro'>;

interface Props {
  navigation: CinematicIntroScreenNavigationProp;
}

const CinematicIntroScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedCompanionId, setSelectedCompanionId] = useState<CompanionId>(DEFAULT_COMPANION);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    const init = async () => {
      const settings = await loadSettings();
      if (settings.selectedCompanion) {
        setSelectedCompanionId(settings.selectedCompanion);
      }
      setLoading(false);
    };
    init();
  }, []);

  const completeOnboarding = async () => {
    await saveSettings({ onboardingComplete: true });
    navigation.replace('Chat');
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      completeOnboarding();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const companion = companions[selectedCompanionId];

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={companion.introVideoAsset}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onError={(error) => {
          console.error('[CinematicIntro] Video error:', error);
          // Fallback if video fails
          setTimeout(completeOnboarding, 2000);
        }}
      />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.skipButton} onPress={completeOnboarding}>
            <BlurView intensity={40} tint="dark" style={styles.skipBlur}>
              <Text style={styles.skipText}>Skip</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Subtle glass UI at the bottom could go here if needed */}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  },
  skipButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipBlur: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  skipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: 'bold',
  },
});

export default CinematicIntroScreen;
