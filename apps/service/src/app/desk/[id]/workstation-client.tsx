'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Phone,
  Building,
  User,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  X,
  HelpCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Eye,
  Download,
  Lock,
  RotateCw,
  ZoomIn,
} from 'lucide-react';
import { ServiceDeskRequest, fromBooking } from '@/lib/service-desk-data';
import {
  getBookingById,
  getBookingMessages,
  getBookingSlipUrl,
  getSharedDocumentUrl,
  markBookingFiled,
  sendBookingMessage,
  setBookingFixStatus,
  startBookingWithCode,
} from '@/lib/api';
import { STATUS_CONFIG } from '../operator-queue-client';

interface WorkstationClientProps {
  initialRequest: ServiceDeskRequest;
}

const SLIP_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
type SlipType = (typeof SLIP_TYPES)[number];
const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const APP_NO = /^[A-Za-z0-9][A-Za-z0-9\-/. ]{3,59}$/;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** Loads a real service request (signed-in partner operator) and opens the workstation on it. */
export function LiveWorkstation({ id }: { id: string }) {
  const [request, setRequest] = useState<ServiceDeskRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBookingById(id).then((res) => {
      if (res.data) setRequest(fromBooking(res.data));
      else setError(res.status === 401 ? 'Sign in with your partner centre account.' : res.error);
    });
  }, [id]);

  if (request) return <WorkstationClient initialRequest={request} />;
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center text-sm text-slate-600">
      {error ? (
        <>
          <p className="font-bold text-rose-700">{error}</p>
          <Link href="/desk" className="mt-3 inline-block font-bold text-[#0e7bf4] hover:underline">
            Back to Filing Desk
          </Link>
        </>
      ) : (
        'Loading job…'
      )}
    </div>
  );
}

export function WorkstationClient({ initialRequest }: WorkstationClientProps) {
  const router = useRouter();
  const [request, setRequest] = useState<ServiceDeskRequest>(initialRequest);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Stepper state
  const [currentStep, setCurrentStep] = useState<number>(4); // Default to photo/sign or OTP

  // Start code: a citizen's booking is worked on only after the citizen's 4-digit code is entered.
  const [startCodeInput, setStartCodeInput] = useState('');
  const [startCodeError, setStartCodeError] = useState<string | null>(null);
  const [startingWork, setStartingWork] = useState(false);

  async function startWork(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(startCodeInput)) {
      setStartCodeError('Enter the 4 digits from the citizen’s app.');
      return;
    }
    setStartingWork(true);
    setStartCodeError(null);
    const res = await startBookingWithCode(request.id, startCodeInput);
    setStartingWork(false);
    if (!res.data) {
      setStartCodeError(res.error ?? 'Could not start this booking.');
      return;
    }
    setStartCodeInput('');
    setRequest((prev) => ({ ...prev, needsStartCode: false }));
  }

  const [openingDoc, setOpeningDoc] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  /** Open a shared locker file via a 10-minute signed link (tab opened inside the click so it isn't blocked). */
  async function openSharedDoc(shareId: string) {
    const tab = window.open('', '_blank');
    setOpeningDoc(shareId);
    setDocError(null);
    const res = await getSharedDocumentUrl(request.id, shareId);
    setOpeningDoc(null);
    if (res.data?.url && tab) {
      tab.opener = null;
      tab.location.href = res.data.url;
    } else {
      tab?.close();
      setDocError(res.error || 'Could not open the document.');
    }
  }

  // OTP Bridge State
  const [isOtpActive, setIsOtpActive] = useState<boolean>(request.status === 'otp_pending');
  const [otpSecondsLeft, setOtpSecondsLeft] = useState<number>(120);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpVerified, setOtpVerified] = useState<boolean>(false);
  const [otpNotificationSent, setOtpNotificationSent] = useState<boolean>(false);
  // Real jobs: when we asked in the booking chat, and the citizen's replies since then.
  const [otpAskedAt, setOtpAskedAt] = useState<string | null>(null);
  const [otpReplies, setOtpReplies] = useState<{ id: string; message: string }[]>([]);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Defect Modal State
  const [showDefectModal, setShowDefectModal] = useState<boolean>(false);
  const [defectChecklist, setDefectChecklist] = useState<string[]>([]);
  const [customDefectNotes, setCustomDefectNotes] = useState<string>('');
  const [defectError, setDefectError] = useState<string | null>(null);
  const [slipError, setSlipError] = useState<string | null>(null);

  // Final Receipt State
  const [showFinalizeModal, setShowFinalizeModal] = useState<boolean>(false);
  const [portalRegNumber, setPortalRegNumber] = useState<string>(
    request.processingDetails?.portalRegNumber || ''
  );
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);

  // Timer logic for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOtpActive && otpSecondsLeft > 0 && !otpVerified) {
      interval = setInterval(() => {
        setOtpSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (otpSecondsLeft === 0) {
      queueMicrotask(() => setIsOtpActive(false));
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpActive, otpSecondsLeft, otpVerified]);

  // Copy to clipboard helper
  const handleCopy = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Real jobs: watch the booking chat for the citizen's reply while the OTP window is open.
  useEffect(() => {
    if (!request.live || !otpAskedAt || !isOtpActive) return;
    const poll = () =>
      getBookingMessages(request.id).then((res) =>
        setOtpReplies(
          (res.data ?? [])
            .filter((m) => m.sender_type === 'citizen' && m.created_at > otpAskedAt)
            .map((m) => ({ id: m.id, message: m.message })),
        ),
      );
    const t = setInterval(poll, 4000);
    return () => clearInterval(t);
  }, [request.live, request.id, otpAskedAt, isOtpActive]);

  /** Post as the centre in the booking chat; the citizen gets a notification for it. */
  const messageCitizen = (message: string) =>
    sendBookingMessage(request.id, {
      sender_type: 'partner',
      sender_name: request.partner.name || 'Service centre',
      message: message.slice(0, 2000),
    });

  // Ask the citizen for the portal OTP
  const handleTriggerOtp = async () => {
    if (request.live) {
      setActionError(null);
      setActionBusy(true);
      const res = await messageCitizen(
        `To finish your ${request.serviceTitle} application, please reply here with the OTP the government portal just sent to your phone.`,
      );
      setActionBusy(false);
      if (!res.data) return setActionError(res.error ?? 'Could not message the citizen.');
      setOtpAskedAt(res.data.created_at);
      setOtpReplies([]);
    }
    setIsOtpActive(true);
    setOtpSecondsLeft(120);
    setOtpVerified(false);
    setOtpNotificationSent(true);
    setRequest((prev) => ({
      ...prev,
      status: 'otp_pending',
      processingDetails: {
        ...prev.processingDetails,
        otpStatus: 'active',
        otpRequestedAt: new Date().toISOString(),
      },
    }));
  };

  // Verify OTP entered by operator
  const handleVerifyOtp = () => {
    if (enteredOtp.length === 6) {
      setOtpVerified(true);
      setIsOtpActive(false);
      setCurrentStep(5); // Proceed to payment / finalization
      setRequest((prev) => ({
        ...prev,
        status: 'submitted',
        processingDetails: {
          ...prev.processingDetails,
          otpStatus: 'verified',
        },
      }));
    }
  };

  // Send back to fix: real jobs tell the citizen in the chat and save the reason on the booking.
  const handleReturnDefect = async () => {
    const problems = [...defectChecklist, customDefectNotes.trim()].filter(Boolean);
    if (problems.length === 0) {
      setDefectError(request.live ? 'Tick at least one problem or write a note for the citizen.' : 'Tick at least one problem or write a note for the centre.');
      return;
    }
    setDefectError(null);
    const reason = problems.join('; ');
    if (request.live) {
      setActionBusy(true);
      const msg = await messageCitizen(
        `We can't file your application yet. Please fix these and share the documents again:\n${problems.map((p) => `- ${p}`).join('\n')}`,
      );
      const saved = msg.data ? await setBookingFixStatus(request.id, 'needs_fix', reason) : null;
      setActionBusy(false);
      if (!saved?.data) return setDefectError(msg.error ?? saved?.error ?? 'Could not send it back.');
    }
    setRequest((prev) => ({
      ...prev,
      status: 'defective',
      processingDetails: { ...prev.processingDetails, defectReason: reason, defectChecklist },
    }));
    setShowDefectModal(false);
  };

  const handleReopen = async () => {
    setActionError(null);
    if (request.live) {
      setActionBusy(true);
      const res = await setBookingFixStatus(request.id, 'in_progress', 'Documents fixed, filing resumed');
      setActionBusy(false);
      if (!res.data) return setActionError(res.error ?? 'Could not reopen the job.');
    }
    setRequest((prev) => ({
      ...prev,
      status: 'ready_for_filing',
      processingDetails: { ...prev.processingDetails, defectReason: undefined },
    }));
  };

  const pickSlip = (file: File | undefined) => {
    setFinalizeError(null);
    if (!file) return setSlipFile(null);
    if (!SLIP_TYPES.includes(file.type as SlipType)) return setFinalizeError('Upload a PDF, JPG or PNG.');
    if (file.size > MAX_SLIP_BYTES) return setFinalizeError('The slip must be 5 MB or smaller.');
    setSlipFile(file);
  };

  // Mark Filed: status → completed, slip stored in Supabase Storage, citizen notified (API does all three).
  const handleFinalizeSubmission = async () => {
    const appNo = portalRegNumber.trim();
    if (!APP_NO.test(appNo)) {
      return setFinalizeError('Enter the application number from the portal (letters, digits, - / . only).');
    }
    if (!slipFile) return setFinalizeError('Upload the receipt from the portal.');
    setFinalizeError(null);
    setIsFinalizing(true);
    try {
      if (request.live) {
        const res = await markBookingFiled(request.id, {
          official_app_number: appNo,
          slip_base64: await readAsDataUrl(slipFile),
          slip_mime_type: slipFile.type as SlipType,
        });
        if (!res.data) return setFinalizeError(res.error ?? 'Could not mark as filed.');
      }
      setRequest((prev) => ({
        ...prev,
        status: 'completed',
        processingDetails: {
          ...prev.processingDetails,
          portalRegNumber: appNo,
          submissionTimestamp: new Date().toISOString(),
          acknowledgementPdfUrl: 'stored',
        },
      }));
      setShowFinalizeModal(false);
    } catch {
      setFinalizeError('Could not read the selected file.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleViewSlip = async () => {
    setSlipError(null);
    if (!request.live) {
      setSlipError('This is a demo job, so there is no stored receipt.');
      return;
    }
    const res = await getBookingSlipUrl(request.id);
    if (res.data?.url) window.location.assign(res.data.url);
    else setSlipError(res.error ?? 'Could not open the receipt.');
  };

  const STEPS = [
    { num: 1, title: 'Portal login' },
    { num: 2, title: 'Personal details' },
    { num: 3, title: 'Education' },
    { num: 4, title: 'Photo & signature' },
    { num: 5, title: 'OTP' },
    { num: 6, title: 'Fee & receipt' },
  ];

  const DEFECT_PRESETS = [
    'Passport photo blurred, dark background, or non-white backdrop',
    'Photograph shows spectacles, cap, or glare on candidate eyes',
    'Signature is cut off, blurred, or signed in blue ink (black required)',
    '10th Marks Memo hall ticket number or grades unreadable in scan',
    'Caste / Non-Creamy Layer certificate is expired or outside current FY',
    'Candidate name on Aadhaar does not match Matriculation Memo',
    'Address or Domicile proof missing or invalid',
  ];

  return (
    <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8 space-y-5">
      {/* Top Workstation Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/desk"
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-[#082046] transition"
            title="Back to Filing Desk"
            aria-label="Back to Filing Desk"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black tracking-wide text-[#082046] bg-slate-100 px-2 py-0.5 rounded-md">
                {request.token}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  request.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : request.status === 'otp_pending'
                    ? 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse'
                    : request.status === 'defective'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {STATUS_CONFIG[request.status].label}
              </span>
              {request.priority === 'critical' && (
                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                  Urgent
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-[#082046] mt-0.5">
              {request.applicant.fullName} · {request.serviceTitle}
            </h1>
          </div>
        </div>

        {/* Workstation Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {request.status !== 'completed' && request.status !== 'defective' && (
            <>
              {/* Real jobs: both go through the booking chat, so they need a citizen account and a started job. */}
              {(!request.live || (request.hasCitizen && !request.needsStartCode)) && (
              <>
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => setShowDefectModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-sm"
              >
                <AlertTriangle className="size-3.5" />
                <span>Send back to fix</span>
              </button>

              <button
                type="button"
                disabled={actionBusy}
                onClick={handleTriggerOtp}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-sm"
              >
                <Phone className="size-3.5" />
                <span>{isOtpActive ? `Waiting for OTP (${otpSecondsLeft}s)` : 'Ask citizen for OTP'}</span>
              </button>
              </>
              )}

              {!request.needsStartCode && (
              <button
                type="button"
                onClick={() => setShowFinalizeModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
              >
                <CheckCircle2 className="size-4" />
                <span>Mark as filed</span>
              </button>
              )}
            </>
          )}

          {request.status === 'completed' && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Filed · {request.processingDetails?.portalRegNumber ?? 'Application submitted'}</span>
              </span>
              {request.processingDetails?.acknowledgementPdfUrl && (
                <button
                  type="button"
                  onClick={handleViewSlip}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Download receipt
                </button>
              )}
              {slipError && (
                <span role="alert" className="text-xs font-bold text-rose-700">{slipError}</span>
              )}
            </div>
          )}

          {request.status === 'defective' && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-800">
                <AlertCircle className="size-4 text-rose-600" />
                <span>Sent back to fix</span>
              </span>
              {/* Live rejected/cancelled bookings also show as "sent back"; only a real send-back can be reopened. */}
              {request.processingDetails?.defectReason !== undefined && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handleReopen}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Documents fixed, reopen
                </button>
              )}
            </div>
          )}

          {actionError && (
            <span role="alert" className="text-xs font-bold text-rose-700">{actionError}</span>
          )}
        </div>
      </div>

      {/* 6-Stage Progress Indicator */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="flex items-center justify-between overflow-x-auto gap-2">
          {STEPS.map((step) => {
            const isCompleted = step.num < currentStep;
            const isCurrent = step.num === currentStep;
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => setCurrentStep(step.num)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition shrink-0 ${
                  isCurrent
                    ? 'bg-[#082046] text-white shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-[10px] font-black ${
                    isCurrent
                      ? 'bg-white text-[#082046]'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="size-3" /> : step.num}
                </span>
                <span>{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {request.needsStartCode && (
        <form
          onSubmit={startWork}
          className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-[#0e7bf4]/40 bg-blue-50 p-4 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-[#082046]">Enter the citizen’s start code</p>
            <p className="text-xs text-slate-600">
              Ask the citizen for the 4-digit code in their ApplyFields booking (they can also send it in the chat).
              Filing unlocks once the code matches.
            </p>
            {startCodeError && (
              <p role="alert" className="mt-1 text-xs font-bold text-rose-700">
                {startCodeError}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              value={startCodeInput}
              onChange={(e) => {
                setStartCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                setStartCodeError(null);
              }}
              aria-label="Start code"
              placeholder="••••"
              className="w-28 rounded-xl border border-[#d5deea] bg-white py-2 text-center font-mono text-2xl font-black tracking-[0.4em] text-[#082046] outline-none focus:border-[#0e7bf4]"
            />
            <button
              type="submit"
              disabled={startingWork}
              className="rounded-xl bg-[#0e7bf4] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0c6fdc] disabled:opacity-60"
            >
              {startingWork ? 'Checking…' : 'Start work'}
            </button>
          </div>
        </form>
      )}

      {/* Live OTP Coordination Banner (When Active) */}
      {isOtpActive && (
        <div className="rounded-2xl border border-purple-300 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-600 text-white font-mono font-bold animate-pulse">
                {otpSecondsLeft}s
              </div>
              <div>
                <p className="text-sm font-bold text-purple-900">
                  Waiting for the citizen&apos;s OTP
                </p>
                <p className="text-xs text-purple-700">
                  {request.live
                    ? 'We asked the citizen in the booking chat. Their reply shows up here.'
                    : <>Call the citizen on <strong className="font-mono">{request.applicant.mobile}</strong> and type the OTP the portal sent them.</>}
                </p>
              </div>
            </div>

            {request.live ? (
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                {otpReplies.length === 0 ? (
                  <p className="text-xs font-bold text-purple-700">Waiting for a reply…</p>
                ) : (
                  otpReplies.map((r) => {
                    const code = r.message.match(/\b\d{4,8}\b/)?.[0];
                    return (
                      <div key={r.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
                        <span className={code ? 'font-mono text-lg font-black tracking-widest text-purple-900' : 'text-xs text-slate-700'}>
                          {code ?? r.message}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(code ?? r.message, r.id)}
                          className="text-xs font-bold text-[#0e7bf4] hover:underline"
                        >
                          {copiedField === r.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    );
                  })
                )}
                <button
                  type="button"
                  onClick={() => setIsOtpActive(false)}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 transition shadow-sm"
                >
                  Done
                </button>
              </div>
            ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit OTP"
                aria-label="OTP from citizen"
                inputMode="numeric"
                className="w-36 rounded-xl border border-purple-300 bg-white px-3 py-2 text-center font-mono text-sm font-bold tracking-widest text-purple-900 focus:border-purple-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={enteredOtp.length !== 6}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition shadow-sm"
              >
                Confirm OTP
              </button>
              <button
                type="button"
                onClick={handleTriggerOtp}
                className="rounded-xl border border-purple-300 bg-white px-2.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 transition"
                title="Restart timer"
                aria-label="Restart timer"
              >
                <RotateCw className="size-3.5" />
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Main Dual-Pane Workstation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT PANE: Applicant Biodata & Verified Documents (7 Columns) */}
        <div className="space-y-5 lg:col-span-7">
          {/* Primary Biodata Card with 1-Click Clipboard Copiers */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <User className="size-4 text-[#0e7bf4]" />
                <h2 className="text-sm font-bold text-[#082046]">
                  Citizen details
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Copy each field into the portal form
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Full Name */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Full name
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(request.applicant.fullName, 'fullName')}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#0e7bf4] hover:underline"
                  >
                    {copiedField === 'fullName' ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    <span>{copiedField === 'fullName' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="mt-1 font-mono text-xs font-bold text-slate-900">{request.applicant.fullName}</p>
              </div>

              {/* Father Name */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Father&apos;s Name
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(request.applicant.fatherName, 'fatherName')}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#0e7bf4] hover:underline"
                  >
                    {copiedField === 'fatherName' ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    <span>{copiedField === 'fatherName' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="mt-1 font-mono text-xs font-bold text-slate-900">{request.applicant.fatherName}</p>
              </div>

              {/* Mother Name */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Mother&apos;s Name
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(request.applicant.motherName, 'motherName')}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#0e7bf4] hover:underline"
                  >
                    {copiedField === 'motherName' ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    <span>{copiedField === 'motherName' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="mt-1 font-mono text-xs font-bold text-slate-900">{request.applicant.motherName}</p>
              </div>

              {/* DOB & Gender */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    DOB / Gender
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(request.applicant.dob, 'dob')}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#0e7bf4] hover:underline"
                  >
                    {copiedField === 'dob' ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    <span>{copiedField === 'dob' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="mt-1 font-mono text-xs font-bold text-slate-900">
                  {request.applicant.dob} ({request.applicant.gender})
                </p>
              </div>

              {/* Social Category & Sub-caste */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Category / Sub-caste
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(request.applicant.socialCategory, 'category')}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#0e7bf4] hover:underline"
                  >
                    {copiedField === 'category' ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    <span>{copiedField === 'category' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-900">
                  {request.applicant.socialCategory} · {request.applicant.subCaste}
                </p>
              </div>

              {/* Domicile State */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Domicile State
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(request.applicant.domicileState, 'domicile')}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#0e7bf4] hover:underline"
                  >
                    {copiedField === 'domicile' ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    <span>{copiedField === 'domicile' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-900">{request.applicant.domicileState}</p>
              </div>
            </div>

            {/* Identification Marks */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Identification marks
              </span>
              <div className="flex items-center justify-between text-xs font-mono text-slate-900">
                <span>1. {request.applicant.identificationMark1}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(request.applicant.identificationMark1, 'mark1')}
                  className="text-[#0e7bf4] hover:underline text-[11px] font-bold ml-2 shrink-0"
                >
                  {copiedField === 'mark1' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-900 border-t border-slate-200/50 pt-1">
                <span>2. {request.applicant.identificationMark2}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(request.applicant.identificationMark2, 'mark2')}
                  className="text-[#0e7bf4] hover:underline text-[11px] font-bold ml-2 shrink-0"
                >
                  {copiedField === 'mark2' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Education Particulars */}
            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider">
                  10th class record
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(request.applicant.education.hallTicketNo, 'hallTicket')}
                  className="text-xs font-bold text-[#0e7bf4] hover:underline"
                >
                  {copiedField === 'hallTicket' ? 'Roll No Copied' : 'Copy Roll No'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] block">Roll / Hall Ticket No</span>
                  <strong>{request.applicant.education.hallTicketNo}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Passing Year</span>
                  <strong>{request.applicant.education.yearOfPassing}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Marks / Percentage</span>
                  <strong>{request.applicant.education.percentageOrGpa}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Board Name</span>
                  <span className="text-[11px] font-bold truncate block">{request.applicant.education.boardName}</span>
                </div>
              </div>
            </div>

            {/* Full Communication Address */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Permanent address
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `${request.applicant.address.street}, ${request.applicant.address.city}, ${request.applicant.address.district}, ${request.applicant.address.state} - ${request.applicant.address.pincode}`,
                      'address'
                    )
                  }
                  className="flex items-center gap-1 text-[11px] font-bold text-[#0e7bf4] hover:underline"
                >
                  {copiedField === 'address' ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                  <span>{copiedField === 'address' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="mt-1 font-mono text-xs text-slate-800">
                {request.applicant.address.street}, {request.applicant.address.city},{' '}
                {request.applicant.address.district}, {request.applicant.address.state} -{' '}
                <strong className="text-[#082046]">{request.applicant.address.pincode}</strong>
              </p>
            </div>
          </div>

          {/* Uploaded Documents & Assets Vault */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-[#082046]">
                  Documents shared by the citizen
                </h2>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {request.documents.length} {request.documents.length === 1 ? 'file' : 'files'}
              </span>
            </div>

            {docError && (
              <p role="alert" className="text-xs font-semibold text-rose-600">{docError}</p>
            )}
            {request.documents.length === 0 && (
              <p className="text-xs text-slate-500">No documents shared. Ask the citizen to share from their Document Locker or bring originals.</p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {request.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3 hover:border-[#0e7bf4] transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-[#082046]">{doc.name}</span>
                      {doc.verified ? (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                          Verified
                        </span>
                      ) : (
                        <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-800">
                          Unverified
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 font-mono truncate">{doc.fileName}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-600">
                      <span>{doc.fileSize}</span>
                      {doc.dimensions && (
                        <>
                          <span>·</span>
                          <span className="font-mono font-semibold">{doc.dimensions}</span>
                        </>
                      )}
                    </div>
                    {doc.notes && (
                      <p className="mt-1 text-[10px] text-slate-600 italic">{doc.notes}</p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 border-t border-slate-200/60 pt-2">
                    <button
                      type="button"
                      disabled={openingDoc === doc.id}
                      onClick={() => void openSharedDoc(doc.id)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white border border-slate-200 px-2 py-1 text-[11px] font-bold text-[#082046] hover:bg-slate-100 transition shadow-xs disabled:opacity-60"
                      title="Open in a new tab to view, download or print"
                    >
                      <Eye className="size-3" />
                      <span>{openingDoc === doc.id ? 'Opening…' : 'Open'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Portal Assistant & Live Filing Console (5 Columns) */}
        <div className="space-y-5 lg:col-span-5">
          {/* Target Government Portal Assistant Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Apply on
                </span>
                <h3 className="text-sm font-bold text-[#082046]">{request.targetPortalName}</h3>
              </div>
              <a
                href={request.targetPortalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-xl bg-[#082046] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0c2f66] transition shadow-xs"
              >
                <span>Open portal</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>

            {/* Portal Filing Instructions */}
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#0e7bf4] text-[10px] font-bold text-white mt-0.5">
                  1
                </span>
                <span>
                  Log in to the portal with the citizen&apos;s account, or register them if they are new.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#0e7bf4] text-[10px] font-bold text-white mt-0.5">
                  2
                </span>
                <span>
                  Copy the citizen&apos;s details from this page into the portal form.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#0e7bf4] text-[10px] font-bold text-white mt-0.5">
                  3
                </span>
                <span>
                  Open the citizen&apos;s photo and signature and upload them to the portal.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#0e7bf4] text-[10px] font-bold text-white mt-0.5">
                  4
                </span>
                <span>
                  Get the OTP from the citizen, submit, then click <strong>Mark as filed</strong> and upload the receipt.
                </span>
              </div>
            </div>

            {/* Originating Kiosk Contact */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Building className="size-3.5 text-slate-400" />
                  Centre
                </span>
                <span className="font-mono text-slate-500">{request.partner.centerCode}</span>
              </div>
              <p className="text-xs font-bold text-[#082046]">{request.partner.name}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                <span>Operator: {request.partner.operatorName}</span>
                <a
                  href={`tel:${request.partner.phone}`}
                  className="font-mono text-[#0e7bf4] hover:underline"
                >
                  {request.partner.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Quick Filing Checklist */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-[#082046] uppercase tracking-wider">
              Before you submit
            </h3>
            <div className="space-y-2 text-xs">
              {[
                'Name spelling matches the 10th marks memo',
                'Identification marks entered',
                'Exam centre choices confirmed with the citizen',
                'Photo uploaded and accepted by the portal',
                'Signature (black ink) uploaded and accepted',
                'Caste / EWS certificate attached, if the citizen has one',
              ].map((item, idx) => (
                <label key={idx} className="flex items-start gap-2 cursor-pointer text-slate-700 select-none">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-[#0e7bf4] focus:ring-0 cursor-pointer"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Fee & Commission Settlement Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-[#082046] uppercase tracking-wider">
              Fees
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Government fee</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{(request.fees.govtFeePaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Your centre&apos;s share</span>
                <span className="font-mono font-bold text-emerald-700">
                  ₹{(request.fees.kioskFeePaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>ApplyFields fee</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{(request.fees.platformFeePaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 font-bold text-[#082046]">
                <span>Total</span>
                <span className="font-mono text-sm">
                  ₹{(request.fees.totalPaise / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEND BACK TO FIX MODAL */}
      {showDefectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="size-5" />
                <h3 className="text-base font-bold text-[#082046]">Send back to fix</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDefectModal(false)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {request.live ? (
                <>Tick what needs fixing. The citizen gets your list in the booking chat and a notification.</>
              ) : (
                <>
                  Tick what needs fixing. The job goes back to <strong>{request.partner.name}</strong> with your notes.
                </>
              )}
            </p>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 max-h-56 overflow-y-auto">
              {DEFECT_PRESETS.map((preset, idx) => {
                const isChecked = defectChecklist.includes(preset);
                return (
                  <label key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setDefectChecklist(defectChecklist.filter((i) => i !== preset));
                        } else {
                          setDefectChecklist([...defectChecklist, preset]);
                        }
                      }}
                      className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-0 cursor-pointer"
                    />
                    <span>{preset}</span>
                  </label>
                );
              })}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {request.live ? 'Note for the citizen' : 'Notes for the centre'}
              </label>
              <textarea
                rows={3}
                value={customDefectNotes}
                onChange={(e) => setCustomDefectNotes(e.target.value)}
                placeholder="e.g. The 10th memo scan is blurred, please rescan it"
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-rose-600 focus:outline-none"
              />
            </div>

            {defectError && (
              <p role="alert" className="rounded-xl bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
                {defectError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowDefectModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReturnDefect}
                disabled={actionBusy}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-sm disabled:opacity-50"
              >
                {actionBusy ? 'Sending…' : 'Send back'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINALIZE & UPLOAD RECEIPT MODAL */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="size-5" />
                <h3 className="text-base font-bold text-[#082046]">Mark as filed</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFinalizeModal(false)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Enter the application number the portal gave you and upload its receipt.
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="official-app-no" className="text-xs font-bold text-slate-700 block mb-1">
                  Application number <span className="text-rose-600">*</span>
                </label>
                <input
                  id="official-app-no"
                  type="text"
                  value={portalRegNumber}
                  onChange={(e) => setPortalRegNumber(e.target.value)}
                  placeholder="e.g. MVA-2026-98741"
                  maxLength={60}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-[#0e7bf4] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="ack-slip" className="text-xs font-bold text-slate-700 block mb-1">
                  Receipt from the portal <span className="text-rose-600">*</span>
                </label>
                <label
                  htmlFor="ack-slip"
                  className="block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:border-[#0e7bf4]"
                >
                  <Upload className="mx-auto size-6 text-slate-400" />
                  <p className="mt-1 text-xs font-bold text-slate-700 break-all">
                    {slipFile ? slipFile.name : 'Choose the PDF downloaded from the government portal'}
                  </p>
                  <p className="text-[10px] text-slate-500">PDF, JPG or PNG · max 5 MB</p>
                </label>
                <input
                  id="ack-slip"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => pickSlip(e.target.files?.[0])}
                  className="sr-only"
                />
              </div>

              {finalizeError && (
                <p role="alert" className="rounded-xl bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
                  {finalizeError}
                </p>
              )}

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  When you mark it filed:
                </p>
                <ul className="list-disc pl-4 text-[11px] text-emerald-700 space-y-0.5">
                  <li>The job is marked <strong>Done</strong></li>
                  <li>The receipt is stored privately and the citizen can download it from their booking</li>
                  <li>The citizen gets a notification with the application number</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowFinalizeModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizeSubmission}
                disabled={isFinalizing || !portalRegNumber.trim() || !slipFile}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
              >
                {isFinalizing ? 'Saving…' : 'Mark as filed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
