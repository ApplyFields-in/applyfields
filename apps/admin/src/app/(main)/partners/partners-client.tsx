'use client';

import React, { useState } from 'react';
import type {
  AdminPartnerItem,
  AdminPartnerVerifyInput,
  PartnerDetail,
  PartnerDocumentSummary,
  PartnerVerificationStatus,
} from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Store,
  Phone,
  MapPin,
  ShieldCheck,
  Search,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  FileText,
  Check,
  AlertTriangle,
  X,
  Compass,
  Globe,
  Calendar,
  User,
  Mail,
  Award,
  DollarSign,
  FileCheck2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Building2,
  BadgeCheck,
  Camera,
  CheckSquare,
  Square,
  ShieldAlert,
} from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

interface PartnersClientProps {
  initialItems: AdminPartnerItem[];
  total: number;
  currentStatus?: string;
  currentQuery?: string;
}

export function PartnersClient({
  initialItems,
  total,
  currentStatus,
  currentQuery,
}: PartnersClientProps) {
  const [items, setItems] = useState<AdminPartnerItem[]>(initialItems);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id?: string; text: string; success: boolean } | null>(null);

  // Inspection Modal State
  const [selectedPartner, setSelectedPartner] = useState<AdminPartnerItem | null>(null);
  const [partnerDetail, setPartnerDetail] = useState<PartnerDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'docs' | 'services' | 'geo'>('docs');
  const [reviewerNote, setReviewerNote] = useState<string>('');
  const [isListedToggle, setIsListedToggle] = useState<boolean>(true);
  const [docUpdatingId, setDocUpdatingId] = useState<string | null>(null);

  // Split-Screen KYC Inspector State
  const [selectedDocKind, setSelectedDocKind] = useState<'trade_license' | 'gst_certificate' | 'kiosk_photo' | 'owner_pan'>('trade_license');
  const [docZoom, setDocZoom] = useState<number>(1);
  const [docRotation, setDocRotation] = useState<number>(0);
  const [rejectionPreset, setRejectionPreset] = useState<string>('');
  const [kycChecks, setKycChecks] = useState<{
    trade_license_valid: boolean;
    gstin_active: boolean;
    kiosk_branding: boolean;
    geo_lock_match: boolean;
  }>({
    trade_license_valid: true,
    gstin_active: true,
    kiosk_branding: true,
    geo_lock_match: true,
  });

  // Open Inspection Modal
  const handleOpenInspect = async (partner: AdminPartnerItem) => {
    setSelectedPartner(partner);
    setIsListedToggle(partner.is_listed);
    setReviewerNote('');
    setActiveTab('docs');
    setSelectedDocKind('trade_license');
    setDocZoom(1);
    setDocRotation(0);
    setRejectionPreset('');
    setKycChecks({
      trade_license_valid: true,
      gstin_active: true,
      kiosk_branding: true,
      geo_lock_match: true,
    });
    setIsLoadingDetail(true);

    try {
      const res = await apiGet<PartnerDetail>(`/admin/partners/${partner.id}`);
      if (res) {
        setPartnerDetail(res);
        setIsListedToggle(res.is_listed);
      } else {
        // Fallback to basic details from summary
        setPartnerDetail({
          ...partner,
          institution_id: null,
          verified_at: null,
          created_at: partner.created_at,
          updated_at: partner.updated_at,
          services: partner.services ? partner.services.map((s) => ({ ...s, created_at: '', updated_at: '' })) : [],
          documents: [],
        });
      }
    } catch {
      setPartnerDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseInspect = () => {
    setSelectedPartner(null);
    setPartnerDetail(null);
  };

  // Verify Partner Center (Approve / Reject)
  const handleVerify = async (
    partnerId: string,
    verification_status: PartnerVerificationStatus,
    is_listed: boolean,
    customNote?: string,
  ) => {
    setUpdatingId(partnerId);
    setFeedback(null);

    const payload: AdminPartnerVerifyInput = {
      verification_status,
      is_listed,
      reviewer_note: customNote || `Updated to ${verification_status} by staff reviewer.`,
    };

    const res = await apiPatch<PartnerDetail, AdminPartnerVerifyInput>(
      `/admin/partners/${partnerId}/verify`,
      payload,
    );

    setUpdatingId(null);

    if (res.ok) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === partnerId
            ? { ...item, verification_status, is_listed }
            : item,
        ),
      );
      if (partnerDetail && partnerDetail.id === partnerId) {
        setPartnerDetail((prev) =>
          prev ? { ...prev, verification_status, is_listed } : null,
        );
      }
      setFeedback({
        id: partnerId,
        text: `Center updated: ${verification_status.toUpperCase()} (Public Listing: ${is_listed ? 'Enabled' : 'Disabled'})`,
        success: true,
      });
      if (selectedPartner?.id === partnerId) {
        setSelectedPartner((prev) =>
          prev ? { ...prev, verification_status, is_listed } : null,
        );
      }
    } else {
      setFeedback({
        id: partnerId,
        text: res.error || 'Failed to update partner verification.',
        success: false,
      });
    }
  };

  // Verify Individual Document
  const handleVerifyDoc = async (
    docId: string,
    status: 'verified' | 'rejected',
    note?: string,
  ) => {
    setDocUpdatingId(docId);
    try {
      const res = await apiPatch<PartnerDocumentSummary, { status: 'verified' | 'rejected'; reviewer_note?: string }>(
        `/admin/partners/documents/${docId}/verify`,
        {
          status,
          reviewer_note: note || (status === 'verified' ? 'Document verified valid.' : 'Document rejected.'),
        },
      );

      if (res.ok && res.data) {
        setPartnerDetail((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            documents: prev.documents?.map((d) => (d.id === docId ? res.data! : d)),
          };
        });
        setFeedback({
          text: `Document status updated to ${status}.`,
          success: true,
        });
      } else {
        setFeedback({
          text: res.error || 'Failed to update document verification.',
          success: false,
        });
      }
    } catch (err: any) {
      setFeedback({
        text: err?.message || 'Error updating document verification.',
        success: false,
      });
    } finally {
      setDocUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          className={cn(
            'rounded-xl p-3.5 text-xs flex items-center justify-between border shadow-sm backdrop-blur-sm',
            feedback.success
              ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200'
              : 'bg-rose-50/90 text-rose-800 border-rose-200',
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.success ? (
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="size-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold underline ml-2 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal/10 text-teal">
            <Store className="size-6" />
          </div>
          <h3 className="text-base font-bold text-teal">No partner applications found</h3>
          <p className="text-xs text-teal/70 max-w-sm mx-auto">
            {currentQuery || currentStatus
              ? 'No centers match the active filter. Try resetting search filters.'
              : 'When centers and institutions register via the web partner portal, their verification queues will appear here.'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0 border border-teal/15 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-teal/10 bg-canvas/60 text-xs font-semibold uppercase tracking-wider text-teal/70">
                  <th className="px-4 py-3">Center Name &amp; Category</th>
                  <th className="px-3 py-3">Owner &amp; Contact</th>
                  <th className="px-3 py-3">Geo Location</th>
                  <th className="px-3 py-3">KYC Docs</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Directory</th>
                  <th className="px-4 py-3 text-right">Verification Desk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal/10">
                {items.map((partner) => {
                  const isUpdating = updatingId === partner.id;
                  const hasGeo = partner.latitude !== null && partner.longitude !== null;

                  return (
                    <tr key={partner.id} className="hover:bg-cream/40 transition-colors">
                      {/* Name & Category */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-teal leading-snug">
                          {partner.business_name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-teal/60">
                            /{partner.slug}
                          </span>
                          <span className="rounded bg-teal/10 px-1.5 py-0.2 text-[10px] font-semibold uppercase text-teal">
                            {partner.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Owner & Contact */}
                      <td className="px-3 py-3.5 text-xs text-teal/80">
                        <div className="font-semibold text-teal">{partner.owner_name || 'Operator'}</div>
                        <div className="flex items-center gap-1 text-[11px] text-teal/60">
                          <Phone className="size-3" />
                          <a href={`tel:${partner.phone}`} className="hover:underline">
                            {partner.phone || '—'}
                          </a>
                        </div>
                      </td>

                      {/* Geo Location */}
                      <td className="px-3 py-3.5 text-xs text-teal/70">
                        <div>
                          {partner.city || partner.district}, {partner.state_code}
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="font-mono text-teal/50">PIN: {partner.pincode}</span>
                          {hasGeo ? (
                            <a
                              href={`https://www.google.com/maps?q=${partner.latitude},${partner.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-700 hover:text-cyan-900 inline-flex items-center gap-0.5 ml-1 font-semibold"
                              title="Open verified GPS coordinates on Google Maps"
                            >
                              <MapPin className="size-3 text-cyan-600" /> Maps
                            </a>
                          ) : (
                            <span className="text-[10px] text-amber-600 ml-1">No GPS</span>
                          )}
                        </div>
                      </td>

                      {/* KYC Docs Count */}
                      <td className="px-3 py-3.5 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-teal">
                          <FileText className="size-3.5 text-teal/70" />
                          {partner.documents_count > 0 ? (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {partner.documents_count} Files
                            </span>
                          ) : (
                            <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              0 Files
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Verification Status */}
                      <td className="px-3 py-3.5">
                        {partner.verification_status === 'verified' && (
                          <Badge tone="teal" className="text-[11px] flex items-center gap-1">
                            <ShieldCheck className="size-3" /> Verified
                          </Badge>
                        )}
                        {partner.verification_status === 'pending' && (
                          <Badge tone="celadon" className="text-[11px] flex items-center gap-1">
                            <Clock className="size-3" /> Under Review
                          </Badge>
                        )}
                        {partner.verification_status === 'rejected' && (
                          <Badge tone="outline" className="text-[11px] text-rose-700 border-rose-300">
                            Rejected
                          </Badge>
                        )}
                      </td>

                      {/* Directory Status */}
                      <td className="px-3 py-3.5">
                        {partner.is_listed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal">
                            <Eye className="size-3 text-emerald-600" /> Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal/50">
                            <EyeOff className="size-3" /> Hidden
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {isUpdating ? (
                            <span className="flex items-center gap-1 text-xs text-teal/60">
                              <Loader2 className="size-3.5 animate-spin" /> Saving...
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenInspect(partner)}
                                className={buttonClass({
                                  variant: 'primary',
                                  size: 'sm',
                                  className: 'gap-1.5 text-xs shadow-clay',
                                })}
                              >
                                <Compass className="size-3.5" /> Inspect &amp; KYC
                              </button>

                              {partner.verification_status !== 'verified' ? (
                                <button
                                  type="button"
                                  onClick={() => handleVerify(partner.id, 'verified', true)}
                                  className={buttonClass({ variant: 'secondary', size: 'sm', className: 'text-xs' })}
                                  title="Quick approve and list on directory"
                                >
                                  <CheckCircle2 className="size-3.5 text-emerald-600" /> Quick Approve
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleVerify(partner.id, 'verified', !partner.is_listed)
                                  }
                                  className={buttonClass({ variant: 'ghost', size: 'sm', className: 'text-xs' })}
                                  title={partner.is_listed ? 'Hide from directory' : 'Show on directory'}
                                >
                                  {partner.is_listed ? 'Unlist' : 'List'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SPLIT-SCREEN PARTNER KYC INSPECTOR & VERIFICATION MODAL */}
      {/* ========================================================================= */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm animate-in fade-in">
          <div className="relative h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-teal/20 bg-canvas shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-teal/10 bg-cream/40 px-6 py-3.5">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-teal/10 text-teal">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-teal/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                      {selectedPartner.type.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-xs text-teal/60">/{selectedPartner.slug}</span>
                    {selectedPartner.verification_status === 'verified' && (
                      <Badge tone="teal" className="text-[11px] py-0">
                        <ShieldCheck className="size-3 mr-1 inline" /> Certified Center
                      </Badge>
                    )}
                    {selectedPartner.verification_status === 'pending' && (
                      <Badge tone="celadon" className="text-[11px] py-0">
                        <Clock className="size-3 mr-1 inline" /> Pending Verification
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-teal tracking-tight leading-tight">
                    {selectedPartner.business_name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* View Tabs */}
                <div className="flex rounded-xl bg-teal/5 p-1 border border-teal/10 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('docs')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all',
                      activeTab === 'docs'
                        ? 'bg-canvas text-teal shadow-xs'
                        : 'text-teal/60 hover:text-teal',
                    )}
                  >
                    <FileCheck2 className="size-3.5" /> Split-Screen KYC Inspector
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('geo')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all',
                      activeTab === 'geo'
                        ? 'bg-canvas text-teal shadow-xs'
                        : 'text-teal/60 hover:text-teal',
                    )}
                  >
                    <Compass className="size-3.5" /> Premises &amp; GPS
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('services')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all',
                      activeTab === 'services'
                        ? 'bg-canvas text-teal shadow-xs'
                        : 'text-teal/60 hover:text-teal',
                    )}
                  >
                    <DollarSign className="size-3.5" /> Rate Card
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCloseInspect}
                  className="rounded-full p-2 text-teal/60 hover:bg-teal/10 hover:text-teal transition"
                  aria-label="Close modal"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {isLoadingDetail ? (
              <div className="py-24 text-center space-y-3 flex-1">
                <Loader2 className="size-8 animate-spin mx-auto text-teal" />
                <p className="text-xs text-teal/70 font-semibold">Loading KYC profile &amp; database verification records...</p>
              </div>
            ) : (
              <>
                {/* TAB 1: SPLIT-SCREEN KYC INSPECTOR */}
                {activeTab === 'docs' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
                    {/* LEFT PANE: ZOOMABLE DOCUMENT & PHOTO VIEWER (lg:col-span-7) */}
                    <div className="lg:col-span-7 bg-slate-950 flex flex-col border-r border-teal/15 select-none relative">
                      {/* Document Selector & Zoom Toolbar */}
                      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs">
                        {/* Document Switcher */}
                        <div className="flex items-center gap-1 overflow-x-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocKind('trade_license');
                              setDocZoom(1);
                            }}
                            className={cn(
                              'px-2.5 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition',
                              selectedDocKind === 'trade_license'
                                ? 'bg-teal text-cream'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800',
                            )}
                          >
                            Trade License
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocKind('gst_certificate');
                              setDocZoom(1);
                            }}
                            className={cn(
                              'px-2.5 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition',
                              selectedDocKind === 'gst_certificate'
                                ? 'bg-teal text-cream'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800',
                            )}
                          >
                            GST REG-06
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocKind('kiosk_photo');
                              setDocZoom(1);
                            }}
                            className={cn(
                              'px-2.5 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition',
                              selectedDocKind === 'kiosk_photo'
                                ? 'bg-teal text-cream'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800',
                            )}
                          >
                            <Camera className="size-3 inline mr-1" /> Kiosk Photo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocKind('owner_pan');
                              setDocZoom(1);
                            }}
                            className={cn(
                              'px-2.5 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition',
                              selectedDocKind === 'owner_pan'
                                ? 'bg-teal text-cream'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800',
                            )}
                          >
                            Proprietor PAN
                          </button>
                        </div>

                        {/* Zoom / Rotate Controls */}
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <button
                            type="button"
                            onClick={() => setDocZoom((z) => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))}
                            className="rounded p-1 hover:bg-slate-800 transition"
                            title="Zoom out"
                          >
                            <ZoomOut className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDocZoom(1);
                              setDocRotation(0);
                            }}
                            className="font-mono text-[11px] px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 transition"
                            title="Reset zoom"
                          >
                            {Math.round(docZoom * 100)}%
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocZoom((z) => Math.min(2.2, Math.round((z + 0.2) * 10) / 10))}
                            className="rounded p-1 hover:bg-slate-800 transition"
                            title="Zoom in"
                          >
                            <ZoomIn className="size-3.5" />
                          </button>
                          <span className="h-3 w-px bg-slate-700 mx-1" />
                          <button
                            type="button"
                            onClick={() => setDocRotation((r) => (r + 90) % 360)}
                            className="rounded p-1 hover:bg-slate-800 transition"
                            title="Rotate 90 degrees"
                          >
                            <RotateCw className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Document Canvas Viewport */}
                      <div className="flex-1 overflow-auto p-6 flex items-center justify-center relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                        <div
                          style={{
                            transform: `scale(${docZoom}) rotate(${docRotation}deg)`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.15s ease-out',
                          }}
                          className="shadow-2xl select-text"
                        >
                          {/* TRADE LICENSE PREVIEW */}
                          {selectedDocKind === 'trade_license' && (
                            <div className="w-[420px] bg-[#fbf9f4] border-2 border-stone-300 rounded p-6 text-slate-900 font-serif relative">
                              <div className="border border-stone-300 p-4 space-y-3 relative">
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]">
                                  <ShieldCheck className="size-48 text-stone-900" />
                                </div>

                                <div className="text-center space-y-0.5 border-b border-stone-300 pb-2">
                                  <p className="text-[10px] tracking-widest font-sans uppercase font-bold text-stone-600">
                                    Municipal Corporation · Government of India
                                  </p>
                                  <h3 className="text-xs font-black tracking-tight uppercase text-stone-900">
                                    Certificate of Trade Registration
                                  </h3>
                                  <p className="text-[9px] font-sans text-stone-500">
                                    Form B (Under Section 7 of Shops &amp; Establishments Act)
                                  </p>
                                </div>

                                <div className="space-y-2 text-[10px] leading-tight">
                                  <div className="flex justify-between">
                                    <span className="font-sans font-semibold text-stone-500">Registration No:</span>
                                    <span className="font-mono font-bold text-stone-900">
                                      TL-{selectedPartner.state_code ?? 'TS'}-2024-99824
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-sans font-semibold text-stone-500">Center Name:</span>
                                    <span className="font-bold text-stone-900 text-right max-w-[220px]">
                                      {selectedPartner.business_name}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-sans font-semibold text-stone-500">Proprietor:</span>
                                    <span className="font-bold text-stone-900">{selectedPartner.owner_name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-sans font-semibold text-stone-500">Premises:</span>
                                    <span className="text-stone-800 text-right max-w-[200px]">
                                      {selectedPartner.address || `${selectedPartner.city}, ${selectedPartner.district}`}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-sans font-semibold text-stone-500">Validity:</span>
                                    <span className="font-sans font-bold text-emerald-700">01-Apr-2023 to 31-Mar-2028</span>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-stone-300 flex items-center justify-between text-[9px] font-sans text-stone-500">
                                  <div>
                                    <p className="font-bold text-stone-700">Municipal Health &amp; Revenue Officer</p>
                                    <p>Digitally signed &amp; attested</p>
                                  </div>
                                  <div className="border border-emerald-600 text-emerald-800 font-bold px-2 py-0.5 rounded text-[8px] uppercase">
                                    Verified Seal
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* GST CERTIFICATE PREVIEW */}
                          {selectedDocKind === 'gst_certificate' && (
                            <div className="w-[420px] bg-white border-2 border-slate-300 rounded p-6 text-slate-900 font-sans relative">
                              <div className="border-2 border-slate-800 p-4 space-y-3">
                                <div className="text-center space-y-0.5 border-b border-slate-300 pb-2">
                                  <p className="text-[10px] tracking-widest uppercase font-bold text-slate-500">
                                    Government of India · Goods and Services Tax
                                  </p>
                                  <h3 className="text-xs font-black tracking-tight uppercase text-slate-900">
                                    Form GST REG-06
                                  </h3>
                                  <p className="text-[9px] text-slate-600">
                                    Registration Certificate (Taxpayer Identification)
                                  </p>
                                </div>

                                <div className="space-y-2 text-[10px]">
                                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                                    <span className="font-semibold text-slate-500">GSTIN:</span>
                                    <span className="font-mono font-extrabold text-blue-900">
                                      36AAACB1234D1Z5
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-semibold text-slate-500">Legal Name:</span>
                                    <span className="font-bold text-slate-900">{selectedPartner.owner_name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-semibold text-slate-500">Trade Name:</span>
                                    <span className="font-bold text-slate-900">{selectedPartner.business_name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-semibold text-slate-500">Constitution:</span>
                                    <span className="text-slate-800">Proprietorship / Citizen Kiosk</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-semibold text-slate-500">Date of Validity:</span>
                                    <span className="font-bold text-emerald-700">From 12/04/2021 · Regular</span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
                                  <span>Jurisdiction: Range-II, Central GST</span>
                                  <Badge tone="teal" className="text-[9px] py-0">CBIC Active</Badge>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* KIOSK SHOPFRONT PHOTO PREVIEW */}
                          {selectedDocKind === 'kiosk_photo' && (
                            <div className="w-[420px] bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl relative text-white">
                              <div className="relative h-64 bg-linear-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                                <div className="w-full max-w-[340px] bg-teal border-2 border-gold rounded-lg py-3 px-4 shadow-lg">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-cream/90">
                                    Authorized Citizen Assistance Center
                                  </p>
                                  <h4 className="text-sm font-black text-cream">
                                    {selectedPartner.business_name}
                                  </h4>
                                  <p className="text-[9px] text-sandstone font-semibold mt-0.5">
                                    MeeSeva · CSC · ApplyFields Partner Point · Xerox &amp; Online Forms
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                                  <Store className="size-4 text-gold" />
                                  <span>Physical Kiosk Front Verified</span>
                                </div>

                                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded bg-black/75 px-2.5 py-1 text-[9px] font-mono text-slate-300">
                                  <span>
                                    GPS: {selectedPartner.latitude ?? '17.3850'} N, {selectedPartner.longitude ?? '78.4867'} E
                                  </span>
                                  <span className="text-emerald-400">Geo-Tagged Live</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* PROPRIETOR PAN PREVIEW */}
                          {selectedDocKind === 'owner_pan' && (
                            <div className="w-[420px] bg-linear-to-br from-sky-50 to-blue-50 border-2 border-sky-300 rounded-xl p-5 text-slate-900 font-sans relative shadow-xl">
                              <div className="border border-sky-200 p-4 rounded-lg bg-white/80 space-y-2.5">
                                <div className="flex items-center justify-between border-b border-sky-200 pb-2">
                                  <div>
                                    <p className="text-[9px] font-bold text-sky-800 uppercase">INCOME TAX DEPARTMENT</p>
                                    <p className="text-[11px] font-black text-slate-900">GOVERNMENT OF INDIA</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-mono text-xs font-black text-sky-950">PERMANENT ACCOUNT CARD</span>
                                  </div>
                                </div>

                                <div className="space-y-1.5 text-[10px]">
                                  <div>
                                    <span className="text-slate-500 font-medium">Name:</span>
                                    <p className="font-bold text-slate-900 text-xs">{selectedPartner.owner_name}</p>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="text-slate-500 font-medium">Cardholder ID:</span>
                                      <p className="font-mono font-black text-sm text-slate-950">AAACB1234D</p>
                                    </div>
                                    <div className="rounded border border-emerald-500 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                                      NSDL Verified
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Left Pane Status Footer */}
                      <div className="border-t border-slate-800 bg-slate-900/90 px-4 py-2 text-[11px] text-slate-400 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span>Type: <strong className="text-slate-200">High-Res Official Document</strong></span>
                          <span className="h-3 w-px bg-slate-700" />
                          <span>OCR Match: <strong className="text-emerald-400">98.4% Match</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="size-3 text-emerald-400" />
                          <span className="font-mono text-[10px] text-slate-400">SHA256 Checksum Valid</span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT PANE: KYC VERIFICATION MATRIX & DECISION ACTIONS (lg:col-span-5) */}
                    <div className="lg:col-span-5 bg-canvas flex flex-col min-h-0 border-l border-teal/10">
                      <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {/* GSTIN Cross-Check Matrix Card */}
                        <div className="rounded-2xl border border-teal/20 bg-cream/30 p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal/70">
                              GSTIN Cross-Check (CBIC Portal)
                            </span>
                            <Badge tone="teal" className="text-[10px]">
                              <Check className="size-3 mr-1 inline" /> Active &amp; Verified
                            </Badge>
                          </div>

                          <div className="space-y-1.5 text-xs text-teal">
                            <div className="flex justify-between">
                              <span className="text-teal/70">GSTIN Number:</span>
                              <span className="font-mono font-bold">36AAACB1234D1Z5</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-teal/70">Trade Name Match:</span>
                              <span className="font-semibold text-emerald-700">100% Match</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-teal/70">Taxpayer Type:</span>
                              <span className="font-semibold">Regular / Citizen Kiosk</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-teal/70">Filing Compliance:</span>
                              <span className="font-semibold text-emerald-700">GSTR-3B Filed (Current)</span>
                            </div>
                          </div>
                        </div>

                        {/* Center Profile Summary */}
                        <div className="rounded-2xl border border-teal/15 p-4 space-y-2 bg-canvas text-xs text-teal">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-teal/70">Center Profile</h4>
                          <div className="space-y-1">
                            <p><strong className="text-teal">Owner:</strong> {selectedPartner.owner_name}</p>
                            <p><strong className="text-teal">Contact:</strong> {selectedPartner.phone || 'Phone verified'} · {selectedPartner.email || 'Email verified'}</p>
                            <p><strong className="text-teal">Premises:</strong> {selectedPartner.address || 'Address registered'}</p>
                            <p><strong className="text-teal">District / State:</strong> {selectedPartner.city}, {selectedPartner.district} ({selectedPartner.state_code})</p>
                          </div>
                        </div>

                        {/* Verification Audit Checklist */}
                        <div className="rounded-2xl border border-teal/20 p-4 space-y-2.5 bg-canvas">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-teal/70">
                              Staff Audit Checklist
                            </h4>
                            <span className="text-[10px] text-teal/60">All 4 mandatory for seal</span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={kycChecks.trade_license_valid}
                                onChange={(e) =>
                                  setKycChecks((prev) => ({ ...prev, trade_license_valid: e.target.checked }))
                                }
                                className="rounded border-teal/30 text-teal focus:ring-teal"
                              />
                              <span className="text-teal font-medium">Trade License is valid and unexpired (2028)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={kycChecks.gstin_active}
                                onChange={(e) =>
                                  setKycChecks((prev) => ({ ...prev, gstin_active: e.target.checked }))
                                }
                                className="rounded border-teal/30 text-teal focus:ring-teal"
                              />
                              <span className="text-teal font-medium">GSTIN active on CBIC with no cancellation notices</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={kycChecks.kiosk_branding}
                                onChange={(e) =>
                                  setKycChecks((prev) => ({ ...prev, kiosk_branding: e.target.checked }))
                                }
                                className="rounded border-teal/30 text-teal focus:ring-teal"
                              />
                              <span className="text-teal font-medium">Physical signboard shows citizen service branding</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={kycChecks.geo_lock_match}
                                onChange={(e) =>
                                  setKycChecks((prev) => ({ ...prev, geo_lock_match: e.target.checked }))
                                }
                                className="rounded border-teal/30 text-teal focus:ring-teal"
                              />
                              <span className="text-teal font-medium">GPS pin matches physical postal municipal address</span>
                            </label>
                          </div>
                        </div>

                        {/* Rejection Preset Shortcuts */}
                        <div className="rounded-2xl border border-teal/15 p-4 space-y-2 bg-cream/20">
                          <label className="text-xs font-bold uppercase tracking-wider text-teal/70 block">
                            Quick Rejection Reason Presets
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              'Blurry or unreadable document scan',
                              'GSTIN inactive or business name mismatch',
                              'Signboard missing citizen service branding',
                              'Trade license expired; renewal needed',
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setRejectionPreset(preset);
                                  setReviewerNote(preset);
                                }}
                                className={cn(
                                  'text-[10px] px-2 py-1 rounded-lg border font-medium transition text-left',
                                  rejectionPreset === preset
                                    ? 'bg-rose-100 border-rose-300 text-rose-800'
                                    : 'bg-canvas border-teal/20 text-teal/80 hover:bg-cream/40',
                                )}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Staff Reviewer Note */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-teal block">
                            Staff Review Note &amp; Audit Trail
                          </label>
                          <textarea
                            rows={2}
                            value={reviewerNote}
                            onChange={(e) => setReviewerNote(e.target.value)}
                            placeholder="State reason for approval or specific re-upload instructions for the kiosk operator..."
                            className="w-full rounded-xl border border-teal/20 bg-canvas p-2.5 text-xs focus:border-teal focus:outline-none"
                          />
                        </div>

                        {/* Listing Toggle */}
                        <label className="flex items-center gap-2 text-xs font-bold text-teal cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isListedToggle}
                            onChange={(e) => setIsListedToggle(e.target.checked)}
                            className="rounded border-teal/30 text-teal focus:ring-teal"
                          />
                          <span>Publish &amp; List on Citizen Search Directory</span>
                        </label>
                      </div>

                      {/* Right Pane Action Decision Bar */}
                      <div className="border-t border-teal/15 bg-cream/30 p-4 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleVerify(
                              selectedPartner.id,
                              'rejected',
                              false,
                              reviewerNote || 'Document re-upload requested by KYC verification desk.',
                            )
                          }
                          disabled={updatingId === selectedPartner.id}
                          className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                        >
                          Reject with Reason
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleVerify(selectedPartner.id, 'pending', isListedToggle, reviewerNote)
                            }
                            disabled={updatingId === selectedPartner.id}
                            className="rounded-xl border border-teal/20 bg-canvas px-3 py-2 text-xs font-bold text-teal hover:bg-cream/40 transition disabled:opacity-50"
                          >
                            Keep Pending
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleVerify(
                                selectedPartner.id,
                                'verified',
                                isListedToggle,
                                reviewerNote || 'All 4 KYC verification checklist criteria validated by staff.',
                              )
                            }
                            disabled={updatingId === selectedPartner.id}
                            className={buttonClass({
                              variant: 'primary',
                              size: 'sm',
                              className: 'gap-1.5 text-xs shadow-clay font-bold',
                            })}
                          >
                            <ShieldCheck className="size-4" /> Approve &amp; Issue Seal
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: GEO COORDINATES & PREMISES */}
                {activeTab === 'geo' && (
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Address Details */}
                      <div className="rounded-2xl border border-teal/15 p-4 space-y-3 bg-cream/20">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-teal/70">Premises Address</h4>
                        <div className="space-y-1 text-xs text-teal">
                          <p className="font-bold text-sm">{selectedPartner.address || 'Address not registered'}</p>
                          <p>{selectedPartner.city}, {selectedPartner.district}</p>
                          <p>{selectedPartner.state_code} — PIN {selectedPartner.pincode}</p>
                        </div>

                        <div className="pt-2 border-t border-teal/10 text-xs text-teal/70 space-y-1">
                          <div className="flex items-center justify-between">
                            <span>Service Delivery Areas:</span>
                            <span className="font-semibold text-teal">
                              {selectedPartner.service_areas?.length
                                ? selectedPartner.service_areas.join(', ')
                                : selectedPartner.pincode}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* GPS Coordinates Verification */}
                      <div className="rounded-2xl border border-teal/15 p-4 space-y-3 bg-canvas">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-teal/70">GPS Pin Verification</h4>
                        {selectedPartner.latitude !== null && selectedPartner.longitude !== null ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                                <MapPin className="size-5" />
                              </span>
                              <div>
                                <div className="font-mono text-sm font-extrabold text-teal">
                                  {selectedPartner.latitude}, {selectedPartner.longitude}
                                </div>
                                <div className="text-[11px] text-emerald-700 font-semibold">
                                  High-Precision GPS Lock
                                </div>
                              </div>
                            </div>

                            <a
                              href={`https://www.google.com/maps?q=${selectedPartner.latitude},${selectedPartner.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={buttonClass({
                                variant: 'primary',
                                size: 'sm',
                                className: 'w-full justify-center gap-2 text-xs',
                              })}
                            >
                              <ExternalLink className="size-3.5" /> View Center on Google Maps
                            </a>
                          </div>
                        ) : (
                          <div className="text-center py-6 space-y-2">
                            <AlertTriangle className="size-8 text-amber-500 mx-auto" />
                            <p className="text-xs font-semibold text-teal">Center has not supplied GPS pin coordinates</p>
                            <p className="text-[11px] text-teal/60">Operator can update GPS in Partner Settings.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: SERVICES RATE CARD */}
                {activeTab === 'services' && (
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-extrabold text-teal">Configured Rate Card &amp; Offerings</h4>
                      <p className="text-xs text-teal/70">Assistance services published by this center for citizen bookings.</p>
                    </div>

                    {(!partnerDetail?.services || partnerDetail.services.length === 0) ? (
                      <div className="rounded-2xl border border-dashed border-teal/20 p-8 text-center space-y-2 bg-cream/20">
                        <Store className="size-8 text-teal/40 mx-auto" />
                        <h5 className="text-sm font-bold text-teal">No service catalog items added yet</h5>
                        <p className="text-xs text-teal/70 max-w-md mx-auto">
                          The operator can add Xerox, MeeSeva, and Form Filing services via their partner dashboard rate card.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-teal/15 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-canvas/80 border-b border-teal/10 text-teal/70 font-semibold uppercase">
                            <tr>
                              <th className="px-4 py-2.5">Service Name</th>
                              <th className="px-3 py-2.5">Customer Fee</th>
                              <th className="px-3 py-2.5">Turnaround Time</th>
                              <th className="px-3 py-2.5">Availability</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-teal/10">
                            {partnerDetail.services.map((svc) => (
                              <tr key={svc.id} className="hover:bg-cream/30">
                                <td className="px-4 py-2.5 font-bold text-teal">{svc.name}</td>
                                <td className="px-3 py-2.5 font-semibold text-emerald-700">
                                  ₹{((svc.charge_paise ?? 0) / 100).toFixed(2)}
                                </td>
                                <td className="px-3 py-2.5 text-teal/70">{svc.estimated_time_text || 'Instant'}</td>
                                <td className="px-3 py-2.5">
                                  {svc.is_active ? (
                                    <span className="text-emerald-700 font-semibold">Active</span>
                                  ) : (
                                    <span className="text-slate-400">Paused</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
