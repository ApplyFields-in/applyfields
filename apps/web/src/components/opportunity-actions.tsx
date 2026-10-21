'use client';

import { useState } from 'react';
import type { AgeRelaxation, CategoryCode, QualificationLevel } from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import { trackEvent } from '@/lib/analytics/tracker';
import {
  Bell,
  Bookmark,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  Share2,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';

/* ------------------------------------------------------------------ Share Button */

export function ShareButton({
  title,
  url,
  className,
}: {
  title: string;
  url?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out ${title} on ApplyFields`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall back to clipboard copy if user dismissed or cancelled share
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // clipboard write error
      }
    }
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={handleShare}
        className={cn(buttonClass({ variant: 'secondary', size: 'md' }), className)}
        title="Share this opportunity"
      >
        {copied ? (
          <>
            <Check className="size-4 text-sea" aria-hidden="true" />
            <span>Link copied!</span>
          </>
        ) : (
          <>
            <Share2 className="size-4" aria-hidden="true" />
            <span>Share</span>
          </>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ Reminder Button */

export function ReminderButton({
  title,
  deadline,
  className,
}: {
  title: string;
  deadline: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!deadline) return null;

  const targetDate = new Date(`${deadline}T23:59:59`);
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Deadline: ${title}`,
  )}&dates=${deadline.replace(/-/g, '')}T180000Z/${deadline.replace(/-/g, '')}T183000Z&details=${encodeURIComponent(
    `Last date to apply for ${title}. Complete and submit your application on the official portal before deadline.`,
  )}`;

  const downloadIcs = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ApplyFields//Application Reminder//EN
BEGIN:VEVENT
UID:${Date.now()}@applyfields.in
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${deadline.replace(/-/g, '')}T090000
DTEND:${deadline.replace(/-/g, '')}T180000
SUMMARY:Last date to apply: ${title}
DESCRIPTION:Last date to apply for ${title}. Submit your application on the official portal before the deadline.
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `reminder-${deadline}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(buttonClass({ variant: 'secondary', size: 'md' }), className)}
        title="Set a calendar reminder for the application deadline"
      >
        <Bell className="size-4" aria-hidden="true" />
        <span>Set reminder</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal/40 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 font-bold text-teal">
                <Calendar className="size-5" />
                <span>Add deadline reminder</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-teal/60 hover:bg-tea/50 hover:text-teal"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-teal/80">
              Deadline: <strong className="text-teal">{deadline}</strong>
            </p>
            <p className="mt-1 text-xs text-teal/80">
              Never miss a closing date. Sync with your preferred calendar:
            </p>

            <div className="mt-5 space-y-2.5">
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className={cn(buttonClass({ variant: 'primary', size: 'md' }), 'w-full justify-center')}
              >
                <ExternalLink className="size-4" /> Add to Google Calendar
              </a>
              <button
                type="button"
                onClick={downloadIcs}
                className={cn(buttonClass({ variant: 'secondary', size: 'md' }), 'w-full justify-center')}
              >
                <Calendar className="size-4" /> Download .ICS (Apple / Outlook)
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Check Eligibility Modal */

const QUALIFICATION_RANK: Record<string, number> = {
  '10th': 1,
  '12th': 2,
  iti: 2,
  diploma: 3,
  graduate: 4,
  post_graduate: 5,
  phd: 6,
};

export function CheckEligibilityButton({
  ageMin,
  ageMax,
  ageAsOnDate,
  relaxations,
  qualificationLevel,
  domicileStates,
  genderRule,
  className,
}: {
  ageMin: number | null;
  ageMax: number | null;
  ageAsOnDate: string | null;
  relaxations: AgeRelaxation[];
  qualificationLevel: string | null;
  domicileStates: string[];
  genderRule: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [dob, setDob] = useState('');
  const [category, setCategory] = useState<CategoryCode>('GEN');
  const [userQual, setUserQual] = useState<QualificationLevel>('graduate');
  const [submitted, setSubmitted] = useState(false);

  // Compute check
  let computedAge: number | null = null;
  if (dob) {
    const birth = new Date(dob);
    const reference = ageAsOnDate ? new Date(`${ageAsOnDate}T00:00:00`) : new Date();
    let age = reference.getFullYear() - birth.getFullYear();
    const m = reference.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && reference.getDate() < birth.getDate())) {
      age--;
    }
    computedAge = age;
  }

  // Calculate age relaxation
  const extraYears = relaxations
    .filter((r) => r.category === category || (!r.category && !r.gender))
    .reduce((acc, r) => Math.max(acc, r.years), 0);

  const effectiveMaxAge = ageMax !== null ? ageMax + extraYears : null;

  const ageMet =
    computedAge === null
      ? null
      : (ageMin === null || computedAge >= ageMin) &&
        (effectiveMaxAge === null || computedAge <= effectiveMaxAge);

  const reqRank = qualificationLevel ? QUALIFICATION_RANK[qualificationLevel.toLowerCase()] || 0 : 0;
  const userRank = QUALIFICATION_RANK[userQual] || 0;
  const qualMet = reqRank === 0 || userRank >= reqRank;

  const isEligible = (ageMet === true || ageMet === null) && qualMet;
  const btnVariant = open ? 'secondary' : 'primary';

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) {
              trackEvent('eligibility_check', {
                entity_type: 'opportunity',
                metadata: { action: 'open_checker' },
              });
            }
            return next;
          });
        }}
        className={cn(buttonClass({ variant: btnVariant, size: 'md' }), className)}
      >
        <UserCheck className="size-4" aria-hidden="true" />
        <span>{open ? 'Hide eligibility' : 'Check eligibility'}</span>
      </button>

      {open && (
        /* basis-full forces this onto its own line inside the parent flex-wrap row */
        <div className="basis-full mt-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <Card className="w-full max-w-2xl p-5">
            <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-teal">Check Your Eligibility</h3>
                <p className="mt-0.5 text-xs text-teal/70">
                  Instant eligibility verification based on notification guidelines.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-teal/60 hover:bg-tea/50 hover:text-teal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-teal">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value);
                    setSubmitted(true);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm focus:border-teal focus:outline-none"
                />
                {ageAsOnDate && (
                  <span className="mt-1 block text-[11px] text-teal/70">
                    Age calculated as on {ageAsOnDate}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-teal">Reservation Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as CategoryCode);
                    setSubmitted(true);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm focus:border-teal focus:outline-none"
                >
                  <option value="GEN">General / UR</option>
                  <option value="OBC">OBC (Other Backward Classes)</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                  <option value="EWS">EWS (Economically Weaker Section)</option>
                  <option value="PWBD">PwBD (Persons with Benchmark Disabilities)</option>
                  <option value="EXS">Ex-Servicemen</option>
                </select>
                {extraYears > 0 && (
                  <span className="mt-1 block text-[11px] text-sea font-semibold">
                    +{extraYears} yrs relaxation for {category}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-teal">Highest Qualification</label>
                <select
                  value={userQual}
                  onChange={(e) => {
                    setUserQual(e.target.value as QualificationLevel);
                    setSubmitted(true);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm focus:border-teal focus:outline-none"
                >
                  <option value="10th">10th pass / Matriculation</option>
                  <option value="12th">12th / Intermediate / Higher Secondary</option>
                  <option value="iti">ITI</option>
                  <option value="diploma">Polytechnic / Diploma</option>
                  <option value="graduate">Graduate (B.Tech, B.Sc, B.Com, BA...)</option>
                  <option value="post_graduate">Post-Graduate (M.Tech, M.Sc, MBA, MA...)</option>
                  <option value="phd">PhD / Doctorate</option>
                </select>
              </div>
            </div>

            {submitted && (
              <div
                className={cn(
                  'mt-4 rounded-2xl p-4 text-xs',
                  isEligible ? 'bg-celadon/40 border border-teal/20' : 'bg-red-50 border border-red-200',
                )}
              >
                <div className="flex items-center gap-2 text-sm font-bold">
                  {isEligible ? (
                    <>
                      <CheckCircle2 className="size-5 text-sea" />
                      <span className="text-teal">You appear eligible to apply!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-5 text-red-600" />
                      <span className="text-red-800">You may not meet all criteria</span>
                    </>
                  )}
                </div>

                <ul className="mt-3 space-y-2 border-t border-teal/10 pt-2.5">
                  <li className="flex items-start gap-2">
                    {ageMet === null ? (
                      <HelpCircle className="mt-0.5 size-3.5 text-teal/60 shrink-0" />
                    ) : ageMet ? (
                      <Check className="mt-0.5 size-3.5 text-sea shrink-0" />
                    ) : (
                      <X className="mt-0.5 size-3.5 text-red-600 shrink-0" />
                    )}
                    <div>
                      <strong>Age: </strong>
                      {ageMin !== null ? `${ageMin} to ` : 'Up to '}
                      {ageMax !== null ? `${ageMax} years` : 'No max limit'}
                      {extraYears > 0 ? ` (${effectiveMaxAge} with ${category} relaxation)` : ''}
                      {computedAge !== null && ` · You are ${computedAge} years old`}
                    </div>
                  </li>

                  <li className="flex items-start gap-2">
                    {qualMet ? (
                      <Check className="mt-0.5 size-3.5 text-sea shrink-0" />
                    ) : (
                      <X className="mt-0.5 size-3.5 text-red-600 shrink-0" />
                    )}
                    <div>
                      <strong>Education: </strong>
                      Required {qualificationLevel || 'See notification'} · You selected {userQual}
                    </div>
                  </li>

                  {domicileStates.length > 0 && !domicileStates.includes('ALL') && (
                    <li className="flex items-start gap-2 text-teal/80">
                      <HelpCircle className="mt-0.5 size-3.5 text-teal/60 shrink-0" />
                      <div>
                        <strong>Domicile: </strong>
                        Restricted to {domicileStates.join(', ')}
                      </div>
                    </li>
                  )}
                </ul>
                <p className="mt-3 text-[11px] text-teal/70 italic">
                  Automated guideline only. Refer to the official notification for exact requirements.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
