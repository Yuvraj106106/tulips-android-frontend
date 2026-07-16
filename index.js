import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';
import OverlayRoot from './src/screens/OverlayRoot';

// Register standard App under 'main' via registerRootComponent
registerRootComponent(App);

// Register TulipOverlay component
AppRegistry.registerComponent('TulipOverlay', () => OverlayRoot);
