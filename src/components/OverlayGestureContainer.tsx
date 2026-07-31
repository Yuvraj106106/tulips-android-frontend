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
  Dimensions,
} from 'react-native';
import { COLORS } from '../constants/theme';

interface OverlayGestureContainerProps {
  children: React.ReactNode;
}

// AO-4 v3 (this session): the native window is now ALWAYS full-screen (see
// TulipVoiceInteractionSession.kt) - it no longer boxes RN into a small fixed
// docked frame. That means `layout.width`/`layout.height` (from onLayout below)
// now reliably equal the real full-screen bounds, and it's safe to animate all the
// way out to them. The collapsed bubble's size/position (45%/55%, bottom-right,
// with a margin) is purely a JS/CSS choice now - nothing on the native side needs
// to match it anymore.
const POPUP_WIDTH_PERCENT = 0.45;
const POPUP_HEIGHT_PERCENT = 0.55;
const POPUP_MARGIN = 8;
const screenDimensions = Dimensions.get('window');
const COLLAPSED_WIDTH = screenDimensions.width * POPUP_WIDTH_PERCENT;
const COLLAPSED_HEIGHT = screenDimensions.height * POPUP_HEIGHT_PERCENT;

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
    outputRange: [COLLAPSED_WIDTH, layout.width],
  });

  const animatedHeight = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED_HEIGHT, layout.height],
  });

  // AO-4 v3: position the card itself, rather than relying on the outer flex
  // container to center/bottom-align it. Collapsed = docked bottom-right with a
  // margin (matches the old native-docked look). Expanded = flush to all four
  // real screen edges (0 offset), which only makes sense now that the native
  // window is genuinely full-screen and there's real space to grow into.
  const animatedRight = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [POPUP_MARGIN, 0],
  });

  const animatedBottom = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [POPUP_MARGIN, 0],
  });

  const closeButtonOpacity = animatedValue.interpolate({
    inputRange: [0.8, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={styles.outerContainer}
      onLayout={handleLayout}
      pointerEvents="box-none"
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={[
          styles.animatedWrapper,
          {
            width: animatedWidth,
            height: animatedHeight,
            right: animatedRight,
            bottom: animatedBottom,
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
  },
  animatedWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
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
