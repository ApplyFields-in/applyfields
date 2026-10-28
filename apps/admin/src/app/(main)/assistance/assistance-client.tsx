'use client';

import React, { useState } from 'react';
import type { BookingDetail, BookingRequestEvent, BookingRequestStatus } from '@applyfields/types';
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
  X,
  LayoutGrid,
  List,
  AlertTriangle,
  ArrowRight,
  Timer,
  Building2,
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

const KANBAN_COLUMNS: {
  id: BookingRequestStatus;
  title: string;
  hint: string;
  accentClass: string;
}[] = [
  { id: 'new', title: 'New Requests', hint: 'Awaiting operator pickup', accentClass: 'border-t-amber-500' },
  { id: 'accepted', title: 'Assigned to Kiosk', hint: 'Partner center acknowledged', accentClass: 'border-t-sky-500' },
  { id: 'in_progress', title: 'In Processing', hint: 'Form filing underway', accentClass: 'border-t-teal' },
  { id: 'completed', title: 'Completed', hint: 'Submission receipt issued', accentClass: 'border-t-emerald-600' },
];

const NEXT_STATUS: Partial<
  Record<BookingRequestStatus, { next: BookingRequestStatus; actionLabel: string }>
> = {
  new: { next: 'accepted', actionLabel: 'Accept & Dispatch' },
  accepted: { next: 'in_progress', actionLabel: 'Start Processing' },
  in_progress: { next: 'completed', actionLabel: 'Mark Completed' },
};

function getSlaInfo(createdAt: string, status: BookingRequestStatus) {
  if (status === 'completed' || status === 'cancelled' || status === 'rejected') {
    return { label: 'Fulfilled', isOverdue: false, urgency: 'done' as const };
  }
  const createdMs = new Date(createdAt).getTime();
  const now = Date.now();
  const targetMs = createdMs + 24 * 60 * 60 * 1000;
  const diffMs = targetMs - now;

  if (diffMs <= 0) {
    const overdueMins = Math.floor(Math.abs(diffMs) / 60000);
    const overdueHours = Math.floor(overdueMins / 60);
    const label =
      overdueHours > 0
        ? `Overdue ${overdueHours}h ${overdueMins % 60}m`
        : `Overdue ${overdueMins}m`;
    return { label, isOverdue: true, urgency: 'overdue' as const };
  }

  const leftMins = Math.floor(diffMs / 60000);
  const leftHours = Math.floor(leftMins / 60);
  if (leftHours < 2) {
    return { label: `${leftMins}m left`, isOverdue: false, urgency: 'critical' as const };
  }
  if (leftHours < 6) {
    return { label: `${leftHours}h ${leftMins % 60}m left`, isOverdue: false, urgency: 'warning' as const };
  }
  return { label: `${leftHours}h left`, isOverdue: false, urgency: 'normal' as const };
}

export function AssistanceClient({ initialItems, total, currentStatus }: AssistanceClientProps) {
  const [items, setItems] = useState<BookingDetail[]>(initialItems);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);

  // Status Advancement Action
  const handleAdvanceStatus = (id: string, nextStatus: BookingRequestStatus) => {
    setItems((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const newEvent: BookingRequestEvent = {
          id: `ev-${Date.now()}`,
          request_id: id,
          from_status: b.status,
          to_status: nextStatus,
          actor_user_id: 'current-staff',
          note: `Staff advanced status to ${nextStatus}`,
          created_at: new Date().toISOString(),
        };
        return {
          ...b,
          status: nextStatus,
          events: [newEvent, ...b.events],
        };
      }),
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-canvas border border-teal/15 p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-teal/10 text-teal">
            <Timer className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal">
              Assistance Operations Console
            </h3>
            <p className="text-[11px] text-teal/70">
              Monitoring 24h SLA response turnaround across partner kiosks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-tea/40 p-1 rounded-xl border border-teal/10">
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition',
              viewMode === 'kanban'
                ? 'bg-canvas text-teal shadow-xs'
                : 'text-teal/60 hover:text-teal',
            )}
          >
            <LayoutGrid className="size-3.5" /> Kanban Dispatch Board
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition',
              viewMode === 'table'
                ? 'bg-canvas text-teal shadow-xs'
                : 'text-teal/60 hover:text-teal',
            )}
          >
            <List className="size-3.5" /> Table View
          </button>
        </div>
      </div>

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
      ) : viewMode === 'kanban' ? (
        /* KANBAN DISPATCH BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colItems = items.filter((b) => b.status === col.id);

            return (
              <div
                key={col.id}
                className={cn(
                  'rounded-2xl border border-teal/15 bg-cream/20 flex flex-col overflow-hidden shadow-xs border-t-4',
                  col.accentClass,
                )}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-teal/10 bg-canvas/70 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-teal">
                        {col.title}
                      </h4>
                      <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal">
                        {colItems.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-teal/60 mt-0.5">{col.hint}</p>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="p-3 space-y-3 min-h-[380px] max-h-[72vh] overflow-y-auto">
                  {colItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-teal/20 p-6 text-center text-[11px] text-teal/50">
                      No active requests
                    </div>
                  ) : (
                    colItems.map((b) => {
                      const sla = getSlaInfo(b.created_at, b.status);
                      const next = NEXT_STATUS[b.status];

                      return (
                        <div
                          key={b.id}
                          className="rounded-xl border border-teal/15 bg-canvas p-3.5 space-y-2.5 shadow-xs hover:border-teal/35 hover:shadow-md transition-all group"
                        >
                          {/* Card Header: ID & SLA Timer */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[10px] font-bold text-teal/70">
                              #{b.id.slice(0, 8)}
                            </span>

                            {/* SLA Timer Chip */}
                            {sla.urgency === 'overdue' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                                <AlertTriangle className="size-2.5 shrink-0" />
                                {sla.label}
                              </span>
                            )}
                            {sla.urgency === 'critical' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                                <Clock className="size-2.5 shrink-0" />
                                {sla.label}
                              </span>
                            )}
                            {sla.urgency === 'warning' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                <Clock className="size-2.5 shrink-0" />
                                {sla.label}
                              </span>
                            )}
                            {sla.urgency === 'normal' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-teal/5 border border-teal/15 px-2 py-0.5 text-[10px] text-teal/70">
                                <Clock className="size-2.5 shrink-0" />
                                {sla.label}
                              </span>
                            )}
                            {sla.urgency === 'done' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                <CheckCircle2 className="size-2.5 shrink-0" />
                                Fulfilled
                              </span>
                            )}
                          </div>

                          {/* Service Name */}
                          <div>
                            <h5 className="font-bold text-xs text-teal leading-snug line-clamp-2">
                              {b.service_name || 'General Application Assistance'}
                            </h5>
                          </div>

                          {/* Assigned Center */}
                          <div className="flex items-center gap-1.5 text-[11px] text-teal/80">
                            <Store className="size-3 text-teal/60 shrink-0" />
                            <span className="truncate font-semibold">{b.partner_business_name}</span>
                          </div>

                          {/* User Note */}
                          {b.user_note && (
                            <div className="text-[10px] text-teal/70 italic bg-cream/40 rounded-lg p-1.5 border border-teal/10 line-clamp-2">
                              &ldquo;{b.user_note}&rdquo;
                            </div>
                          )}

                          {/* Card Footer: Fee & Quick Dispatch Actions */}
                          <div className="pt-2 border-t border-teal/10 flex items-center justify-between text-xs">
                            <div className="font-extrabold text-teal">
                              {b.quoted_paise ? `₹${(b.quoted_paise / 100).toFixed(0)}` : '—'}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedBooking(b)}
                                className="rounded px-1.5 py-1 text-[11px] font-semibold text-teal/70 hover:text-teal hover:bg-cream/60 transition"
                              >
                                Timeline
                              </button>

                              {next && (
                                <button
                                  type="button"
                                  onClick={() => handleAdvanceStatus(b.id, next.next)}
                                  className="rounded-lg bg-teal px-2 py-1 text-[10px] font-bold text-cream hover:bg-teal/90 transition shadow-xs flex items-center gap-0.5"
                                  title={`Advance to ${next.next}`}
                                >
                                  {next.actionLabel}
                                  <ArrowRight className="size-2.5 inline" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-teal/10 bg-canvas/40 text-xs font-semibold uppercase tracking-wider text-teal/70">
                  <th className="px-4 py-3">Booking ID &amp; Service</th>
                  <th className="px-3 py-3">Partner Center</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">SLA Status</th>
                  <th className="px-3 py-3">Quoted Fee</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal/10">
                {items.map((b) => {
                  const badgeInfo = STATUS_BADGE[b.status] ?? { label: b.status, tone: 'outline' };
                  const sla = getSlaInfo(b.created_at, b.status);
                  const next = NEXT_STATUS[b.status];

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

                      {/* SLA Chip Column */}
                      <td className="px-3 py-3.5 text-xs">
                        {sla.urgency === 'overdue' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                            <AlertTriangle className="size-2.5 shrink-0" />
                            {sla.label}
                          </span>
                        )}
                        {sla.urgency === 'critical' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                            <Clock className="size-2.5 shrink-0" />
                            {sla.label}
                          </span>
                        )}
                        {sla.urgency === 'warning' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            <Clock className="size-2.5 shrink-0" />
                            {sla.label}
                          </span>
                        )}
                        {sla.urgency === 'normal' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal/5 border border-teal/15 px-2 py-0.5 text-[10px] text-teal/70">
                            <Clock className="size-2.5 shrink-0" />
                            {sla.label}
                          </span>
                        )}
                        {sla.urgency === 'done' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 className="size-2.5 shrink-0" />
                            Fulfilled
                          </span>
                        )}
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
                        <div className="flex items-center justify-end gap-1.5">
                          {next && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceStatus(b.id, next.next)}
                              className="rounded-lg bg-teal/10 px-2.5 py-1 text-[11px] font-bold text-teal hover:bg-teal hover:text-cream transition"
                            >
                              {next.actionLabel}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className={buttonClass({ variant: 'secondary', size: 'sm', className: 'text-xs' })}
                          >
                            Timeline
                          </button>
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
                className="p-1 rounded-lg text-teal/70 hover:text-teal hover:bg-canvas transition-colors"
                aria-label="Close details"
              >
                <X className="size-4" />
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
