'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Flag, X } from 'lucide-react';
import { apiPost } from '@/lib/api';

interface ReportWrongInfoModalProps {
  targetType: 'opportunity' | 'service';
  targetSlug: string;
  targetTitle: string;
  className?: string;
  buttonLabel?: string;
  compact?: boolean;
}

const REPORT_REASONS = [
  { value: 'outdated_deadline', label: 'Outdated deadline or application date' },
  { value: 'wrong_vacancies', label: 'Incorrect vacancy breakdown or total' },
  { value: 'eligibility_mismatch', label: 'Wrong eligibility criteria or age limits' },
  { value: 'broken_official_link', label: 'Broken or wrong official commission URL' },
  { value: 'outdated_syllabus', label: 'Outdated syllabus or exam pattern' },
  { value: 'misleading_fee', label: 'Incorrect application fee structure' },
  { value: 'other', label: 'Other factual discrepancy' },
];

export function ReportWrongInfoButton({
  targetType,
  targetSlug,
  targetTitle,
  className = '',
  buttonLabel = 'Report wrong info',
  compact = false,
}: ReportWrongInfoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('outdated_deadline');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; success: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!details.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await apiPost<{ ok: boolean; report_id: string; message: string }>('/reports', {
        item_type: targetType,
        item_id: targetSlug,
        reason,
        details: details.trim(),
        reporter_email: reporterEmail.trim() || undefined,
      });

      if (res.status === 429) {
        setFeedback({
          text: 'Rate limit reached: you can submit up to 5 correction reports per 15 minutes. Please try again shortly.',
          success: false,
        });
        return;
      }

      if (res.error || !res.data?.ok) {
        throw new Error(res.error || 'Failed to submit report.');
      }

      setFeedback({
        text: 'Thank you! Your report has been submitted to our editorial team for swift verification.',
        success: true,
      });
      setDetails('');
      setReporterEmail('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setFeedback({ text: msg, success: false });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFeedback(null);
          setIsOpen(true);
        }}
        className={
          className ||
          `inline-flex items-center gap-1.5 rounded-xl border border-line bg-canvas/90 px-3 py-1.5 text-xs font-semibold text-teal/80 shadow-clay hover:bg-canvas hover:text-teal ${
            compact ? 'text-[11px] px-2.5 py-1' : ''
          }`
        }
        title="Report inaccurate syllabus, dates, or official link"
      >
        <AlertTriangle className="size-3.5 text-amber-600" aria-hidden="true" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#c4d2e3] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#c4d2e3]/60 pb-3">
              <div className="flex items-center gap-2 text-amber-700">
                <Flag className="size-4" />
                <h3 className="text-sm font-bold text-[#082046]">Report Inaccurate Info</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-[#536780] hover:bg-[#F0F4F8]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 rounded-xl bg-[#F8FBFF] p-3 text-xs border border-[#c4d2e3]/50">
              <span className="font-semibold text-[#536780]">Opportunity / Service:</span>
              <p className="font-bold text-[#082046] truncate">{targetTitle}</p>
            </div>

            {feedback ? (
              <div
                className={`mt-4 rounded-2xl border p-4 text-xs font-semibold ${
                  feedback.success
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {feedback.success ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <p>{feedback.text}</p>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl bg-[#082046] px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#082046]">
                    What is inaccurate?
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#082046]">
                    Correction Details &amp; Source
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Provide the accurate information and, if possible, the link to the official corrigendum/gazette notice..."
                    required
                    className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#082046]">
                    Your Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="In case our editors need to follow up"
                    className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <p className="text-[11px] text-[#536780]">
                  Submissions are rate-limited to 5 per 15 minutes to prevent spam.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#c4d2e3]/60">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-[#c4d2e3] px-3.5 py-1.5 text-xs font-semibold text-[#536780] hover:bg-[#F0F4F8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-[#082046] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#061835] disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Send Correction Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
