'use client';

/**
 * Fieldy, the chatbot mascot, as a Lottie that changes with the conversation.
 * Files: public/mascot/<mood>.json, made by scripts/mascot-lottie.py from the
 * artist's exports. Each mood is fetched the first time it is shown (~200 KB);
 * until then, and for 'idle', the still poster.webp is shown instead.
 */
import { useEffect, useRef } from 'react';
import type { AnimationItem, LottiePlayer } from 'lottie-web';

export type FieldyMood = 'idle' | 'greeting' | 'working' | 'thinking' | 'success' | 'bored-idle';
type AnimatedMood = Exclude<FieldyMood, 'idle'>;

/** One-shots play once and hold their last frame; the rest loop until the mood changes. */
const LOOPS: Record<AnimatedMood, boolean> = {
  greeting: false,
  success: false,
  working: true,
  thinking: true,
  'bored-idle': true,
};

let player: Promise<LottiePlayer> | null = null;
const files = new Map<string, Promise<string>>();

function loadPlayer(): Promise<LottiePlayer> {
  // Light canvas build: no expression engine (these files have none), one <canvas> per mascot.
  if (!player) {
    player = import('lottie-web/build/player/lottie_light_canvas').then((m) => m.default);
    player.catch(() => (player = null)); // a later attempt retries
  }
  return player;
}

function loadMood(mood: AnimatedMood): Promise<string> {
  let file = files.get(mood);
  if (!file) {
    file = fetch(`/mascot/${mood}.json`).then((r) => {
      if (!r.ok) throw new Error(`mascot ${mood}: ${r.status}`);
      return r.text();
    });
    file.catch(() => files.delete(mood)); // a later attempt retries
    files.set(mood, file);
  }
  return file;
}

/** Warm the cache, e.g. 'thinking' as soon as the chat opens so the first answer has no gap. */
export function prefetchFieldy(...moods: AnimatedMood[]): void {
  loadPlayer().catch(() => {});
  for (const m of moods) loadMood(m).catch(() => {});
}

interface Shown {
  anim: AnimationItem;
  layer: HTMLDivElement;
}

/** Replace what is on screen. The old mood keeps playing until the new one is ready: no blank frame. */
function swapIn(shown: { current: Shown | null }, next: Shown | null): void {
  const prev = shown.current;
  if (prev && prev !== next) {
    prev.anim.destroy();
    prev.layer.remove();
  }
  shown.current = next;
}

export function FieldyMascot({
  mood,
  replay = 0,
  className = '',
}: {
  mood: FieldyMood;
  /** bump it to play the same mood again (e.g. wave when tapped) */
  replay?: number;
  /** sizes the box; the art is square */
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const shown = useRef<Shown | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (mood === 'idle') {
      swapIn(shown, null); // back to the poster
      return;
    }
    let cancelled = false;
    let pending: Shown | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    Promise.all([loadPlayer(), loadMood(mood)])
      .then(([lottie, json]) => {
        if (cancelled) return;
        const layer = document.createElement('div');
        layer.className = 'absolute inset-0 opacity-0';
        box.appendChild(layer);
        const anim = lottie.loadAnimation({
          container: layer,
          renderer: 'canvas',
          loop: LOOPS[mood],
          autoplay: !still,
          animationData: JSON.parse(json), // lottie mutates it: a fresh copy per instance
          rendererSettings: { preserveAspectRatio: 'xMidYMid slice', clearCanvas: true },
        });
        pending = { anim, layer };
        const show = () => {
          if (cancelled || !pending) return;
          if (still) anim.goToAndStop(LOOPS[mood] ? 0 : anim.totalFrames - 1, true);
          layer.classList.remove('opacity-0');
          swapIn(shown, pending);
          pending = null;
        };
        anim.addEventListener('loaded_images', show);
        timer = setTimeout(show, 1500); // never stay stuck on the previous mood
      })
      .catch(() => {
        // Offline or missing file: the poster (or the previous mood) simply stays.
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (pending) {
        pending.anim.destroy();
        pending.layer.remove();
      }
    };
  }, [mood, replay]);

  useEffect(() => () => swapIn(shown, null), []);

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      className={`relative overflow-hidden bg-[#e3e3e3] bg-cover bg-center ${className}`}
      style={{ backgroundImage: 'url(/mascot/poster.webp)' }}
    />
  );
}
