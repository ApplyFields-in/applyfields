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
import {
  ServiceDeskRequest,
  ApplicantDocument,
  SAMPLE_SERVICE_REQUESTS,
} from '@/lib/service-desk-data';

interface WorkstationClientProps {
  initialRequest: ServiceDeskRequest;
}

export function WorkstationClient({ initialRequest }: WorkstationClientProps) {
  const router = useRouter();
  const [request, setRequest] = useState<ServiceDeskRequest>(initialRequest);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Stepper state
  const [currentStep, setCurrentStep] = useState<number>(4); // Default to photo/sign or OTP

  // Document preview modal
  const [selectedDoc, setSelectedDoc] = useState<ApplicantDocument | null>(null);
  const [docZoom, setDocZoom] = useState<number>(100);

  // OTP Bridge State
  const [isOtpActive, setIsOtpActive] = useState<boolean>(request.status === 'otp_pending');
  const [otpSecondsLeft, setOtpSecondsLeft] = useState<number>(120);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpVerified, setOtpVerified] = useState<boolean>(false);
  const [otpNotificationSent, setOtpNotificationSent] = useState<boolean>(false);

  // Defect Modal State
  const [showDefectModal, setShowDefectModal] = useState<boolean>(false);
  const [defectChecklist, setDefectChecklist] = useState<string[]>([]);
  const [customDefectNotes, setCustomDefectNotes] = useState<string>('');

  // Final Receipt State
  const [showFinalizeModal, setShowFinalizeModal] = useState<boolean>(false);
  const [portalRegNumber, setPortalRegNumber] = useState<string>(
    request.processingDetails?.portalRegNumber || ''
  );
  const [challanReference, setChallanReference] = useState<string>(
    request.processingDetails?.challanReference || ''
  );
  const [receiptFileName, setReceiptFileName] = useState<string>(
    request.processingDetails?.acknowledgementPdfUrl ? 'government_submission_slip.pdf' : ''
  );
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);

  // Timer logic for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOtpActive && otpSecondsLeft > 0 && !otpVerified) {
      interval = setInterval(() => {
        setOtpSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (otpSecondsLeft === 0) {
      setIsOtpActive(false);
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

  // Trigger Citizen OTP Request
  const handleTriggerOtp = () => {
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

  // Submit Defect Return to Kiosk
  const handleReturnDefect = () => {
    if (defectChecklist.length === 0 && !customDefectNotes.trim()) {
      alert('Please check at least one defect reason or enter notes for the kiosk operator.');
      return;
    }
    setRequest((prev) => ({
      ...prev,
      status: 'defective',
      processingDetails: {
        ...prev.processingDetails,
        defectReason: customDefectNotes || defectChecklist[0],
        defectChecklist,
      },
    }));
    setShowDefectModal(false);
  };

  // Finalize Submission & Clear Payout
  const handleFinalizeSubmission = () => {
    if (!portalRegNumber.trim()) {
      alert('Please enter the Official Government Application / Registration Number.');
      return;
    }
    setIsFinalizing(true);
    setTimeout(() => {
      setIsFinalizing(false);
      setRequest((prev) => ({
        ...prev,
        status: 'completed',
        processingDetails: {
          ...prev.processingDetails,
          portalRegNumber,
          challanReference,
          submissionTimestamp: new Date().toISOString(),
          acknowledgementPdfUrl: `/receipts/${portalRegNumber}.pdf`,
        },
      }));
      setShowFinalizeModal(false);
    }, 700);
  };

  const STEPS = [
    { num: 1, title: 'OTR / Portal Login' },
    { num: 2, title: 'Personal Particulars' },
    { num: 3, title: 'Education & Board' },
    { num: 4, title: 'Photo & Signature' },
    { num: 5, title: 'Citizen OTP' },
    { num: 6, title: 'Fee & Acknowledgement' },
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
            title="Return to Queue"
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
                {request.status.replace('_', ' ').toUpperCase()}
              </span>
              {request.priority === 'critical' && (
                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                  Critical SLA
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
              <button
                type="button"
                onClick={() => setShowDefectModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-sm"
              >
                <AlertTriangle className="size-3.5" />
                <span>Return to Kiosk (Defect)</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerOtp}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-sm"
              >
                <Phone className="size-3.5" />
                <span>Trigger Citizen OTP ({isOtpActive ? `${otpSecondsLeft}s` : 'Request'})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFinalizeModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
              >
                <CheckCircle2 className="size-4" />
                <span>Upload Receipt & Finalize</span>
              </button>
            </>
          )}

          {request.status === 'completed' && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Application Submitted & Sealed</span>
              </span>
              <button
                type="button"
                onClick={() => alert(`Registration Receipt: ${request.processingDetails?.portalRegNumber}`)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                View Stamped Slip
              </button>
            </div>
          )}

          {request.status === 'defective' && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-800">
                <AlertCircle className="size-4 text-rose-600" />
                <span>Defect Flagged to Kiosk</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  setRequest((prev) => ({ ...prev, status: 'ready_for_filing' }))
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Reopen Workstation
              </button>
            </div>
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
                  Citizen OTP Verification Active
                </p>
                <p className="text-xs text-purple-700">
                  WhatsApp and SMS alert sent to candidate <strong className="font-mono">{request.applicant.mobile}</strong> and kiosk operator <strong className="font-mono">{request.partner.phone}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit OTP"
                className="w-36 rounded-xl border border-purple-300 bg-white px-3 py-2 text-center font-mono text-sm font-bold tracking-widest text-purple-900 focus:border-purple-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={enteredOtp.length !== 6}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition shadow-sm"
              >
                Verify & Advance
              </button>
              <button
                type="button"
                onClick={handleTriggerOtp}
                className="rounded-xl border border-purple-300 bg-white px-2.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 transition"
                title="Restart Timer"
              >
                <RotateCw className="size-3.5" />
              </button>
            </div>
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
                  Candidate Biodata (Verified from 10th Memo & Aadhaar)
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Click any copy icon to transfer to external portal
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Full Name */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Candidate Full Name
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
                    Father's Name
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
                    Mother's Name
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
                Visible Identification Marks (Mandatory for SSC/UPSC)
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
                  10th / Matriculation Board Record
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
                  Full Permanent Address & Pincode
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
                  <span>{copiedField === 'address' ? 'Full Address Copied' : 'Copy All'}</span>
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
                  Candidate Uploaded Documents & Pre-Resized Assets
                </h2>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {request.documents.length} verified files
              </span>
            </div>

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
                      onClick={() => {
                        setSelectedDoc(doc);
                        setDocZoom(100);
                      }}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white border border-slate-200 px-2 py-1 text-[11px] font-bold text-[#082046] hover:bg-slate-100 transition shadow-xs"
                    >
                      <Eye className="size-3" />
                      <span>Inspect</span>
                    </button>
                    <a
                      href={doc.url}
                      download={doc.fileName}
                      className="flex items-center justify-center gap-1 rounded-lg bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-300 transition"
                      title="Download Asset"
                    >
                      <Download className="size-3" />
                    </a>
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
                  Target Portal Assistant
                </span>
                <h3 className="text-sm font-bold text-[#082046]">{request.targetPortalName}</h3>
              </div>
              <a
                href={request.targetPortalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-xl bg-[#082046] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0c2f66] transition shadow-xs"
              >
                <span>Launch Portal</span>
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
                  Log in to the official portal with candidate credentials or start a new One-Time Registration (OTR).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#0e7bf4] text-[10px] font-bold text-white mt-0.5">
                  2
                </span>
                <span>
                  Paste biodata and matriculation marks directly using the 1-click copy buttons in the left pane.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#0e7bf4] text-[10px] font-bold text-white mt-0.5">
                  3
                </span>
                <span>
                  Download the pre-scaled photo (200x230 px) and signature (140x60 px) and upload them to the portal.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#0e7bf4] text-[10px] font-bold text-white mt-0.5">
                  4
                </span>
                <span>
                  Click <strong>Trigger Citizen OTP</strong> to coordinate the final submission SMS with the applicant.
                </span>
              </div>
            </div>

            {/* Originating Kiosk Contact */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Building className="size-3.5 text-slate-400" />
                  Originating Partner
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
              Operator Portal Filing Checklist
            </h3>
            <div className="space-y-2 text-xs">
              {[
                'Candidate name spelling strictly verified against SSC marks memo',
                'Identification marks copied and pasted into external form',
                'Exam center choices confirmed with applicant preference',
                'Passport photograph aspect ratio (20–50 KB) validated',
                'Black ink signature asset (10–20 KB) accepted by portal',
                'Reservation category certificate (OBC/EWS/SC/ST) attached',
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
              Fee & Kiosk Settlement
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Government Exam Fee:</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{(request.fees.govtFeePaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Kiosk Operator Share (70%):</span>
                <span className="font-mono font-bold text-emerald-700">
                  ₹{(request.fees.kioskFeePaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>ApplyFields Platform Fee:</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{(request.fees.platformFeePaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 font-bold text-[#082046]">
                <span>Total Collected at Kiosk:</span>
                <span className="font-mono text-sm">
                  ₹{(request.fees.totalPaise / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INSPECT DOCUMENT MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#082046]">{selectedDoc.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedDoc.fileName} · {selectedDoc.fileSize}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 overflow-hidden relative">
              <div className="text-center space-y-2">
                <FileText className="mx-auto size-12 text-[#0e7bf4]" />
                <p className="font-mono text-xs font-bold text-slate-800">{selectedDoc.fileName}</p>
                {selectedDoc.dimensions && (
                  <p className="text-xs text-slate-500">Dimension Standards: {selectedDoc.dimensions}</p>
                )}
                {selectedDoc.notes && (
                  <p className="text-xs text-slate-600 max-w-md mx-auto">{selectedDoc.notes}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="size-4" />
                Verified for Portal Compliance
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedDoc.url}
                  download={selectedDoc.fileName}
                  className="rounded-xl bg-[#082046] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c2f66] transition"
                >
                  Download Asset
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEFECT & RETURN TO KIOSK MODAL */}
      {showDefectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="size-5" />
                <h3 className="text-base font-bold text-[#082046]">Flag Defect & Return to Kiosk</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDefectModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select the non-compliant items below. This file will be pushed back to{' '}
              <strong>{request.partner.name}</strong> with revision instructions.
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
                Additional Instructions for Kiosk Operator:
              </label>
              <textarea
                rows={3}
                value={customDefectNotes}
                onChange={(e) => setCustomDefectNotes(e.target.value)}
                placeholder="Explain required changes clearly (e.g. please rescan candidate's 10th memo with 300 DPI flatbed scanner)..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-rose-600 focus:outline-none"
              />
            </div>

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
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-sm"
              >
                Confirm & Return to Kiosk
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
                <h3 className="text-base font-bold text-[#082046]">Finalize Application & Clear Settlement</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFinalizeModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Enter the official submission references and upload the official PDF acknowledgement downloaded from the government portal.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Official Portal Application / Registration Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={portalRegNumber}
                  onChange={(e) => setPortalRegNumber(e.target.value)}
                  placeholder="e.g. SSC-CGL-24009182410"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-[#0e7bf4] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Challan / Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={challanReference}
                  onChange={(e) => setChallanReference(e.target.value)}
                  placeholder="e.g. SBI-EPAY-8839102"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-[#0e7bf4] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Official Government Acknowledgement PDF
                </label>
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                  <Upload className="mx-auto size-6 text-slate-400" />
                  <p className="mt-1 text-xs font-bold text-slate-700">
                    {receiptFileName || 'Drop official government PDF here, or browse'}
                  </p>
                  <p className="text-[10px] text-slate-500">Accepts .pdf, .jpg (Max 5MB)</p>
                  <button
                    type="button"
                    onClick={() => setReceiptFileName('official_government_acknowledgement_receipt.pdf')}
                    className="mt-2 rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-[#082046] hover:bg-slate-100 transition shadow-xs"
                  >
                    Select File
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  Automated Downstream Actions:
                </p>
                <ul className="list-disc pl-4 text-[11px] text-emerald-700 space-y-0.5">
                  <li>Submission receipt instantly pushed to candidate WhatsApp and vault</li>
                  <li>Kiosk commission of <strong>₹{(request.fees.kioskFeePaise / 100).toFixed(2)}</strong> marked as cleared</li>
                  <li>Filing audit logged with your operator ID</li>
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
                disabled={isFinalizing || !portalRegNumber.trim()}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
              >
                {isFinalizing ? 'Finalizing...' : 'Confirm Submission & Release Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
