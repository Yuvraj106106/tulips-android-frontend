import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import CompanionAvatar from './CompanionAvatar';
import { loadSettings } from '../services/settings';
import { CompanionId, companions, DEFAULT_COMPANION } from '../companions/config';
import { startWakeWordDetection, stopWakeWordDetection } from '../services/wakeword';
import { sendWakeEvent } from '../services/api';

/**
 * FloatingAvatar is a small overlay rendering the 3D avatar that activates
 * upon wake word detection, showing a pulsating listening ring, and invoking
 * the backend /voice/wake-event endpoint.
 */
export const FloatingAvatar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionId>(DEFAULT_COMPANION);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the active companion on mount and whenever it changes
  const reloadCompanion = async () => {
    try {
      const s = await loadSettings();
      if (s.selectedCompanion) {
        setSelectedCompanion(s.selectedCompanion);
      }
    } catch (e) {
      console.error('Failed to load settings in FloatingAvatar:', e);
    }
  };

  useEffect(() => {
    reloadCompanion();
  }, []);

  // Request Microphone permissions on Android/iOS and start wake-word detection
  useEffect(() => {
    let active = true;

    const initWakeWord = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'Tulip needs access to your microphone to hear wake-words.',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('Microphone permission denied for wake-word detection.');
            return;
          }
        } catch (err) {
          console.error('Failed to request mic permission:', err);
          return;
        }
      }

      if (!active) return;

      // Start always-listening wake-word detection layer
      await startWakeWordDetection(
        async () => {
          if (!active) return;
          console.log('🔔 Wake Word triggered!');

          // Reload settings in case companion changed
          await reloadCompanion();

          setIsVisible(true);
          setIsListening(true);

          // Invoke backend wake-event endpoint
          try {
            await sendWakeEvent();
            console.log('✅ Wake event backend API call succeeded.');
          } catch (err) {
            console.error('❌ Backend wake-event API call failed:', err);
          }

          // Clear any existing dismissal timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // Set 8-second auto-timeout to dismiss/deactivate
          timeoutRef.current = setTimeout(() => {
            if (active) {
              handleDismiss();
            }
          }, 8000);
        },
        (error) => {
          console.error('Wake-word detection error in FloatingAvatar:', error);
        }
      );
    };

    initWakeWord();

    return () => {
      active = false;
      stopWakeWordDetection();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Control pulsating animation based on listening state
  useEffect(() => {
    if (isListening && isVisible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, isVisible]);

  // Fade-in / Fade-out animation for the whole container when visible/invisible
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  const handleDismiss = () => {
    setIsListening(false);
    setIsVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  if (!isVisible) {
    return null;
  }

  const companionConfig = companions[selectedCompanion] || companions[DEFAULT_COMPANION]!;
  const themeColor = companionConfig.themeColor || '#FFBF00';

  return (
    <Animated.View style={[styles.outerContainer, { opacity: fadeAnim }]}>
      {/* Pulsating animation ring behind the circular avatar */}
      {isListening && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              borderColor: themeColor,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      {/* Main Circular Avatar Container */}
      <View style={[styles.avatarWrapper, { borderColor: themeColor }]}>
        <CompanionAvatar companionId={selectedCompanion} />
      </View>

      {/* Close button overlay */}
      <TouchableOpacity style={styles.closeButton} onPress={handleDismiss} activeOpacity={0.7}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>

      {/* Listening Banner or Indicator */}
      {isListening && (
        <View style={[styles.banner, { backgroundColor: themeColor }]}>
          <Text style={styles.bannerText}>Listening...</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 100,
    height: 100,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 4,
    opacity: 0.6,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    backgroundColor: '#0a0a1a',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  closeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
    textAlign: 'center',
  },
  banner: {
    position: 'absolute',
    bottom: -22,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  bannerText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default FloatingAvatar;
