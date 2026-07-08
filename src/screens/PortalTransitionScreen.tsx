import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  PortalTransition: undefined;
  SignUp: undefined;
};

type PortalTransitionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PortalTransition'>;

interface Props {
  navigation: PortalTransitionScreenNavigationProp;
}

const PortalTransitionScreen: React.FC<Props> = ({ navigation }) => {
  const portalScale = useRef(new Animated.Value(0)).current;
  const portalOpacity = useRef(new Animated.Value(0)).current;
  const ring1Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sound effect
    const playSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/portal-sound.mp3')
        );
        // TODO: replace with final portal sound effect, no code change needed elsewhere — just swap the audio file.
        await sound.playAsync();
      } catch (error) {
        console.warn('Portal sound failed to play', error);
      }
    };

    playSound();

    // Visual animation
    Animated.sequence([
      // 1. Portal appears and starts glowing
      Animated.parallel([
        Animated.timing(portalOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(portalScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      // 2. Rings radiate outward
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(ring1Scale, {
              toValue: 3,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(ring1Scale, {
              toValue: 0.5,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(ring2Scale, {
              toValue: 3,
              duration: 2000,
              delay: 500,
              useNativeDriver: true,
            }),
            Animated.timing(ring2Scale, {
              toValue: 0.5,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();

    // 3. Final burst and transition
    const timer = setTimeout(() => {
      Animated.timing(burstOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('SignUp');
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, '#1a1a2e', COLORS.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* Radiating Rings */}
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ring1Scale }], opacity: portalOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            })
          }
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ring2Scale }], opacity: portalOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.2],
            })
          }
        ]}
      />

      {/* Main Portal Glow */}
      <Animated.View
        style={[
          styles.portal,
          {
            opacity: portalOpacity,
            transform: [{ scale: portalScale }],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFD700', COLORS.primary, 'transparent']}
          style={styles.portalGradient}
        />
      </Animated.View>

      {/* Final Light Burst */}
      <Animated.View
        style={[
          styles.burst,
          {
            opacity: burstOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', '#FFFFFF', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
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
  portal: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 20,
  },
  portalGradient: {
    flex: 1,
  },
  ring: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  burst: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
});

export default PortalTransitionScreen;
