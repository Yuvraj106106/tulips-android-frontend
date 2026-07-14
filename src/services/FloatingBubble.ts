import { NativeModules, Platform } from 'react-native';

const { FloatingBubbleModule } = NativeModules;
const isLinked = !!FloatingBubbleModule;

interface FloatingBubbleInterface {
  isPermissionGranted(): Promise<boolean>;
  requestPermission(): void;
  startBubble(): Promise<boolean>;
  stopBubble(): Promise<boolean>;
  isServiceRunning(): Promise<boolean>;
}

const FloatingBubble: FloatingBubbleInterface = {
  isPermissionGranted: () => {
    if (Platform.OS !== 'android' || !isLinked) return Promise.resolve(false);
    return FloatingBubbleModule.isPermissionGranted();
  },
  requestPermission: () => {
    if (Platform.OS === 'android' && isLinked) {
      FloatingBubbleModule.requestPermission();
    } else if (Platform.OS === 'android') {
      console.warn('FloatingBubbleModule not linked — rebuild native app.');
    }
  },
  startBubble: () => {
    if (Platform.OS !== 'android' || !isLinked) return Promise.resolve(false);
    return FloatingBubbleModule.startBubble();
  },
  stopBubble: () => {
    if (Platform.OS !== 'android' || !isLinked) return Promise.resolve(false);
    return FloatingBubbleModule.stopBubble();
  },
  isServiceRunning: () => {
    if (Platform.OS !== 'android' || !isLinked) return Promise.resolve(false);
    return FloatingBubbleModule.isServiceRunning();
  },
};

export default FloatingBubble;
