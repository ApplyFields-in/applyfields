import { Card, SectionTitle } from '@applyfields/ui';
import { PieChart, Users } from 'lucide-react';

interface VacanciesDonutChartProps {
  categories: Record<string, number> | null | undefined;
  total?: number | null;
  title?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  UR: '#114B5F', // Teal
  GEN: '#114B5F',
  General: '#114B5F',
  OBC: '#1A936F', // Sea
  'OBC-NCL': '#1A936F',
  SC: '#88D498', // Celadon
  ST: '#56ab91',
  EWS: '#d4a373', // Warm accent
  PWD: '#83c5be',
  PwBD: '#83c5be',
  ESM: '#006d77',
  Other: '#C6DABF',
};

const FALLBACK_PALETTE = ['#114B5F', '#1A936F', '#88D498', '#d4a373', '#56ab91', '#006d77', '#C6DABF'];

export function VacanciesDonutChart({ categories, total, title = 'Vacancies by Category' }: VacanciesDonutChartProps) {
  if (!categories || Object.keys(categories).length < 2) {
    return null;
  }

  const entries = Object.entries(categories).filter(([_, count]) => count > 0);
  if (entries.length < 2) return null;

  const categorySum = entries.reduce((acc, [_, count]) => acc + count, 0);
  const displayTotal = total && total >= categorySum ? total : categorySum;

  // Compute SVG arc segments
  // Circumference of radius 40 circle = 2 * PI * 40 = 251.327
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const segments = entries.map(([cat, count], idx) => {
    const percent = count / displayTotal;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -(cumulativePercent * circumference);
    cumulativePercent += percent;
    const color = CATEGORY_COLORS[cat] || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
    return {
      cat,
      count,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
      color,
    };
  });

  return (
    <div className="rounded-2xl border border-line bg-canvas/60 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <PieChart className="size-4 text-teal" aria-hidden="true" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-teal">{title}</h4>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 justify-around">
        {/* SVG Donut */}
        <div className="relative size-36 shrink-0">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#E8ECE9"
              strokeWidth="14"
            />
            {/* Slices */}
            {segments.map((seg) => (
              <circle
                key={seg.cat}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            ))}
          </svg>
          {/* Donut Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-extrabold text-teal leading-none">
              {displayTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] uppercase font-semibold text-teal/60 mt-0.5">
              Seats
            </span>
          </div>
        </div>

        {/* Legend Grid */}
        <div className="w-full sm:max-w-xs grid grid-cols-2 gap-2 text-xs">
          {segments.map((seg) => (
            <div
              key={seg.cat}
              className="flex items-center justify-between gap-2 rounded-lg border border-line/60 bg-canvas p-2"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                  aria-hidden="true"
                />
                <span className="font-bold text-teal truncate">{seg.cat}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-extrabold text-teal">{seg.count}</span>
                <span className="text-[10px] text-teal/50 ml-1">({seg.percent}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
