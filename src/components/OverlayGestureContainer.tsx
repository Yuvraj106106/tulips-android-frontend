import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  PanResponder,
  TouchableOpacity,
  Text,
  LayoutChangeEvent,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { COLORS } from '../constants/theme';

interface OverlayGestureContainerProps {
  children: React.ReactNode;
}

export default function OverlayGestureContainer({ children }: OverlayGestureContainerProps) {
  // layout dimensions of the parent/screen container
  const [layout, setLayout] = useState({ width: 360, height: 640 });
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandedRef = useRef(false);

  // 0 = collapsed/popup, 1 = expanded/full-screen
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Track layout changes dynamically
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
    }
  };

  const expand = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: false,
      bounciness: 4,
    }).start(() => {
      setIsExpanded(true);
      isExpandedRef.current = true;
    });
  };

  const collapse = () => {
    Animated.spring(animatedValue, {
      toValue: 0,
      useNativeDriver: false,
      bounciness: 4,
    }).start(() => {
      setIsExpanded(false);
      isExpandedRef.current = false;
    });
  };

  // Configure PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Capture only significant vertical swipes to prevent accidental triggering
        return Math.abs(gestureState.dy) > 15;
      },
      onPanResponderGrant: () => {
        // Optional initialization during gesture start
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const threshold = 180; // height threshold for gesture mapping
        if (isExpandedRef.current) {
          // Swiping down to collapse: dy > 0 represents swipe down
          const progress = gestureState.dy / threshold;
          const newValue = Math.max(0, Math.min(1, 1 - progress));
          animatedValue.setValue(newValue);
        } else {
          // Swiping up to expand: dy < 0 represents swipe up
          const progress = -gestureState.dy / threshold;
          const newValue = Math.max(0, Math.min(1, progress));
          animatedValue.setValue(newValue);
        }
      },
      onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (isExpandedRef.current) {
          // If swipe-down is substantial or velocity is high, collapse
          if (gestureState.dy > 50 || gestureState.vy > 0.5) {
            collapse();
          } else {
            expand();
          }
        } else {
          // If swipe-up is substantial or velocity is high, expand
          if (gestureState.dy < -50 || gestureState.vy < -0.5) {
            expand();
          } else {
            collapse();
          }
        }
      },
    })
  ).current;

  // Override background of inner container to transparent using React.cloneElement
  const child = React.Children.only(children);
  const overriddenChild = React.isValidElement(child)
    ? React.cloneElement(child as React.ReactElement<any>, {
        style: StyleSheet.flatten([
          (child.props as any).style,
          { backgroundColor: 'transparent' },
        ]),
      })
    : children;

  // Animate the layout dimensions of the card wrapper
  const animatedWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [260, layout.width],
  });

  const animatedHeight = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [340, layout.height],
  });

  const closeButtonOpacity = animatedValue.interpolate({
    inputRange: [0.8, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.outerContainer} onLayout={handleLayout} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.animatedWrapper,
          {
            width: animatedWidth,
            height: animatedHeight,
          },
        ]}
      >
        {overriddenChild}

        {/* Close affordance, visible only when expanded */}
        <Animated.View style={[styles.closeButtonContainer, { opacity: closeButtonOpacity }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={collapse}
            activeOpacity={0.7}
            disabled={!isExpanded}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  animatedWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 999,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 191, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 191, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: -1,
  },
});
