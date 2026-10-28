import type { ReviewDate } from '@applyfields/types';
import { Badge } from '@applyfields/ui';
import { Check, Clock, Bell, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/format';

interface TimelineStep {
  id: string;
  label: string;
  dateText: string;
  isTentative?: boolean;
  status: 'completed' | 'current' | 'upcoming';
  note?: string | null;
}

export function OpportunityTimelineStepper({
  dates = [],
  applicationEnd,
  publishedAt,
  daysLeft,
}: {
  dates?: ReviewDate[];
  applicationEnd?: string | null;
  publishedAt?: string | null;
  daysLeft?: number | null;
}) {
  const today = new Date().toISOString().slice(0, 10);

  // Find relevant dates by kind
  const notifDate = dates.find((d) => d.kind === 'notification_date')?.date || publishedAt;
  const appStart = dates.find((d) => d.kind === 'application_start');
  const appEnd = dates.find((d) => d.kind === 'application_end')?.date || applicationEnd;
  const examDateObj = dates.find((d) => d.kind === 'exam_date' || d.kind === 'interview');
  const resultDateObj = dates.find((d) => d.kind === 'result' || d.kind === 'counselling');

  // Determine stage statuses
  const isAppOpen = daysLeft !== null && daysLeft !== undefined ? daysLeft >= 0 : (appEnd ? appEnd >= today : true);
  const isAppClosed = daysLeft !== null && daysLeft !== undefined ? daysLeft < 0 : (appEnd ? appEnd < today : false);

  const examDate = examDateObj?.date;
  const examPast = examDate ? examDate < today : false;

  const resultDate = resultDateObj?.date;
  const resultPast = resultDate ? resultDate < today : false;

  const steps: TimelineStep[] = [
    {
      id: 'notification',
      label: 'Notification',
      dateText: notifDate ? formatDate(notifDate.slice(0, 10)) : 'Announced',
      status: 'completed',
    },
    {
      id: 'apply',
      label: 'Apply Window',
      dateText: appEnd
        ? (appStart ? `${formatDate(appStart.date)} – ${formatDate(appEnd)}` : `Till ${formatDate(appEnd)}`)
        : 'Open',
      status: isAppOpen ? 'current' : 'completed',
      isTentative: false,
    },
    {
      id: 'exam',
      label: 'Exam / Selection',
      dateText: examDate ? formatDate(examDate) : 'To be announced',
      isTentative: examDateObj?.is_tentative ?? !examDate,
      status: isAppOpen
        ? 'upcoming'
        : (!examPast ? 'current' : 'completed'),
      note: examDateObj?.note,
    },
    {
      id: 'results',
      label: 'Results & Merit',
      dateText: resultDate ? formatDate(resultDate) : 'After exam',
      isTentative: resultDateObj?.is_tentative ?? true,
      status: resultPast
        ? 'completed'
        : (!isAppOpen && examPast ? 'current' : 'upcoming'),
      note: resultDateObj?.note,
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-line bg-canvas/80 p-4 sm:p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-teal" aria-hidden="true" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal">Recruitment Timeline</h3>
        </div>
        {isAppOpen && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-celadon/30 px-2.5 py-0.5 text-[11px] font-bold text-teal">
            <span className="size-2 rounded-full bg-sea animate-pulse" />
            Applications Live
          </span>
        )}
      </div>

      {/* Stepper container */}
      <div className="relative mt-2">
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-2">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';

            return (
              <li key={step.id} className="relative flex flex-col">
                <div className="flex items-center">
                  <div
                    className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-teal text-cream ring-4 ring-celadon/60 shadow-clay'
                        : isCompleted
                        ? 'bg-sea text-cream shadow-xs'
                        : 'border-2 border-line bg-canvas text-teal/40'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="size-4" strokeWidth={2.5} />
                    ) : isCurrent ? (
                      <span className="relative flex size-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-celadon opacity-75" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-cream" />
                      </span>
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  {!isLast && (
                    <div
                      className={`hidden sm:block h-0.5 flex-1 transition-colors ${
                        isCompleted ? 'bg-sea' : 'bg-line'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="mt-2.5 pr-2">
                  <div className="flex items-center gap-1">
                    <p className={`text-xs font-bold ${isCurrent ? 'text-teal' : isCompleted ? 'text-teal/90' : 'text-teal/60'}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <span className="rounded bg-teal px-1 text-[9px] font-extrabold uppercase text-cream">
                        NOW
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] font-medium text-teal/70">
                    {step.dateText}
                  </p>
                  {step.isTentative && (
                    <span className="mt-0.5 inline-block text-[10px] text-teal/50 italic">
                      Tentative
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
