'use client';

/**
 * Small animated icons (react-useanimations: ~8 kB player + ~2 kB per icon, SVG, follows
 * currentColor, stays still when the user prefers reduced motion). Import only from here so the
 * set of icons in the bundle stays this short list.
 */
import UseAnimations from 'react-useanimations';
import bookmark from 'react-useanimations/lib/bookmark';
import checkCircle from 'react-useanimations/lib/checkCircle';
import loading from 'react-useanimations/lib/loading';
import notification4 from 'react-useanimations/lib/notification4';

/** Loader for buttons and pages, in place of a spinning icon. Decorative unless `label` is set. */
export function Spinner({ size = 16, className, label }: { size?: number; className?: string; label?: string }) {
  return (
    <UseAnimations
      animation={loading}
      size={size}
      className={className}
      aria-label={label}
      autoplay
      speed={1.2}
    />
  );
}

/** A check that draws itself once when it appears: success toasts and notices. */
export function SuccessCheck({ size = 16, className }: { size?: number; className?: string }) {
  return <UseAnimations animation={checkCircle} size={size} className={className} autoplay loop={false} />;
}

/** Bookmark that fills/empties when `saved` changes. The surrounding <button> handles the click. */
export function BookmarkIcon({ saved, size = 16 }: { saved: boolean; size?: number }) {
  return <UseAnimations animation={bookmark} active={saved} size={size} fillColor="currentColor" />;
}

/** Bell: rings while pointed at (nav links), or once when it appears with `ring` (alerts turned on). */
export function BellIcon({ size = 20, ring = false, className }: { size?: number; ring?: boolean; className?: string }) {
  return ring ? (
    <UseAnimations animation={notification4} size={size} className={className} autoplay loop={false} />
  ) : (
    <UseAnimations animation={notification4} size={size} className={className} interaction="hover-loop" autoplay={false} />
  );
}
