/**
 * Full-screen document viewer: pinch to zoom (1–6×), drag when zoomed, double-tap to zoom in/out,
 * rotate 90° for sideways phone photos. Built on the gesture-handler + reanimated already in the app.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, S, TAP } from '@/theme';

export function ZoomViewer({ uri, title, onClose }: { uri: string; title: string; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [turns, setTurns] = useState(0);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(6, Math.max(1, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value === 1) {
        x.value = withTiming(0);
        y.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      x.value = savedX.value + e.translationX;
      y.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = x.value;
      savedY.value = y.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = scale.value > 1 ? 1 : 2.5;
      scale.value = withTiming(next);
      savedScale.value = next;
      x.value = withTiming(0);
      y.value = withTiming(0);
      savedX.value = 0;
      savedY.value = 0;
    });

  const moved = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  // Rotated a quarter turn, the image's box swaps width and height so it still fits the screen.
  const sideways = turns % 2 === 1;

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent supportedOrientations={['portrait']}>
      <GestureHandlerRootView style={s.root}>
        <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
          <Animated.View style={[s.stage, moved]}>
            <Animated.Image
              source={{ uri }}
              resizeMode="contain"
              accessibilityLabel={title}
              style={{
                width: sideways ? height : width,
                height: sideways ? width : height,
                transform: [{ rotate: `${turns * 90}deg` }],
              }}
            />
          </Animated.View>
        </GestureDetector>

        <View style={[s.bar, { paddingTop: insets.top + S.sm }]}>
          <Pressable accessibilityLabel="Close" onPress={onClose} hitSlop={8} style={s.btn}>
            <Ionicons name="close" size={24} color={C.white} />
          </Pressable>
          <Text style={s.title} numberOfLines={1}>
            {title}
          </Text>
          <Pressable accessibilityLabel="Rotate" onPress={() => setTurns((t) => (t + 1) % 4)} hitSlop={8} style={s.btn}>
            <Ionicons name="refresh" size={22} color={C.white} />
          </Pressable>
        </View>
        <Text style={[s.hint, { bottom: insets.bottom + S.lg }]}>Pinch or double-tap to zoom</Text>
      </GestureHandlerRootView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingHorizontal: S.md,
    paddingBottom: S.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  btn: { width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: C.white, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  hint: { position: 'absolute', alignSelf: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 12 },
});
