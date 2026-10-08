import { Badge, Card } from '@applyfields/ui';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Landmark,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

export interface ApplyStep {
  step: number;
  title: string;
  description: string;
  platform: 'official' | 'applyfields';
  actionUrl?: string | null;
  actionLabel?: string;
  tips?: string[];
}

export function ApplyGuide({
  applyUrl,
  notificationPdfUrl,
  opportunityTitle,
  type = 'job',
}: {
  applyUrl: string | null;
  notificationPdfUrl?: string | null;
  opportunityTitle: string;
  type?: 'job' | 'exam' | 'scholarship' | 'admission';
}) {
  const steps: ApplyStep[] = [
    {
      step: 1,
      title: 'Review Notification & Eligibility',
      description:
        'Verify your age cutoff, required qualification level, and category reservation criteria against the official gazette notice.',
      platform: 'applyfields',
      tips: [
        'Use our “Check eligibility” tool above for an instant check',
        'Review the required documents checklist to ensure valid certificates',
      ],
      actionUrl: notificationPdfUrl,
      actionLabel: 'Read Official Notification PDF',
    },
    {
      step: 2,
      title: 'One-Time Registration (OTR)',
      description:
        'If applying on this government portal for the first time, complete the One-Time Registration using your Aadhaar or secondary school certificate details.',
      platform: 'official',
      tips: [
        'Keep active mobile number & email handy for OTP verification',
        'Note down your generated Registration ID / Enrollment Number safely',
      ],
      actionUrl: applyUrl,
      actionLabel: 'Go to Official Portal',
    },
    {
      step: 3,
      title: 'Fill Online Application Form',
      description:
        'Log into the official recruitment portal with your credentials. Choose your post preferences, exam centre choices, and enter academic marks.',
      platform: 'official',
      tips: [
        'Carefully verify spelling of your name as written on 10th marksheet',
        'Check category and domicile choices twice before locking',
      ],
    },
    {
      step: 4,
      title: 'Upload Scanned Documents & Photographs',
      description:
        'Upload your passport-size photo, signature, and educational/category certificates strictly according to official dimensional & file-size specs.',
      platform: 'official',
      tips: [
        'Photos should have plain background without hats or tinted glasses',
        'Keep file sizes within allowed limits (typically 20KB–50KB for photos)',
      ],
    },
    {
      step: 5,
      title: 'Pay Application Fee & Submit',
      description:
        'Pay the prescribed examination/application fee via online gateway (UPI, Net Banking, Debit/Credit card) or check fee exemption status.',
      platform: 'official',
      tips: [
        'Do not refresh page while the payment transaction is processing',
        'Save the payment transaction ID and fee acknowledgement slip',
      ],
    },
    {
      step: 6,
      title: 'Download Confirmation & Track on ApplyFields',
      description:
        'Download and print the final submitted application form with barcode. Return to ApplyFields to bookmark and track admit cards and result alerts.',
      platform: 'applyfields',
      tips: [
        'Save your application form PDF in safe storage',
        'We will notify you when exam dates, admit cards, or answer keys are released',
      ],
    },
  ];

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-teal">How to Apply — Step-by-Step Guide</h2>
          <p className="mt-0.5 text-xs text-teal/70">
            Clear separation between what to do on the official government website and what to prepare here on ApplyFields.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 font-semibold text-teal">
            <span className="size-2 rounded-full bg-teal" /> Official portal step
          </span>
          <span className="flex items-center gap-1 font-semibold text-teal">
            <span className="size-2 rounded-full bg-celadon" /> ApplyFields step
          </span>
        </div>
      </div>

      <div className="relative mt-6 space-y-6 before:absolute before:bottom-3 before:left-4 before:top-3 before:w-0.5 before:bg-line">
        {steps.map((s) => (
          <div key={s.step} className="relative flex items-start gap-4">
            <div
              className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-xs font-extrabold shadow-clay ring-4 ring-cream ${
                s.platform === 'official' ? 'bg-teal text-cream' : 'bg-celadon text-teal'
              }`}
            >
              {s.step}
            </div>

            <div className="flex-1 rounded-2xl border border-line bg-canvas/40 p-4 transition-all hover:border-teal/20 hover:bg-canvas">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-sm text-teal">{s.title}</h3>
                {s.platform === 'official' ? (
                  <Badge tone="teal" className="text-[11px]">
                    <Landmark className="size-3" aria-hidden="true" />
                    On Official Portal
                  </Badge>
                ) : (
                  <Badge tone="celadon" className="text-[11px]">
                    <ShieldCheck className="size-3" aria-hidden="true" />
                    On ApplyFields
                  </Badge>
                )}
              </div>

              <p className="mt-1.5 text-xs leading-relaxed text-teal/80">{s.description}</p>

              {s.tips && s.tips.length > 0 && (
                <ul className="mt-2.5 space-y-1 rounded-xl bg-cream/70 p-2.5 text-[11px] text-teal/80">
                  {s.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-sea font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}

              {s.actionUrl && (
                <div className="mt-3">
                  <a
                    href={s.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="clay-press inline-flex items-center gap-1.5 rounded-full bg-teal px-3.5 py-1.5 text-xs font-semibold text-cream shadow-clay hover:bg-teal/90"
                  >
                    {s.actionLabel || 'Proceed'}
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {applyUrl && (
        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-teal/15 bg-tea/30 p-4 sm:flex-row">
          <div>
            <p className="font-bold text-sm text-teal">Ready to submit your application?</p>
            <p className="text-xs text-teal/70">
              ApplyFields connects you directly to the official government recruitment authority.
            </p>
          </div>
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="clay-press inline-flex shrink-0 items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-xs font-bold text-cream shadow-clay hover:bg-teal/90"
          >
            Open Official Application Portal
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      )}
    </Card>
  );
}
