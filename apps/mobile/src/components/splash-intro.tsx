/**
 * Animated launch intro: plays once per cold start over the app (which keeps loading
 * underneath), then fades out. Tap anywhere to skip. Silent (Lottie has no audio).
 * Skipped entirely when the phone has "reduce motion" on.
 */
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet } from 'react-native';

// Keep the native splash up until the intro's first frame is ready, so there's no blank flash.
SplashScreen.preventAutoHideAsync().catch(() => {});

const INTRO = require('../../assets/splash/splash.json');
const BACKGROUND = '#f0f4f8'; // same as the native splash in app.json

export function SplashIntro() {
  const [done, setDone] = useState(false);
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (reduce) {
          SplashScreen.hideAsync().catch(() => {});
          setDone(true);
        }
      })
      .catch(() => {});
  }, []);

  const finish = () =>
    Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setDone(true));

  if (done) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity, backgroundColor: BACKGROUND, zIndex: 100 }]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={finish}
        accessibilityRole="button"
        accessibilityLabel="Skip intro"
      >
        <LottieView
          source={INTRO}
          autoPlay
          loop={false}
          resizeMode="contain"
          style={StyleSheet.absoluteFill}
          onAnimationLoaded={() => SplashScreen.hideAsync().catch(() => {})}
          onAnimationFinish={(cancelled) => !cancelled && finish()}
        />
      </Pressable>
    </Animated.View>
  );
}
