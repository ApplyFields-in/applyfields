'use client';

import React from 'react';
import Link from 'next/link';
import { Badge, buttonClass, cn } from '@applyfields/ui';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  Download,
  ExternalLink,
  Megaphone,
} from 'lucide-react';

export interface CorrigendumBulletin {
  id: string;
  category:
    | 'admit_card'
    | 'answer_key'
    | 'date_extension'
    | 'vacancy_revision'
    | 'syllabus_change'
    | 'postponement'
    | 'other';
  title: string;
  opportunity_title: string;
  opportunity_slug?: string;
  summary: string;
  effective_date: string;
  new_deadline?: string | null;
  official_pdf_url?: string | null;
}

const CATEGORY_STYLES: Record<
  string,
  { label: string; tone: 'teal' | 'celadon' | 'tea' | 'outline' }
> = {
  admit_card: { label: 'Admit Card Released', tone: 'celadon' },
  answer_key: { label: 'Answer Key Live', tone: 'teal' },
  date_extension: { label: 'Deadline Extended', tone: 'tea' },
  vacancy_revision: { label: 'Vacancy Revised', tone: 'teal' },
  syllabus_change: { label: 'Syllabus Amendment', tone: 'outline' },
  postponement: { label: 'Exam Rescheduled', tone: 'outline' },
};

interface Props {
  bulletins: CorrigendumBulletin[];
  className?: string;
}

export function DashboardCorrigendumBanner({ bulletins, className }: Props) {
  if (!bulletins || bulletins.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-xl bg-teal/10 text-teal">
            <Megaphone className="size-3.5" />
          </span>
          <h3 className="text-xs font-black uppercase tracking-wider text-teal">
            Active Corrigenda &amp; Urgent Exam Bulletins
          </h3>
        </div>
        <span className="text-[10px] font-bold text-teal/60">
          {bulletins.length} Official Update{bulletins.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2.5">
        {bulletins.map((item) => {
          const meta = CATEGORY_STYLES[item.category] ?? {
            label: 'Official Notice',
            tone: 'outline',
          };

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-teal/25 bg-linear-to-r from-cream/90 via-canvas to-cream/50 p-4 shadow-sm hover:border-teal/40 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal/10 pb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={meta.tone} className="text-[10px] font-bold uppercase tracking-wider">
                    {meta.label}
                  </Badge>
                  <span className="text-xs font-extrabold text-teal">
                    {item.opportunity_title}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-teal/70 font-mono">
                  <Calendar className="size-3" />
                  <span>Effective: {item.effective_date}</span>
                </div>
              </div>

              <div className="mt-2.5 space-y-1">
                <h4 className="text-xs font-bold text-teal leading-snug">
                  {item.title}
                </h4>
                <p className="text-xs text-teal/80 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              {item.new_deadline && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-tea/70 px-2.5 py-1 text-[11px] font-bold text-teal border border-teal/15">
                  <span>Revised Registration Deadline:</span>
                  <span className="font-mono text-emerald-800">{item.new_deadline}</span>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-teal/10 text-xs">
                {item.opportunity_slug ? (
                  <Link
                    href={`/opportunities/${item.opportunity_slug}`}
                    className="font-bold text-teal hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    View Opportunity Details <ArrowRight className="size-3" />
                  </Link>
                ) : (
                  <span />
                )}

                {item.official_pdf_url && (
                  <a
                    href={item.official_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass({
                      variant: 'secondary',
                      size: 'sm',
                      className: 'gap-1 text-[11px] h-7 px-2.5 rounded-lg font-bold',
                    })}
                  >
                    <Download className="size-3" /> Download Gazette Notice
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

