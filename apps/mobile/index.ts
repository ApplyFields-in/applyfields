// Background tasks must be defined before anything renders: a headless Android run
// (the mascot icon check, the Closing soon widget) loads this bundle without ever mounting a screen.
import './src/services/mascot/IconManager';
import './src/widgets/refresh'; // registers the home-screen widget's handler (Android builds only)
import 'expo-router/entry';
