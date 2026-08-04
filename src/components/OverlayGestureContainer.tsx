import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  NativeModules,
} from 'react-native';
import { COLORS } from '../constants/theme';

interface OverlayGestureContainerProps {
  children: React.ReactNode;
}

export default function OverlayGestureContainer({ children }: OverlayGestureContainerProps) {
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

  const handleClose = () => {
    NativeModules.TulipAssistantModule?.hideAssistant?.();
  };

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View style={styles.wrapper}>
        {overriddenChild}

        {/* Close affordance, always visible and active */}
        <View style={styles.closeButtonContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
