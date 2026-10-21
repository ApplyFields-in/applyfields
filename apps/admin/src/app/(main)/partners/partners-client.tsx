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

  // Open Inspection Modal
  const handleOpenInspect = async (partner: AdminPartnerItem) => {
    setSelectedPartner(partner);
    setIsListedToggle(partner.is_listed);
    setReviewerNote('');
    setActiveTab('docs');
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
      {/* PARTNER INSPECTION & KYC GEO-VERIFICATION MODAL */}
      {/* ========================================================================= */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-teal/20 bg-canvas shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-teal/10 bg-cream/30 p-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-teal/10 px-2 py-0.5 text-xs font-bold uppercase text-teal">
                    {selectedPartner.type.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-xs text-teal/60">/{selectedPartner.slug}</span>
                  {selectedPartner.verification_status === 'verified' && (
                    <Badge tone="teal" className="text-xs">
                      <ShieldCheck className="size-3 mr-1 inline" /> Certified Center
                    </Badge>
                  )}
                  {selectedPartner.verification_status === 'pending' && (
                    <Badge tone="celadon" className="text-xs">
                      <Clock className="size-3 mr-1 inline" /> Pending Verification
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-black text-teal tracking-tight">
                  {selectedPartner.business_name}
                </h2>
                <p className="text-xs text-teal/70 mt-0.5">
                  Operated by <span className="font-semibold text-teal">{selectedPartner.owner_name}</span> · {selectedPartner.city}, {selectedPartner.district} ({selectedPartner.state_code})
                </p>
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

            {/* Modal Tabs */}
            <div className="flex border-b border-teal/10 px-5 bg-canvas">
              <button
                type="button"
                onClick={() => setActiveTab('docs')}
                className={cn(
                  'flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all',
                  activeTab === 'docs'
                    ? 'border-teal text-teal'
                    : 'border-transparent text-teal/60 hover:text-teal',
                )}
              >
                <FileCheck2 className="size-4" /> KYC Documents &amp; Licenses
                {partnerDetail?.documents && partnerDetail.documents.length > 0 && (
                  <span className="rounded-full bg-teal/10 px-2 py-0.2 text-[10px]">
                    {partnerDetail.documents.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('geo')}
                className={cn(
                  'flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all',
                  activeTab === 'geo'
                    ? 'border-teal text-teal'
                    : 'border-transparent text-teal/60 hover:text-teal',
                )}
              >
                <Compass className="size-4" /> Geo-Coordinates &amp; Map
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className={cn(
                  'flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all',
                  activeTab === 'services'
                    ? 'border-teal text-teal'
                    : 'border-transparent text-teal/60 hover:text-teal',
                )}
              >
                <DollarSign className="size-4" /> Service Rate Card
                {partnerDetail?.services && partnerDetail.services.length > 0 && (
                  <span className="rounded-full bg-teal/10 px-2 py-0.2 text-[10px]">
                    {partnerDetail.services.length}
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingDetail ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="size-8 animate-spin mx-auto text-teal" />
                  <p className="text-xs text-teal/70 font-semibold">Loading KYC profile &amp; database verification records...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: KYC DOCUMENTS */}
                  {activeTab === 'docs' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-extrabold text-teal">Verification Documents &amp; Business Proof</h4>
                          <p className="text-xs text-teal/70">Review submitted trade licenses, franchise certificates, shop photos, and applicant IDs.</p>
                        </div>
                      </div>

                      {(!partnerDetail?.documents || partnerDetail.documents.length === 0) ? (
                        <div className="rounded-2xl border border-dashed border-teal/20 p-8 text-center space-y-2 bg-cream/20">
                          <FileText className="size-8 text-teal/40 mx-auto" />
                          <h5 className="text-sm font-bold text-teal">No uploaded documents on file</h5>
                          <p className="text-xs text-teal/70 max-w-md mx-auto">
                            The operator registered this center without digital file attachments yet. You can still approve the center based on phone verification or physical visit.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {partnerDetail.documents.map((doc) => {
                            const isDocUpdating = docUpdatingId === doc.id;

                            return (
                              <div
                                key={doc.id}
                                className="rounded-2xl border border-teal/15 bg-canvas p-4 space-y-3 shadow-sm hover:border-teal/30 transition"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="rounded bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase text-teal">
                                      {doc.document_kind.replace(/_/g, ' ')}
                                    </span>
                                    <div className="font-mono text-[11px] text-teal/70 truncate max-w-[240px] mt-1">
                                      {doc.storage_path.split('/').pop()}
                                    </div>
                                  </div>

                                  <div>
                                    {doc.status === 'verified' && (
                                      <Badge tone="teal" className="text-[10px]">
                                        <Check className="size-3 mr-0.5 inline" /> Verified
                                      </Badge>
                                    )}
                                    {doc.status === 'pending' && (
                                      <Badge tone="celadon" className="text-[10px]">
                                        Pending Review
                                      </Badge>
                                    )}
                                    {doc.status === 'rejected' && (
                                      <Badge tone="outline" className="text-[10px] text-rose-700 border-rose-300">
                                        Rejected
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {doc.reviewer_note && (
                                  <div className="text-[11px] text-teal/80 bg-cream/50 p-2 rounded-lg border border-teal/10">
                                    <span className="font-semibold">Reviewer Note:</span> {doc.reviewer_note}
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-teal/10">
                                  <a
                                    href={doc.storage_path.startsWith('http') ? doc.storage_path : '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-teal hover:underline inline-flex items-center gap-1"
                                  >
                                    <ExternalLink className="size-3" /> View File
                                  </a>

                                  <div className="flex items-center gap-1.5">
                                    {isDocUpdating ? (
                                      <Loader2 className="size-4 animate-spin text-teal" />
                                    ) : (
                                      <>
                                        {doc.status !== 'verified' && (
                                          <button
                                            type="button"
                                            onClick={() => handleVerifyDoc(doc.id, 'verified')}
                                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                                          >
                                            Approve
                                          </button>
                                        )}
                                        {doc.status !== 'rejected' && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const note = prompt('Enter rejection reason for this document:');
                                              if (note !== null) handleVerifyDoc(doc.id, 'rejected', note);
                                            }}
                                            className="rounded-lg border border-rose-300 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 transition"
                                          >
                                            Reject
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: GEO COORDINATES & MAP */}
                  {activeTab === 'geo' && (
                    <div className="space-y-4">
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
                    <div className="space-y-4">
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

            {/* Modal Footer Decision Bar */}
            <div className="border-t border-teal/10 bg-cream/30 p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-teal cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isListedToggle}
                      onChange={(e) => setIsListedToggle(e.target.checked)}
                      className="rounded border-teal/30 text-teal focus:ring-teal"
                    />
                    <span>Publish &amp; List on Citizen Search Directory</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={reviewerNote}
                    onChange={(e) => setReviewerNote(e.target.value)}
                    placeholder="Staff review note (e.g. Valid trade license verified)..."
                    className="h-8 rounded-xl border border-teal/20 bg-canvas px-3 text-xs w-64 focus:border-teal focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-teal/10">
                <button
                  type="button"
                  onClick={handleCloseInspect}
                  className={buttonClass({ variant: 'ghost', size: 'sm', className: 'text-xs' })}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleVerify(selectedPartner.id, 'rejected', false, reviewerNote)
                  }
                  disabled={updatingId === selectedPartner.id}
                  className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                >
                  Reject Application
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleVerify(selectedPartner.id, 'pending', isListedToggle, reviewerNote)
                  }
                  disabled={updatingId === selectedPartner.id}
                  className="rounded-xl border border-teal/20 bg-canvas px-3.5 py-2 text-xs font-bold text-teal hover:bg-cream/40 transition disabled:opacity-50"
                >
                  Keep Under Review
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleVerify(selectedPartner.id, 'verified', isListedToggle, reviewerNote)
                  }
                  disabled={updatingId === selectedPartner.id}
                  className={buttonClass({
                    variant: 'primary',
                    size: 'sm',
                    className: 'gap-1.5 text-xs shadow-clay',
                  })}
                >
                  <CheckCircle2 className="size-4" /> Approve &amp; Certify Center
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
