'use client';

import { useEffect, useRef, useState } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * Full-screen "No internet" overlay with a looping Lottie. Shows when the browser goes offline,
 * hides when it's back. The player and the animation (~1.3 MB, 127 frames) can't be fetched once
 * the connection is gone, so they're loaded ahead into memory when the page is idle; skipped on
 * Data Saver, where the overlay shows without the animation.
 */
type Player = typeof import('lottie-web/build/player/lottie_light').default;
let preload: Promise<[Player, unknown]> | null = null;

function warm(): Promise<[Player, unknown]> {
  preload ??= Promise.all([
    import('lottie-web/build/player/lottie_light').then((m) => m.default),
    fetch('/lottie/no-internet.json').then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<unknown>;
    }),
  ]).catch((err: unknown) => {
    preload = null; // try again next time
    throw err;
  });
  return preload;
}

/** The frames have a vignette; fade their edges into the page so no rectangle shows. */
const EDGES = 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent), linear-gradient(to bottom, transparent, #000 8%, #000 92%, transparent)';
const FADE_EDGES = {
  maskImage: EDGES,
  maskComposite: 'intersect',
  WebkitMaskImage: EDGES,
  WebkitMaskComposite: 'source-in',
} as const;

export function OfflineScreen() {
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [animated, setAnimated] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      setOffline(!navigator.onLine);
      if (navigator.onLine) setDismissed(false); // the next drop shows the screen again
    };
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);

    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 3000));
    if (!saveData && navigator.onLine) idle(() => void warm().catch(() => null));

    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  const show = offline && !dismissed;

  useEffect(() => {
    if (!show || !preload || !box.current) return;
    let anim: ReturnType<Player['loadAnimation']> | null = null;
    let gone = false;
    preload
      .then(([lottie, data]) => {
        if (gone || !box.current) return;
        anim = lottie.loadAnimation({
          container: box.current,
          renderer: 'svg',
          loop: true,
          // Plays even with reduced motion on (Windows "Animation effects" off): a calm loop is the point here.
          autoplay: true,
          animationData: structuredClone(data), // lottie mutates its input; keep the cached copy clean
        });
        setAnimated(true);
      })
      .catch(() => null);
    return () => {
      gone = true;
      anim?.destroy();
      setAnimated(false);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-title"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-[#f1f1f1] px-4 py-8 text-center"
    >
      <div className="relative aspect-video w-full max-w-2xl" style={FADE_EDGES} aria-hidden="true">
        {/* lottie owns this node's children, so React keeps the fallback outside it */}
        <div ref={box} className="absolute inset-0" />
        {!animated && <WifiOff className="absolute inset-0 m-auto size-16 text-teal/40" />}
      </div>
      <h2 id="offline-title" className="mt-4 text-2xl font-extrabold text-teal">
        No internet connection
      </h2>
      <p className="mt-2 max-w-md text-teal/70">
        Check your mobile data or Wi-Fi. This page will come back by itself once you&apos;re connected.
      </p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-3 sm:max-w-md sm:flex-row">
        <button
          type="button"
          onClick={() => setOffline(!navigator.onLine)}
          className="min-h-11 flex-1 rounded-full bg-sea px-5 font-bold text-white hover:bg-sea/90"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="min-h-11 flex-1 rounded-full border border-line bg-white px-5 font-bold text-teal hover:bg-paper"
        >
          Continue offline
        </button>
      </div>
    </div>
  );
}
