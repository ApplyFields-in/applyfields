'use client';

/** Ring + dot burst shown over a bookmark button for one save. Re-mount (key) to replay. */
export function SaveBurst() {
  return (
    <span className="af-save-fx pointer-events-none absolute inset-0 z-30 flex items-center justify-center" aria-hidden="true">
      <span
        className="absolute inset-0 rounded-full border-2 border-[#0e7bf4]"
        style={{ animation: 'af-save-ring 0.6s ease-out forwards' }}
      />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
        <span
          key={deg}
          className="absolute size-2 rounded-full"
          style={{
            ['--deg' as string]: `${deg}deg`,
            backgroundColor: ['#0e7bf4', '#38bdf8', '#082046', '#f59e0b'][i % 4],
            animation: 'af-save-dot 0.7s cubic-bezier(0.25, 0.7, 0.3, 1) forwards',
          }}
        />
      ))}
    </span>
  );
}
