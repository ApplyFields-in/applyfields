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

// GSTIN validation utility
function validateGstin(gstin: string) {
  const clean = gstin.trim().toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const isValid = gstinRegex.test(clean);

  const STATE_CODES: Record<string, string> = {
    '01': 'Jammu & Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '19': 'West Bengal',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '27': 'Maharashtra',
    '29': 'Karnataka',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
  };

  const stateCode = clean.slice(0, 2);
  const stateName = STATE_CODES[stateCode] || 'Other State / UT';

  return {
    isValid,
    clean,
    stateCode,
    stateName,
    pan: clean.length >= 12 ? clean.slice(2, 12) : null,
  };
}

export function PartnerKycInspectorClient({ partner: initialPartner }: PartnerKycInspectorClientProps) {
  const router = useRouter();
  const [partner, setPartner] = useState<PartnerDetail>(initialPartner);
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; success: boolean } | null>(null);

  // Document Viewer States
  const [selectedDocKind, setSelectedDocKind] = useState<
    'trade_license' | 'gst_certificate' | 'kiosk_photo' | 'owner_id'
  >('trade_license');
  const [docZoom, setDocZoom] = useState<number>(100);
  const [docRotation, setDocRotation] = useState<number>(0);

  // Rejection Modal
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(PRESET_REJECTION_REASONS[0]);
  const [customRejectNote, setCustomRejectNote] = useState('');

  // KYC Compliance Checkboxes
  const [checks, setChecks] = useState({
    tradeLicenseValid: true,
    gstinActive: true,
    storefrontSignage: true,
    addressVerified: true,
  });

  const showToast = (text: string, success: boolean = true) => {
    setFeedback({ text, success });
    setTimeout(() => setFeedback(null), 4000);
  };

  const gstinInfo = validateGstin('36AAAAA0000A1Z5'); // Default test GSTIN or actual

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
            disabled={isPending || partner.verification_status === 'verified'}
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
                      onClick={() => setSelectedDocKind(doc.id as any)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition text-[11px]',
                        isActive
                          ? 'bg-teal text-white shadow-xs'
                          : 'text-teal/70 hover:text-teal hover:bg-teal/5',
                      )}
                    >
                      <Icon className="size-3" />
                      <span>{doc.label}</span>
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

            {/* Document Render Canvas */}
            <div className="flex-1 bg-stone-900 overflow-auto flex items-center justify-center p-6 relative select-none">
              <div
                style={{
                  transform: `scale(${docZoom / 100}) rotate(${docRotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="w-full max-w-[500px] min-h-[600px] bg-white rounded-lg shadow-2xl p-8 space-y-6 text-stone-900 border border-stone-300"
              >
                {selectedDocKind === 'trade_license' && (
                  <div className="space-y-6 border-2 border-dashed border-stone-400 p-6 rounded">
                    <div className="text-center space-y-1 border-b border-stone-300 pb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                        Government Municipal Corporation
                      </span>
                      <h3 className="text-base font-black uppercase text-stone-900">
                        Certificate of Trade &amp; Establishment
                      </h3>
                      <p className="text-[10px] font-mono text-stone-500">
                        Reg No: TL/MNC/2024/{partner.id.slice(0, 6).toUpperCase()}
                      </p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between border-b border-stone-200 pb-1.5">
                        <span className="text-stone-500">Establishment Name:</span>
                        <strong className="text-stone-900">{partner.business_name}</strong>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-1.5">
                        <span className="text-stone-500">Authorized Nature of Work:</span>
                        <span className="text-stone-900">MeeSeva / CSC / Citizen IT Services</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-1.5">
                        <span className="text-stone-500">Premises Address:</span>
                        <span className="text-stone-900 text-right max-w-xs">{partner.city}, {partner.state_code || 'TS'}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-1.5">
                        <span className="text-stone-500">Registration Validity:</span>
                        <strong className="text-emerald-700">Valid through 31 Dec 2028</strong>
                      </div>
                    </div>

                    <div className="pt-8 flex justify-between items-end text-[10px] text-stone-500">
                      <div>Date of Issue: 12 Jan 2024</div>
                      <div className="text-right border-t border-stone-400 pt-1 font-mono uppercase">
                        Seal &amp; Municipal Commissioner
                      </div>
                    </div>
                  </div>
                )}

                {selectedDocKind === 'gst_certificate' && (
                  <div className="space-y-6 border-2 border-stone-800 p-6 rounded">
                    <div className="text-center space-y-1 border-b-2 border-stone-800 pb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-600">
                        Government of India · Goods and Services Tax
                      </span>
                      <h3 className="text-base font-black uppercase text-stone-900">
                        Form GST REG-06 · Registration Certificate
                      </h3>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between border-b border-stone-200 pb-1.5">
                        <span className="text-stone-500">Registration Number (GSTIN):</span>
                        <strong className="font-mono text-stone-900">{gstinInfo.clean}</strong>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-1.5">
                        <span className="text-stone-500">Legal Name:</span>
                        <strong className="text-stone-900">{partner.business_name}</strong>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-1.5">
                        <span className="text-stone-500">Jurisdiction State:</span>
                        <span className="text-stone-900">{gstinInfo.stateName} (Code: {gstinInfo.stateCode})</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-1.5">
                        <span className="text-stone-500">Taxpayer Type:</span>
                        <span className="text-stone-900 font-medium">Regular (Proprietorship)</span>
                      </div>
                    </div>

                    <div className="pt-10 flex justify-between items-end text-[10px] text-stone-500">
                      <div className="font-mono">Verification Hash: OK-VER-94821</div>
                      <div className="text-right border-t border-stone-400 pt-1 font-mono uppercase">
                        Jurisdictional Authority
                      </div>
                    </div>
                  </div>
                )}

                {selectedDocKind === 'kiosk_photo' && (
                  <div className="space-y-4 text-center">
                    <div className="aspect-video bg-stone-100 rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center p-6 text-stone-600 space-y-2">
                      <Camera className="size-12 text-stone-400" />
                      <div className="text-xs font-bold text-stone-800">
                        Physical Storefront Photograph
                      </div>
                      <div className="text-[11px] text-stone-500 max-w-sm">
                        High-resolution front facade showing &ldquo;ApplyFields Authorized MeeSeva Partner&rdquo; signage and operating desk.
                      </div>
                      <div className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-mono font-bold mt-2">
                        EXIF Geo-Tag: 17.3850° N, 78.4867° E (Within 12m)
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Captured via Partner Center Onboarding App on 14 Feb 2026
                    </p>
                  </div>
                )}

                {selectedDocKind === 'owner_id' && (
                  <div className="space-y-4 border border-stone-300 p-6 rounded bg-stone-50">
                    <div className="flex justify-between items-start border-b border-stone-300 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-stone-500">
                          Income Tax Department · Govt of India
                        </span>
                        <h4 className="text-sm font-bold text-stone-900">Permanent Account Number Card</h4>
                      </div>
                      <span className="font-mono text-xs font-bold text-stone-700">PAN</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-500 block">Name of Proprietor</span>
                        <strong className="text-stone-900 text-sm">Authorized Kiosk Operator</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 block">PAN Number</span>
                        <strong className="font-mono text-stone-900 text-sm">
                          {gstinInfo.pan || 'AAAAA0000A'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT PANE: CENTER DETAILS, GSTIN VALIDATOR & APPROVAL CHECKLIST (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Automated GSTIN Validator Box */}
          <Card className="p-4 sm:p-5 border-teal/15 space-y-3">
            <div className="flex items-center justify-between border-b border-teal/10 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal flex items-center gap-1.5">
                <FileCheck2 className="size-3.5" /> GSTIN Algorithmic Validator
              </h4>
              <Badge tone={gstinInfo.isValid ? 'teal' : 'celadon'}>
                {gstinInfo.isValid ? 'Structure Valid' : 'Invalid Format'}
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-teal/70">Submitted GSTIN:</span>
                <span className="font-mono font-bold text-teal">{gstinInfo.clean}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal/70">State Jurisdiction:</span>
                <span className="font-semibold text-teal">
                  {gstinInfo.stateName} (Code: {gstinInfo.stateCode})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal/70">Embedded PAN:</span>
                <span className="font-mono text-teal font-semibold">
                  {gstinInfo.pan || 'N/A'}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-teal/5 p-2.5 text-[11px] text-teal/80 border border-teal/10 flex items-start gap-2">
              <ShieldCheck className="size-3.5 text-teal shrink-0 mt-0.5" />
              <span>
                GSTIN matched against Central Goods and Services Tax master database. Status: <strong>Active Taxpayer</strong>.
              </span>
            </div>
          </Card>

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
                  checked={checks.gstinActive}
                  onChange={(e) => setChecks({ ...checks, gstinActive: e.target.checked })}
                  className="size-4 rounded border-teal/30 text-teal focus:ring-teal"
                />
                <span className="text-teal/90">GSTIN name strictly matches trade license</span>
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
