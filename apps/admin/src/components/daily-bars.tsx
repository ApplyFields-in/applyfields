/**
 * One series, one bar per day (server-rendered SVG, no chart library).
 * Hover any day for its exact number; "Show numbers" gives the same data as a table.
 */
export function DailyBars({ title, data, unit }: { title: string; data: Array<{ day: string; count: number }>; unit: string }) {
  const max = Math.max(0, ...data.map((d) => d.count));
  const total = data.reduce((n, d) => n + d.count, 0);
  const W = 10; // per-day slot in viewBox units; bars are 8 wide with a 2 gap
  const H = 100;
  const fmt = (day: string) =>
    new Date(`${day}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <figure className="rounded-2xl border border-line bg-white p-5">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-teal">{title}</span>
        <span className="font-mono text-xs text-teal/70">
          {total.toLocaleString('en-IN')} {unit}
        </span>
      </figcaption>

      {max === 0 ? (
        <p className="py-10 text-center text-xs text-teal/60">Nothing recorded in this period yet.</p>
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            {/* y reference: only the top value, the grid stays out of the way */}
            <span className="w-8 shrink-0 text-right font-mono text-[10px] text-teal/60">{max}</span>
            <svg
              viewBox={`0 0 ${data.length * W} ${H}`}
              preserveAspectRatio="none"
              className="h-32 w-full"
              role="img"
              aria-label={`${title}: ${total} ${unit} over ${data.length} days, highest ${max} in a day`}
            >
              <line x1="0" y1={H} x2={data.length * W} y2={H} stroke="#c9d6e6" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
              {data.map((d, i) => {
                const h = (d.count / max) * (H - 4);
                return (
                  <g key={d.day} className="group">
                    <title>{`${fmt(d.day)}: ${d.count.toLocaleString('en-IN')} ${unit}`}</title>
                    {/* full-height hit area, bigger than the bar */}
                    <rect x={i * W} y="0" width={W} height={H} fill="transparent" />
                    {d.count > 0 && (
                      <rect
                        x={i * W + 1}
                        y={H - h}
                        width={W - 2}
                        height={h}
                        rx="1"
                        fill="#0e7bf4"
                        className="transition-opacity group-hover:opacity-70"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="ml-10 mt-1 flex justify-between font-mono text-[10px] text-teal/60">
            <span>{fmt(data[0].day)}</span>
            <span>{fmt(data[data.length - 1].day)}</span>
          </div>
        </>
      )}

      <details className="mt-3 text-xs text-teal/80">
        <summary className="cursor-pointer font-semibold text-teal/70">Show numbers</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left text-teal/60">
              <th className="py-1 font-semibold">Day</th>
              <th className="py-1 text-right font-semibold">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.day} className="border-t border-line">
                <td className="py-1">{fmt(d.day)}</td>
                <td className="py-1 text-right font-mono">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
