// Background tasks must be defined before anything renders: a headless Android run
// (the mascot icon check) loads this bundle without ever mounting a screen.
import './src/services/mascot/IconManager';
import 'expo-router/entry';
