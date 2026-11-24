/**
 * Animated icons for the apps: the same useAnimations Lottie data the websites use
 * (react-useanimations/lib/*, ~2-3 kB each), played by lottie-react-native.
 * Same file in apps/mobile, apps/partner-mobile and apps/admin-mobile — keep them in sync.
 *
 * The icons are drawn in black; tint() recolours every stroke and fill to the colour asked for.
 * With "Reduce motion" on, checks and bookmarks jump to their end state; loaders still turn
 * (that is the only sign something is happening).
 */
import LottieView, { type AnimationObject } from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import bookmark from 'react-useanimations/lib/bookmark';
import checkCircle from 'react-useanimations/lib/checkCircle';
import loading from 'react-useanimations/lib/loading';

type Icon = { animationData: object };

const tinted = new Map<string, AnimationObject>();

/** Progress of the last drawn frame. Layers end at `op` (exclusive), so progress 1 can be blank. */
const end = (icon: Icon) => {
  const { op } = icon.animationData as { op: number };
  return (op - 1) / op;
};

/** Copy of the animation with every solid stroke/fill colour replaced by `hex`. Cached per icon + colour. */
function tint(icon: Icon, hex: string): AnimationObject {
  const key = `${(icon.animationData as { nm?: string }).nm}|${hex}`;
  const hit = tinted.get(key);
  if (hit) return hit;
  const n = parseInt(hex.slice(1, 7), 16);
  const rgba = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (!v || typeof v !== 'object') return v;
    const o = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o)) out[k] = walk(o[k]);
    const c = o.c as { a?: number } | undefined;
    if ((o.ty === 'st' || o.ty === 'fl') && c && c.a === 0) out.c = { a: 0, k: rgba };
    return out;
  };
  const data = walk(icon.animationData) as AnimationObject;
  tinted.set(key, data);
  return data;
}

/** Loader in place of ActivityIndicator. */
export function Spinner({ size = 24, color }: { size?: number; color: string }) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Loading">
      <LottieView source={tint(loading, color)} autoPlay loop speed={1.2} style={{ width: size, height: size }} />
    </View>
  );
}

/** A check that draws itself once when it appears (pass a new `key` to replay). */
export function SuccessCheck({ size = 20, color }: { size?: number; color: string }) {
  const reduce = useReducedMotion();
  return (
    <LottieView
      source={tint(checkCircle, color)}
      autoPlay={!reduce}
      loop={false}
      progress={reduce ? end(checkCircle) : undefined}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Bookmark for Save buttons: fills with a short animation when `saved` turns on, and simply
 * shows the outline/filled state otherwise (first render, un-saving, reduce motion).
 */
export function BookmarkIcon({ saved, size = 18, color }: { saved: boolean; size?: number; color: string }) {
  const reduce = useReducedMotion();
  const first = useRef(true);
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setAnimate(saved);
  }, [saved]);
  const source = tint(bookmark, color);
  const style = { width: size, height: size };
  return animate && !reduce ? (
    <LottieView key="fill" source={source} autoPlay loop={false} style={style} />
  ) : (
    <LottieView key={saved ? 'on' : 'off'} source={source} progress={saved ? end(bookmark) : 0} style={style} />
  );
}
