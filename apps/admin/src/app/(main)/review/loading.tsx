/** Shown instantly while a page / filter / sort of the review queue loads. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading the review queue" className="animate-pulse">
      <div className="mb-6 h-14 w-80 max-w-full rounded-2xl bg-teal/10" />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[72px] rounded-3xl bg-teal/8" />
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[96, 140, 120, 130, 80, 70].map((w, i) => (
          <div key={i} className="h-8 rounded-full bg-teal/10" style={{ width: w }} />
        ))}
      </div>
      <div className="overflow-hidden rounded-3xl bg-white/70">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-teal/5 px-5 py-4">
            <div className="size-4 rounded bg-teal/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 rounded bg-teal/10" />
              <div className="h-3 w-1/3 rounded bg-teal/8" />
            </div>
            <div className="hidden h-7 w-40 rounded-lg bg-teal/8 lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
