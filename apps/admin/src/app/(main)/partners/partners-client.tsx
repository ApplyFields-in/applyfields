'use client';

import React, { useState } from 'react';
import type { AdminPartnerItem, AdminPartnerVerifyInput, PartnerVerificationStatus } from '@applyfields/types';
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
} from 'lucide-react';
import { apiPatch } from '@/lib/api';

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
  const [feedback, setFeedback] = useState<{ id: string; text: string; success: boolean } | null>(null);

  const handleVerify = async (
    partnerId: string,
    verification_status: PartnerVerificationStatus,
    is_listed: boolean,
  ) => {
    setUpdatingId(partnerId);
    setFeedback(null);

    const payload: AdminPartnerVerifyInput = {
      verification_status,
      is_listed,
      reviewer_note: `Updated to ${verification_status} by staff reviewer.`,
    };

    const res = await apiPatch<any, AdminPartnerVerifyInput>(
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
      setFeedback({
        id: partnerId,
        text: `Partner updated: ${verification_status} (Listed: ${is_listed ? 'Yes' : 'No'})`,
        success: true,
      });
    } else {
      setFeedback({
        id: partnerId,
        text: res.error || 'Failed to update partner verification.',
        success: false,
      });
    }
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          className={cn(
            'rounded-xl p-3 text-xs flex items-center justify-between border',
            feedback.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200',
          )}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold underline ml-2"
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
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-teal/10 bg-canvas/40 text-xs font-semibold uppercase tracking-wider text-teal/70">
                  <th className="px-4 py-3">Center Name &amp; Category</th>
                  <th className="px-3 py-3">Owner &amp; Contact</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Directory</th>
                  <th className="px-4 py-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal/10">
                {items.map((partner) => {
                  const isUpdating = updatingId === partner.id;

                  return (
                    <tr key={partner.id} className="hover:bg-cream/40 transition-colors">
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

                      <td className="px-3 py-3.5 text-xs text-teal/80">
                        <div className="font-semibold text-teal">{partner.owner_name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-teal/60">
                          <Phone className="size-3" />
                          <a href={`tel:${partner.phone}`} className="hover:underline">
                            {partner.phone}
                          </a>
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-xs text-teal/70">
                        <div>
                          {partner.city || partner.district}, {partner.state_code}
                        </div>
                        <div className="font-mono text-[11px] text-teal/50">
                          PIN: {partner.pincode}
                        </div>
                      </td>

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

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {isUpdating ? (
                            <span className="flex items-center gap-1 text-xs text-teal/60">
                              <Loader2 className="size-3.5 animate-spin" /> Saving...
                            </span>
                          ) : (
                            <>
                              {partner.verification_status !== 'verified' ? (
                                <button
                                  type="button"
                                  onClick={() => handleVerify(partner.id, 'verified', true)}
                                  className={buttonClass({ variant: 'primary', size: 'sm' })}
                                  title="Approve verification and list on public directory"
                                >
                                  <CheckCircle2 className="size-3.5" /> Approve &amp; List
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleVerify(
                                      partner.id,
                                      'verified',
                                      !partner.is_listed,
                                    )
                                  }
                                  className={buttonClass({ variant: 'secondary', size: 'sm' })}
                                  title={partner.is_listed ? 'Hide from directory' : 'Show on directory'}
                                >
                                  {partner.is_listed ? 'Unlist' : 'List'}
                                </button>
                              )}

                              {partner.verification_status !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => handleVerify(partner.id, 'rejected', false)}
                                  className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                  title="Reject application"
                                >
                                  Reject
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
    </div>
  );
}
