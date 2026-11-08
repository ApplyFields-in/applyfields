/**
 * Fieldy, the chatbot mascot, as a Lottie that follows the conversation (same art
 * and moods as the website's chat). Files in assets/mascot/ come from
 * apps/web/scripts/mascot-lottie.py; each mood is required only when first shown.
 * The still poster sits underneath, so a mood switch never flashes empty.
 */
import LottieView, { type AnimationObject } from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Image, View, type ViewStyle } from 'react-native';

export type FieldyMood = 'idle' | 'greeting' | 'working' | 'thinking' | 'success' | 'bored-idle';
type AnimatedMood = Exclude<FieldyMood, 'idle'>;

const POSTER = require('../../assets/mascot/poster.png');

// Lazy: ~200 KB each, so they are parsed the first time the mood is needed.
const SOURCES: Record<AnimatedMood, () => AnimationObject> = {
  greeting: () => require('../../assets/mascot/greeting.json'),
  working: () => require('../../assets/mascot/working.json'),
  thinking: () => require('../../assets/mascot/thinking.json'),
  success: () => require('../../assets/mascot/success.json'),
  'bored-idle': () => require('../../assets/mascot/bored-idle.json'),
};

/** One-shots play once and hold their last frame; the rest loop until the mood changes. */
const LOOPS: Record<AnimatedMood, boolean> = {
  greeting: false,
  success: false,
  working: true,
  thinking: true,
  'bored-idle': true,
};

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

export function FieldyMascot({
  mood,
  size,
  radius = 16,
  replay = 0,
  style,
}: {
  mood: FieldyMood;
  size: number;
  radius?: number;
  /** bump it to play the same mood again (wave when tapped) */
  replay?: number;
  style?: ViewStyle;
}) {
  const reduceMotion = useReduceMotion();
  const box = { width: size, height: size, borderRadius: radius };
  return (
    <View
      style={[box, { overflow: 'hidden', backgroundColor: '#E3E3E3' }, style]}
      accessible={false}
    >
      <Image source={POSTER} style={[box, { position: 'absolute' }]} />
      {mood !== 'idle' && !reduceMotion ? (
        <LottieView
          key={`${mood}-${replay}`}
          source={SOURCES[mood]()}
          autoPlay
          loop={LOOPS[mood]}
          resizeMode="cover"
          style={box}
        />
      ) : null}
    </View>
  );
}
