'use client';

import React, { useState } from 'react';
import type { AdminReportDetail, ResolveReportInput } from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Flag,
  Lock,
  MessageSquare,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { apiPatch } from '@/lib/api';

interface ReportsClientProps {
  initialItems: AdminReportDetail[];
  total: number;
  currentStatus?: string;
}

export function ReportsClient({
  initialItems,
  total,
  currentStatus,
}: ReportsClientProps) {
  const [items, setItems] = useState<AdminReportDetail[]>(initialItems);
  const [selectedReport, setSelectedReport] = useState<AdminReportDetail | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'dismiss' | 'hide' | 'lock'>('dismiss');
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'rejected'>('resolved');
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; success: boolean } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.reason.toLowerCase().includes(term) ||
      item.item_type.toLowerCase().includes(term) ||
      (item.details && item.details.toLowerCase().includes(term)) ||
      (item.reporter_email && item.reporter_email.toLowerCase().includes(term))
    );
  });

  const handleOpenActionModal = (report: AdminReportDetail, defaultAction: 'dismiss' | 'hide' | 'lock' = 'dismiss') => {
    setSelectedReport(report);
    setResolutionAction(defaultAction);
    setResolutionStatus('resolved');
    setResolutionNote(
      defaultAction === 'hide'
        ? 'Report verified. Content hidden by moderator.'
        : defaultAction === 'lock'
          ? 'Discussion locked due to policy guidelines.'
          : 'Report reviewed and resolved.',
    );
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setSubmitting(true);
    setFeedback(null);

    const payload: ResolveReportInput = {
      status: resolutionStatus,
      resolution_note: resolutionNote.trim() || 'Reviewed by moderator.',
      action: resolutionAction,
    };

    const res = await apiPatch<AdminReportDetail, ResolveReportInput>(
      `/admin/community/reports/${selectedReport.id}`,
      payload,
    );

    setSubmitting(false);

    if (res.ok && res.data) {
      const updated = res.data;
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setFeedback({
        text: `Report #${selectedReport.id.slice(0, 8)} marked as ${resolutionStatus} (${resolutionAction}).`,
        success: true,
      });
      setSelectedReport(null);
    } else {
      setFeedback({
        text: res.error || 'Failed to update report status.',
        success: false,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and local filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/70" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reports by reason, details, type or user..."
            className="h-9 w-full rounded-full border border-teal/15 bg-canvas pl-9 pr-3 text-xs focus:border-teal focus:outline-none"
          />
        </div>

        <div className="text-xs text-teal/70">
          Showing <span className="font-bold text-teal">{filteredItems.length}</span> of {total} reports
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'flex items-center justify-between rounded-xl px-4 py-3 text-xs',
            feedback.success
              ? 'border border-teal/20 bg-teal/10 text-teal'
              : 'border border-rose-200 bg-rose-50 text-rose-800',
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.success ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertTriangle className="size-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-teal/70 hover:text-teal"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Reports Table / Card Container */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <ShieldCheck className="mx-auto size-12 text-teal/30" />
          <h3 className="mt-3 text-sm font-bold text-teal">No reports found</h3>
          <p className="mt-1 text-xs text-teal/70">
            {searchTerm
              ? 'No reports match your search query.'
              : currentStatus
                ? `No reports currently with status "${currentStatus}".`
                : 'The moderation queue is completely clean!'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((report) => {
            const isPending = report.status === 'pending';
            const isResolved = report.status === 'resolved';

            return (
              <Card
                key={report.id}
                className={cn(
                  'p-4 transition-all border',
                  isPending ? 'border-amber-200/80 bg-amber-50/20' : 'border-line/60 bg-white',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          isPending ? 'tea' : isResolved ? 'teal' : 'outline'
                        }
                        className="text-[11px] font-semibold"
                      >
                        {report.status.toUpperCase()}
                      </Badge>

                      <Badge tone="outline" className="text-[11px] uppercase tracking-wider font-mono">
                        {report.item_type}
                      </Badge>

                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                        {report.reason.replace('_', ' ')}
                      </span>

                      <span className="text-[11px] text-teal/60">
                        ID: <span className="font-mono text-teal/80">{report.id.slice(0, 8)}</span>
                      </span>
                    </div>

                    {report.details ? (
                      <p className="text-xs text-[#082046] font-medium leading-relaxed bg-[#F0F4F8]/70 p-2.5 rounded-xl border border-line/60">
                        "{report.details}"
                      </p>
                    ) : (
                      <p className="text-xs text-teal/60 italic">No additional details provided.</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-teal/70 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        Reported on {new Date(report.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {report.reporter_email && (
                        <span className="flex items-center gap-1 font-mono text-teal/80">
                          <User className="size-3" />
                          {report.reporter_email}
                        </span>
                      )}

                      <span className="font-mono text-teal/60">
                        Target ID: {report.item_id}
                      </span>
                    </div>

                    {report.resolution_note && (
                      <div className="mt-2 rounded-xl bg-teal/5 p-2 text-[11px] text-teal border border-teal/15">
                        <span className="font-bold">Moderator note: </span>
                        {report.resolution_note}
                        {report.resolved_at && (
                          <span className="text-teal/60 ml-2">
                            ({new Date(report.resolved_at).toLocaleDateString('en-IN')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {report.item_type === 'opportunity' && (
                      <Link
                        href={`/opportunities/${report.item_id}`}
                        className={buttonClass({
                          variant: 'ghost',
                          size: 'sm',
                          className: 'gap-1.5 text-xs text-teal bg-teal/10 border border-teal/20 hover:bg-teal/20',
                        })}
                        title="Open opportunity in editor to review and fix"
                      >
                        <ExternalLink className="size-3.5" />
                        Fix in Editor
                      </Link>
                    )}
                    {report.item_type === 'service' && (
                      <Link
                        href={`/services/${report.item_id}`}
                        className={buttonClass({
                          variant: 'ghost',
                          size: 'sm',
                          className: 'gap-1.5 text-xs text-teal bg-teal/10 border border-teal/20 hover:bg-teal/20',
                        })}
                        title="Open service in editor to review and fix"
                      >
                        <ExternalLink className="size-3.5" />
                        Fix in Editor
                      </Link>
                    )}
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenActionModal(report, 'hide')}
                          className={buttonClass({
                            variant: 'ghost',
                            size: 'sm',
                            className: 'gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100',
                          })}
                          title="Resolve report and hide the offending content"
                        >
                          <EyeOff className="size-3.5" />
                          Hide &amp; Resolve
                        </button>

                        {report.item_type === 'thread' && (
                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(report, 'lock')}
                            className={buttonClass({
                              variant: 'ghost',
                              size: 'sm',
                              className: 'gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100',
                            })}
                            title="Lock thread to stop replies"
                          >
                            <Lock className="size-3.5" />
                            Lock Thread
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenActionModal(report, 'dismiss')}
                          className={buttonClass({
                            variant: 'primary',
                            size: 'sm',
                            className: 'gap-1.5 text-xs shadow-clay',
                          })}
                        >
                          <CheckCircle2 className="size-3.5" />
                          Resolve
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal(report, 'dismiss')}
                        className={buttonClass({
                          variant: 'ghost',
                          size: 'sm',
                          className: 'gap-1 text-xs text-teal/70 hover:text-teal',
                        })}
                      >
                        Edit Resolution
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Moderator Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[#c4d2e3] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Flag className="size-4 text-rose-600" />
                <h3 className="text-sm font-bold text-[#082046]">
                  Moderate Report #{selectedReport.id.slice(0, 8)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-full p-1 text-[#536780] hover:bg-[#F0F4F8]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="text-xs space-y-2 bg-[#F0F4F8] p-3 rounded-2xl border border-line/60">
              <div className="flex justify-between">
                <span className="text-[#536780]">Type:</span>
                <span className="font-bold text-[#082046] uppercase font-mono">{selectedReport.item_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#536780]">Reason:</span>
                <span className="font-bold text-rose-700">{selectedReport.reason}</span>
              </div>
              {selectedReport.details && (
                <div>
                  <span className="text-[#536780] block mb-0.5">Report details:</span>
                  <p className="font-medium text-[#082046] italic">"{selectedReport.details}"</p>
                </div>
              )}
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#082046] mb-1.5">
                  Resolution Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResolutionStatus('resolved')}
                    className={cn(
                      'rounded-xl border py-2 text-xs font-bold transition-all',
                      resolutionStatus === 'resolved'
                        ? 'border-teal bg-teal text-white shadow-sm'
                        : 'border-line text-teal/70 hover:bg-canvas',
                    )}
                  >
                    Resolved (Valid)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionStatus('rejected')}
                    className={cn(
                      'rounded-xl border py-2 text-xs font-bold transition-all',
                      resolutionStatus === 'rejected'
                        ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                        : 'border-line text-rose-700 hover:bg-canvas',
                    )}
                  >
                    Rejected (Invalid / False)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082046] mb-1.5">
                  Content Moderation Action
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResolutionAction('dismiss')}
                    className={cn(
                      'rounded-xl border py-2 text-xs font-semibold transition-all',
                      resolutionAction === 'dismiss'
                        ? 'border-[#0e7bf4] bg-[#0e7bf4] text-white shadow-sm'
                        : 'border-line text-[#536780] hover:bg-canvas',
                    )}
                  >
                    No Action
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionAction('hide')}
                    className={cn(
                      'rounded-xl border py-2 text-xs font-semibold transition-all',
                      resolutionAction === 'hide'
                        ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                        : 'border-line text-rose-700 hover:bg-canvas',
                    )}
                  >
                    Hide Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionAction('lock')}
                    className={cn(
                      'rounded-xl border py-2 text-xs font-semibold transition-all',
                      resolutionAction === 'lock'
                        ? 'border-amber-600 bg-amber-600 text-white shadow-sm'
                        : 'border-line text-amber-800 hover:bg-canvas',
                    )}
                  >
                    Lock Thread
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082046] mb-1">
                  Resolution Note (Internal)
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Explain resolution rationale or corrective steps taken..."
                  className="w-full rounded-2xl border border-line bg-canvas p-3 text-xs text-[#082046] focus:border-teal focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className={buttonClass({ variant: 'ghost', size: 'sm' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={buttonClass({
                    variant: 'primary',
                    size: 'sm',
                    className: 'gap-1.5 shadow-clay',
                  })}
                >
                  {submitting ? 'Applying...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
