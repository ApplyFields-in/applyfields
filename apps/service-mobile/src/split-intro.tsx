/**
 * Opening animation: the splash (same logo, size and white background as the native one in
 * app.json) takes over from the native splash, splits down the middle and both halves slide
 * off-screen. Starts on the first frame, never waits for data; skipped under Reduce Motion.
 * Same file in admin-mobile, partner-mobile and service-mobile (only the require path differs).
 */
import * as SplashScreen from 'expo-splash-screen';
import { useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';

const LOGO = require('../assets/images/splash-icon.png');
/** = expo-splash-screen `imageWidth` in app.json, so the hand-off has no jump. */
const SIZE = 200;
const DURATION = 450;

void SplashScreen.preventAutoHideAsync().catch(() => {});
// Remove the native splash instantly (Android ignores `fade` and fades for `duration`, 400 ms by default):
// a fade would play over the split and hide it. The overlay looks identical, so the hand-off is invisible.
SplashScreen.setOptions({ duration: 0, fade: false });

export function SplitIntro() {
  const { width } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const started = useRef(false);
  const [done, setDone] = useState(false);

  const start = () => {
    if (started.current) return;
    started.current = true;
    void SplashScreen.hideAsync()
      .catch(() => {})
      .then(() => AccessibilityInfo.isReduceMotionEnabled())
      .then((still) => {
        if (still) return setDone(true);
        Animated.timing(progress, {
          toValue: 1,
          duration: DURATION,
          delay: 60, // Android draws nothing until the splash is hidden: let the overlay paint first
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }).start(() => setDone(true));
      });
  };

  if (done) return null;
  const half = width / 2;
  const pane = (side: -1 | 1) => (
    <Animated.View
      style={[
        s.pane,
        {
          left: side < 0 ? 0 : half,
          width: half,
          transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, side * half] }) }],
        },
      ]}
    >
      {/* Each half shows its half of the centred logo. */}
      <Image source={LOGO} style={[s.logo, { left: (side < 0 ? half : 0) - SIZE / 2 }]} />
    </Animated.View>
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={start}>
      {pane(-1)}
      {pane(1)}
    </View>
  );
}

const s = StyleSheet.create({
  pane: { position: 'absolute', top: 0, bottom: 0, overflow: 'hidden', backgroundColor: '#ffffff' },
  logo: { position: 'absolute', top: '50%', marginTop: -SIZE / 2, width: SIZE, height: SIZE },
});
