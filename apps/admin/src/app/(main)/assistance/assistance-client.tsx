'use client';

import React, { useState } from 'react';
import type { BookingDetail, BookingRequestStatus } from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  HandHelping,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle,
  FileText,
  User,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface AssistanceClientProps {
  initialItems: BookingDetail[];
  total: number;
  currentStatus?: string;
}

const STATUS_BADGE: Record<
  BookingRequestStatus,
  { label: string; tone: 'teal' | 'celadon' | 'tea' | 'outline' }
> = {
  new: { label: 'New Request', tone: 'celadon' },
  accepted: { label: 'Accepted', tone: 'teal' },
  in_progress: { label: 'In Progress', tone: 'teal' },
  completed: { label: 'Completed', tone: 'teal' },
  rejected: { label: 'Rejected', tone: 'outline' },
  cancelled: { label: 'Cancelled', tone: 'outline' },
};

export function AssistanceClient({ initialItems, total, currentStatus }: AssistanceClientProps) {
  const [items] = useState<BookingDetail[]>(initialItems);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal/10 text-teal">
            <HandHelping className="size-6" />
          </div>
          <h3 className="text-base font-bold text-teal">No assistance requests found</h3>
          <p className="text-xs text-teal/70 max-w-sm mx-auto">
            {currentStatus
              ? `No citizen requests currently in status "${currentStatus}".`
              : 'When citizens submit assistance bookings for exam or certificate filing, they will appear here in real time.'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-teal/10 bg-canvas/40 text-xs font-semibold uppercase tracking-wider text-teal/70">
                  <th className="px-4 py-3">Booking ID &amp; Service</th>
                  <th className="px-3 py-3">Partner Center</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Quoted Fee</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal/10">
                {items.map((b) => {
                  const badgeInfo = STATUS_BADGE[b.status] ?? { label: b.status, tone: 'outline' };

                  return (
                    <tr key={b.id} className="hover:bg-cream/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-teal leading-snug">
                          {b.service_name || 'General Application Assistance'}
                        </div>
                        <div className="font-mono text-[11px] text-teal/60">
                          #{b.id.slice(0, 8)}
                        </div>
                        {b.user_note && (
                          <div className="text-[11px] text-teal/70 italic line-clamp-1 mt-0.5">
                            &ldquo;{b.user_note}&rdquo;
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-xs text-teal/80">
                        <div className="font-semibold text-teal">{b.partner_business_name}</div>
                        {b.partner_phone && (
                          <div className="text-[11px] text-teal/60">{b.partner_phone}</div>
                        )}
                      </td>

                      <td className="px-3 py-3.5">
                        <Badge tone={badgeInfo.tone} className="text-[11px]">
                          {badgeInfo.label}
                        </Badge>
                      </td>

                      <td className="px-3 py-3.5 text-xs font-semibold text-teal">
                        {b.quoted_paise !== null && b.quoted_paise !== undefined
                          ? `₹${(b.quoted_paise / 100).toFixed(0)}`
                          : '—'}
                      </td>

                      <td className="px-3 py-3.5 text-xs text-teal/60">
                        {new Date(b.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className={buttonClass({ variant: 'secondary', size: 'sm' })}
                        >
                          View timeline
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Booking Timeline & Audit Drawer/Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-teal/20 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs text-teal/60">
                  Request #{selectedBooking.id.slice(0, 8)}
                </span>
                <h3 className="text-base font-bold text-teal">
                  {selectedBooking.service_name || 'Assistance Request'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="text-xs font-semibold text-teal/70 hover:text-teal"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl bg-canvas p-4 text-xs space-y-2 border border-teal/10">
              <div className="flex justify-between">
                <span className="text-teal/70">Partner Center:</span>
                <span className="font-bold text-teal">{selectedBooking.partner_business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal/70">Status:</span>
                <Badge tone={STATUS_BADGE[selectedBooking.status]?.tone ?? 'outline'}>
                  {STATUS_BADGE[selectedBooking.status]?.label ?? selectedBooking.status}
                </Badge>
              </div>
              {selectedBooking.quoted_paise && (
                <div className="flex justify-between">
                  <span className="text-teal/70">Quoted Service Fee:</span>
                  <span className="font-bold text-teal">
                    ₹{(selectedBooking.quoted_paise / 100).toFixed(0)}
                  </span>
                </div>
              )}
              {selectedBooking.user_note && (
                <div className="pt-1 text-teal/80 border-t border-teal/10">
                  <strong>Citizen Note:</strong> {selectedBooking.user_note}
                </div>
              )}
              {selectedBooking.partner_note && (
                <div className="text-teal/80">
                  <strong>Partner Note:</strong> {selectedBooking.partner_note}
                </div>
              )}
            </div>

            {/* Audit Events Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal/70">
                Audit Timeline Events
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedBooking.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-2.5 rounded-xl bg-canvas/60 p-2.5 text-xs border border-teal/5"
                  >
                    <Clock className="size-3.5 text-teal/60 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between text-[11px] text-teal/60">
                        <span className="font-semibold uppercase tracking-wider text-teal">
                          {ev.to_status}
                        </span>
                        <span>
                          {new Date(ev.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-teal/80">{ev.note || 'Event recorded'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
