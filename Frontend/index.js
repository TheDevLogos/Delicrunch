import { registerRootComponent } from 'expo';

// Apply safe EventTarget patch before anything else to avoid noisy Metro errors
import './patches/eventTargetSafe';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);