'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type {
  AdminPartnerVerifyInput,
  PartnerDetail,
  PartnerVerificationStatus,
} from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  RotateCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
  User,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
} from 'lucide-react';
import { apiPatch } from '@/lib/api';

interface PartnerKycInspectorClientProps {
  partner: PartnerDetail;
}

const PRESET_REJECTION_REASONS = [
  'GSTIN trade name does not match partner entity name',
  'Storefront photograph does not display official MeeSeva / CSC kiosk signage',
  'Trade license or municipal shop act registration is expired or illegible',
  'Uploaded document scan is cropped, low-resolution, or unreadable',
  'Physical GPS geolocation of storefront does not match registered center address',
];

export function PartnerKycInspectorClient({ partner: initialPartner }: PartnerKycInspectorClientProps) {
  const router = useRouter();
  const [partner, setPartner] = useState<PartnerDetail>(initialPartner);
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; success: boolean } | null>(null);

  // Document Viewer States
  const [selectedDocKind, setSelectedDocKind] = useState('trade_license');
  const [docZoom, setDocZoom] = useState<number>(100);
  const [docRotation, setDocRotation] = useState<number>(0);

  // Rejection Modal
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(PRESET_REJECTION_REASONS[0]);
  const [customRejectNote, setCustomRejectNote] = useState('');

  // KYC Compliance Checkboxes
  const [checks, setChecks] = useState({
    tradeLicenseValid: false,
    storefrontSignage: false,
    addressVerified: false,
  });

  const showToast = (text: string, success: boolean = true) => {
    setFeedback({ text, success });
    setTimeout(() => setFeedback(null), 4000);
  };


  // One-Click: Approve & Issue Verified Kiosk Seal
  const handleApprovePartner = async () => {
    setIsPending(true);
    const payload: AdminPartnerVerifyInput = {
      verification_status: 'verified',
      is_listed: true,
      reviewer_note: 'Center verified valid. Authorized Kiosk Seal issued by Admin Operations.',
    };

    const res = await apiPatch<PartnerDetail, AdminPartnerVerifyInput>(
      `/admin/partners/${partner.id}/verify`,
      payload,
    );

    setIsPending(false);
    if (res.ok) {
      setPartner((prev) => ({ ...prev, verification_status: 'verified', is_listed: true }));
      showToast('Partner center approved! Verified Kiosk Seal has been issued.');
    } else {
      showToast(res.error || 'Failed to approve partner', false);
    }
  };

  // Confirm Rejection
  const handleConfirmReject = async () => {
    setIsPending(true);
    const reasonText = customRejectNote ? `${selectedReason} — ${customRejectNote}` : selectedReason;
    const payload: AdminPartnerVerifyInput = {
      verification_status: 'rejected',
      is_listed: false,
      reviewer_note: reasonText,
    };

    const res = await apiPatch<PartnerDetail, AdminPartnerVerifyInput>(
      `/admin/partners/${partner.id}/verify`,
      payload,
    );

    setIsPending(false);
    setRejectionModalOpen(false);
    if (res.ok) {
      setPartner((prev) => ({ ...prev, verification_status: 'rejected', is_listed: false }));
      showToast(`Partner rejected: ${selectedReason}`, false);
    } else {
      showToast(res.error || 'Failed to reject partner', false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-teal/15 bg-canvas p-4 sm:p-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/partners"
              className="inline-flex items-center gap-1 text-xs font-bold text-teal/70 hover:text-teal"
            >
              <ArrowLeft className="size-3.5" /> Back to Partners
            </Link>
            <span className="text-teal/30">·</span>
            <span className="font-mono text-[11px] text-teal/60">
              Center ID: #{partner.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-teal tracking-tight">
              {partner.business_name}
            </h1>
            <Badge
              tone={
                partner.verification_status === 'verified'
                  ? 'teal'
                  : partner.verification_status === 'rejected'
                    ? 'outline'
                    : 'celadon'
              }
            >
              {partner.verification_status.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setRejectionModalOpen(true)}
            className={buttonClass({ variant: 'secondary', size: 'sm', className: 'text-xs text-rose-700 hover:text-rose-800' })}
          >
            <XCircle className="size-3.5 mr-1 inline" /> Reject with Reason
          </button>

          <button
            type="button"
            disabled={isPending || partner.verification_status === 'verified' || !Object.values(checks).every(Boolean)}
            onClick={handleApprovePartner}
            className={cn(buttonClass({ variant: 'primary', size: 'sm' }), 'text-xs gap-1.5')}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <BadgeCheck className="size-3.5" />
            )}
            <span>Approve &amp; Issue Verified Seal</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'rounded-xl p-3 text-xs font-semibold flex items-center gap-2 border shadow-sm',
            feedback.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200',
          )}
        >
          {feedback.success ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* DUAL-PANE SPLIT SCREEN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: ZOOMABLE DOCUMENT & PHOTO VIEWER (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <Card className="p-0 overflow-hidden border-teal/15 flex flex-col h-[750px]">
            {/* Document Kind Selector Tabs */}
            <div className="p-2.5 bg-canvas border-b border-teal/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: 'trade_license', label: 'Trade License', icon: FileCheck2 },
                  { id: 'gst_certificate', label: 'GST Certificate', icon: FileText },
                  { id: 'kiosk_photo', label: 'Kiosk Storefront', icon: Camera },
                  { id: 'owner_id', label: 'Owner PAN / Aadhaar', icon: User },
                ].map((doc) => {
                  const Icon = doc.icon;
                  const isActive = selectedDocKind === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDocKind(doc.id)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition text-[11px]',
                        isActive
                          ? 'bg-teal text-white shadow-xs'
                          : 'text-teal/70 hover:text-teal hover:bg-teal/5',
                      )}
                    >
                      <Icon className="size-3" />
                      <span>{doc.label}</span>
                      {partner.documents?.some((d) => d.document_kind === doc.id) ? null : (
                        <span className="opacity-60">· missing</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Zoom & Rotate Controls */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-teal/15 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setDocZoom((z) => Math.max(50, z - 20))}
                  className="p-1 rounded hover:bg-teal/10 text-teal"
                  title="Zoom Out"
                >
                  <ZoomOut className="size-3.5" />
                </button>
                <span className="w-8 text-center">{docZoom}%</span>
                <button
                  type="button"
                  onClick={() => setDocZoom((z) => Math.min(250, z + 20))}
                  className="p-1 rounded hover:bg-teal/10 text-teal"
                  title="Zoom In"
                >
                  <ZoomIn className="size-3.5" />
                </button>
                <span className="w-px h-3.5 bg-teal/20 mx-0.5" />
                <button
                  type="button"
                  onClick={() => setDocRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded hover:bg-teal/10 text-teal"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDocZoom(100);
                    setDocRotation(0);
                  }}
                  className="p-1 rounded hover:bg-teal/10 text-teal"
                  title="Reset Zoom & Orientation"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Document Render Canvas: the file the partner actually uploaded (newest of this kind) */}
            <div className="flex-1 bg-stone-900 overflow-auto flex flex-col items-center justify-center gap-3 p-6 relative">
              {(() => {
                const doc = partner.documents?.find((d) => d.document_kind === selectedDocKind);
                if (!doc) return <p className="text-sm text-stone-300">Not uploaded yet.</p>;
                if (!doc.url) {
                  return <p className="text-sm text-stone-300">File could not be loaded ({doc.storage_path}).</p>;
                }
                const view = doc.storage_path.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={doc.url} title={selectedDocKind} className="w-full flex-1 min-h-[560px] rounded bg-white" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not a static asset
                  <img
                    src={doc.url}
                    alt={selectedDocKind.replace(/_/g, ' ')}
                    style={{
                      transform: `scale(${docZoom / 100}) rotate(${docRotation}deg)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                    className="max-w-full max-h-[560px] rounded shadow-2xl bg-white"
                  />
                );
                return (
                  <>
                    {view}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-300">
                      <span className="uppercase font-bold">{doc.status}</span>
                      <span>Uploaded {new Date(doc.created_at).toLocaleString('en-IN')}</span>
                      <a href={doc.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                        <ExternalLink className="size-3" /> Open file
                      </a>
                    </div>
                  </>
                );
              })()}
            </div>
          </Card>
        </div>

        {/* RIGHT PANE: CENTER DETAILS & APPROVAL CHECKLIST (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Physical Center Specifications */}
          <Card className="p-4 sm:p-5 border-teal/15 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal flex items-center gap-1.5 border-b border-teal/10 pb-2">
              <Store className="size-3.5" /> Kiosk Center Particulars
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-teal/70">Franchise Center Type:</span>
                <span className="font-bold text-teal uppercase">{partner.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal/70">City &amp; State:</span>
                <span className="font-medium text-teal">{partner.city}, {partner.state_code || 'TS'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal/70">Contact Phone:</span>
                <span className="font-mono text-teal">{partner.phone || '+91 98450 12345'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal/70">Public Directory Visibility:</span>
                <span className="font-bold text-teal">{partner.is_listed ? 'Listed on Map' : 'Hidden'}</span>
              </div>
            </div>
          </Card>

          {/* Verification Compliance Checklist */}
          <Card className="p-4 sm:p-5 border-teal/15 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal flex items-center gap-1.5 border-b border-teal/10 pb-2">
              <CheckCircle2 className="size-3.5" /> KYC Compliance Checklist
            </h4>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checks.tradeLicenseValid}
                  onChange={(e) => setChecks({ ...checks, tradeLicenseValid: e.target.checked })}
                  className="size-4 rounded border-teal/30 text-teal focus:ring-teal"
                />
                <span className="text-teal/90">Trade license is active &amp; legally valid</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checks.storefrontSignage}
                  onChange={(e) => setChecks({ ...checks, storefrontSignage: e.target.checked })}
                  className="size-4 rounded border-teal/30 text-teal focus:ring-teal"
                />
                <span className="text-teal/90">Storefront displays official MeeSeva/CSC branding</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checks.addressVerified}
                  onChange={(e) => setChecks({ ...checks, addressVerified: e.target.checked })}
                  className="size-4 rounded border-teal/30 text-teal focus:ring-teal"
                />
                <span className="text-teal/90">GPS geotag coordinates match premises within 50m</span>
              </label>
            </div>

            <div className="pt-2 border-t border-teal/10 flex flex-col gap-2">
              <button
                type="button"
                disabled={isPending || partner.verification_status === 'verified'}
                onClick={handleApprovePartner}
                className={cn(buttonClass({ variant: 'primary', size: 'md' }), 'w-full gap-2 justify-center')}
              >
                <BadgeCheck className="size-4" />
                <span>Issue Verified Kiosk Seal</span>
              </button>

              <button
                type="button"
                onClick={() => setRejectionModalOpen(true)}
                className={cn(buttonClass({ variant: 'secondary', size: 'sm' }), 'w-full text-rose-700 hover:text-rose-800')}
              >
                Reject with Re-upload Reason
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Rejection Modal with Preset Checklist */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-teal/20 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-teal/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-teal flex items-center gap-2">
                  <ShieldAlert className="size-5 text-rose-600" />
                  Reject Partner Verification
                </h3>
                <p className="text-xs text-teal/70 mt-0.5">
                  The partner operator will receive a notification to re-upload compliant documentation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectionModalOpen(false)}
                className="p-1 rounded text-teal/60 hover:text-teal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-teal block">
                Select Rejection Checklist Reason
              </label>
              <div className="space-y-1.5">
                {PRESET_REJECTION_REASONS.map((reason, idx) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={cn(
                      'w-full text-left p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition',
                      selectedReason === reason
                        ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold ring-1 ring-rose-500/30'
                        : 'border-teal/15 bg-canvas/40 text-teal hover:border-teal/40',
                    )}
                  >
                    <span className="grid size-5 place-items-center rounded bg-slate-900 text-white font-mono text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{reason}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-teal block mb-1">
                Additional Instructions for Partner (Optional)
              </label>
              <textarea
                value={customRejectNote}
                onChange={(e) => setCustomRejectNote(e.target.value)}
                placeholder="Specific guidance for the partner center operator..."
                rows={2}
                className="w-full rounded-xl border border-teal/20 bg-canvas p-2.5 text-xs text-teal focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-teal/10">
              <button
                type="button"
                onClick={() => setRejectionModalOpen(false)}
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmReject}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 text-xs transition shadow-sm"
              >
                {isPending ? 'Submitting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
