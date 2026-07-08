import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../constants/theme';

type RootStackParamList = {
  AvatarSelect: undefined;
  PortalTransition: undefined;
  CinematicIntro: undefined;
};

type PortalTransitionNavigationProp = StackNavigationProp<RootStackParamList, 'PortalTransition'>;

interface Props {
  navigation: PortalTransitionNavigationProp;
}

const { width, height } = Dimensions.get('window');
const RING_COUNT = 4;

const PortalTransitionScreen: React.FC<Props> = ({ navigation }) => {
  const spin = useRef(new Animated.Value(0)).current;
  const spinReverse = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(spinReverse, {
        toValue: 1,
        duration: 4200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.timing(scale, {
      toValue: 1.6,
      duration: 2200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Flash + navigate once the portal has fully expanded
    const timer = setTimeout(() => {
      Animated.timing(flash, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('CinematicIntro');
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, [navigation]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotateReverse = spinReverse.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.portalWrap, { opacity, transform: [{ scale }] }]}>
        {Array.from({ length: RING_COUNT }).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.ring,
              {
                width: 90 + i * 55,
                height: 90 + i * 55,
                borderRadius: (90 + i * 55) / 2,
                opacity: 0.85 - i * 0.15,
                transform: [{ rotate: i % 2 === 0 ? rotate : rotateReverse }],
              },
            ]}
          />
        ))}
        <View style={styles.core} />
      </Animated.View>

      <Animated.Text style={[styles.label, { opacity }]}>
        Dwar khul raha hai...
      </Animated.Text>

      <Animated.View
        pointerEvents="none"
        style={[styles.flashOverlay, { opacity: flash }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  core: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.9,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    position: 'absolute',
    bottom: height * 0.15,
    color: COLORS.textSecondary,
    fontSize: 15,
    letterSpacing: 1,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: COLORS.primary,
  },
});

export default PortalTransitionScreen;
