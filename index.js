import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';
import OverlayRoot from './src/screens/OverlayRoot';
import { warmUpSelectedCompanion } from './src/services/avatarPreloader';

// Register standard App under 'main' via registerRootComponent
registerRootComponent(App);

// Register TulipOverlay component
AppRegistry.registerComponent('TulipOverlay', () => OverlayRoot);

// Safely trigger fire-and-forget async model preloading/warming
setTimeout(() => {
  warmUpSelectedCompanion().catch((err) => {
    console.error('[index.js] Background avatar warming failed:', err);
  });
}, 0);
