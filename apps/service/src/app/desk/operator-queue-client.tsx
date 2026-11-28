'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Building,
  UserCheck,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileText,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Inbox,
  User,
} from 'lucide-react';
import {
  ServiceDeskRequest,
  ServiceRequestStatus,
  ServicePriority,
  fromBooking,
} from '@/lib/service-desk-data';
import { getPartnerInbox } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export const STATUS_CONFIG: Record<
  ServiceRequestStatus,
  { label: string; tone: string; dotColor: string }
> = {
  triage: {
    label: 'New',
    tone: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
  },
  in_review: {
    label: 'Checking documents',
    tone: 'bg-sky-50 text-sky-700 border-sky-200',
    dotColor: 'bg-sky-500',
  },
  ready_for_filing: {
    label: 'Ready to apply',
    tone: 'bg-amber-50 text-amber-800 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  otp_pending: {
    label: 'Waiting for OTP',
    tone: 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse',
    dotColor: 'bg-purple-500',
  },
  submitted: {
    label: 'Submitted, fee pending',
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  completed: {
    label: 'Done',
    tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  defective: {
    label: 'Sent back to fix',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
  },
};

export function OperatorQueueClient() {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();
  const [requests, setRequests] = useState<ServiceDeskRequest[]>([]);
  const [notPartner, setNotPartner] = useState(false);

  // The signed-in centre's real requests only. The API answers 403 for non-partners.
  useEffect(() => {
    if (!isLoggedIn) return;
    getPartnerInbox().then((res) => {
      if (res.error) setNotPartner(true);
      setRequests((res.data?.items ?? []).map(fromBooking));
    });
  }, [isLoggedIn]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Compute live remaining SLA time string
  const formatSlaCountdown = (deadlineIso: string) => {
    const diffMs = new Date(deadlineIso).getTime() - new Date().getTime();
    if (diffMs <= 0) return { text: 'Last date passed', isCritical: true };
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours < 4) return { text: `${hours}h ${minutes}m left (urgent)`, isCritical: true };
    if (hours < 24) return { text: `${hours}h ${minutes}m left`, isCritical: false, isAmber: true };
    const days = Math.floor(hours / 24);
    return { text: `${days}d ${hours % 24}h left`, isCritical: false, isAmber: false };
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Search matches
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = req.applicant.fullName.toLowerCase().includes(q);
        const matchesToken = req.token.toLowerCase().includes(q);
        const matchesMobile = req.applicant.mobile.includes(q);
        const matchesService = req.serviceTitle.toLowerCase().includes(q);
        const matchesPartner = req.partner.name.toLowerCase().includes(q);
        if (!matchesName && !matchesToken && !matchesMobile && !matchesService && !matchesPartner) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;

      // Priority
      if (priorityFilter !== 'all' && req.priority !== priorityFilter) return false;

      // Category
      if (categoryFilter !== 'all' && req.serviceCategory !== categoryFilter) return false;

      return true;
    });
  }, [requests, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  // Operational metrics
  const stats = useMemo(() => {
    return {
      total: requests.length,
      readyOrTriage: requests.filter((r) => r.status === 'ready_for_filing' || r.status === 'triage').length,
      otpPending: requests.filter((r) => r.status === 'otp_pending').length,
      defective: requests.filter((r) => r.status === 'defective').length,
      completed: requests.filter((r) => r.status === 'completed').length,
      critical: requests.filter((r) => r.priority === 'critical' && r.status !== 'completed').length,
    };
  }, [requests]);

  if (loading) return null;
  if (!isLoggedIn || notPartner) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center space-y-3">
        <ShieldCheck className="mx-auto size-10 text-[#0e7bf4]" />
        <h1 className="text-xl font-black text-[#082046]">Filing Desk is for partner centres</h1>
        <p className="text-sm text-slate-600">
          {isLoggedIn
            ? 'Your account is not linked to a partner centre. To book a service, go back to Services.'
            : 'Sign in with your partner centre account to see your jobs.'}
        </p>
        <div className="flex justify-center gap-2 pt-2">
          {!isLoggedIn && (
            <Link href="/login?next=/desk" className="rounded-xl bg-[#082046] px-4 py-2 text-xs font-bold text-white">
              Sign in
            </Link>
          )}
          <Link href="/" className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-[#082046]">
            Go to Services
          </Link>
        </div>
      </div>
    );
  }

  const handleClaimNext = () => {
    // Next job that is ready (or new), else the first one in the list
    const candidate = requests.find((r) => r.status === 'ready_for_filing' || r.status === 'triage');
    if (candidate) {
      router.push(`/desk/${candidate.id}`);
    } else if (requests.length > 0) {
      router.push(`/desk/${requests[0].id}`);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Services</span>
            <span>/</span>
            <span className="text-[#0e7bf4]">Filing Desk</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#082046] sm:text-3xl mt-1">
            Filing Desk
          </h1>
          <p className="text-sm font-medium text-slate-600 mt-0.5">
            Apply on government portals for citizens, collect their OTP, and upload the receipt.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClaimNext}
            disabled={requests.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#082046] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0c2f66] active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <UserCheck className="size-4 text-[#38bdf8]" />
            <span>Open next job</span>
          </button>
        </div>
      </div>

      {/* Real-Time Operational Cockpit Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">All jobs</p>
          <p className="mt-1 text-2xl font-black text-[#082046]">{stats.total}</p>
          <span className="text-[11px] text-slate-500">In your queue</span>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1">
            <AlertTriangle className="size-3.5" />
            Urgent
          </p>
          <p className="mt-1 text-2xl font-black text-rose-700">{stats.critical}</p>
          <span className="text-[11px] text-rose-600">Last date is today</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Ready to apply</p>
          <p className="mt-1 text-2xl font-black text-amber-800">{stats.readyOrTriage}</p>
          <span className="text-[11px] text-amber-700">New or documents checked</span>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wide flex items-center gap-1">
            <Clock className="size-3.5" />
            Waiting for OTP
          </p>
          <p className="mt-1 text-2xl font-black text-purple-700">{stats.otpPending}</p>
          <span className="text-[11px] text-purple-600">Citizen must share the OTP</span>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wide">Sent back</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{stats.defective}</p>
          <span className="text-[11px] text-slate-500">Documents need fixing</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Completed</p>
          <p className="mt-1 text-2xl font-black text-emerald-800">{stats.completed}</p>
          <span className="text-[11px] text-emerald-700">Receipt uploaded</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, token, mobile or service"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#0e7bf4] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#0e7bf4] focus:bg-white focus:outline-none"
            >
              <option value="all">All ({requests.length})</option>
              <option value="ready_for_filing">Ready to apply</option>
              <option value="otp_pending">Waiting for OTP</option>
              <option value="triage">New</option>
              <option value="in_review">Checking documents</option>
              <option value="defective">Sent back to fix</option>
              <option value="completed">Done</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#0e7bf4] focus:bg-white focus:outline-none"
            >
              <option value="all">All</option>
              <option value="critical">Urgent only</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#0e7bf4] focus:bg-white focus:outline-none"
            >
              <option value="all">All</option>
              <option value="Exam Application">Exam Application</option>
              <option value="Certificate">Certificate</option>
              <option value="Scheme Enrollment">Scheme Enrollment</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Show:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'ready_for_filing', label: 'Ready to apply' },
            { id: 'otp_pending', label: 'Waiting for OTP' },
            { id: 'critical', label: 'Urgent' },
            { id: 'defective', label: 'Sent back' },
            { id: 'completed', label: 'Completed' },
          ].map((item) => {
            const isActive =
              item.id === 'critical' ? priorityFilter === 'critical' : statusFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'critical') {
                    setPriorityFilter(priorityFilter === 'critical' ? 'all' : 'critical');
                  } else {
                    setStatusFilter(item.id);
                  }
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  isActive
                    ? 'bg-[#082046] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setCategoryFilter('all');
              }}
              className="ml-auto text-xs font-bold text-rose-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Request Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3.5">Token</th>
                <th className="px-4 py-3.5">Citizen</th>
                <th className="px-4 py-3.5">Service & portal</th>
                <th className="px-4 py-3.5">Centre</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Last date</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Inbox className="mx-auto size-9 text-slate-300" />
                    <p className="mt-2 text-sm font-bold text-slate-700">{requests.length === 0 ? 'No jobs yet' : 'No jobs match'}</p>
                    <p className="text-xs text-slate-500">
                      {requests.length === 0
                        ? 'New bookings for your centre will show up here.'
                        : 'Try a different search or clear the filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const statusMeta = STATUS_CONFIG[req.status];
                  const sla = formatSlaCountdown(req.portalDeadline);
                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/70 transition cursor-pointer"
                      onClick={() => router.push(`/desk/${req.id}`)}
                    >
                      {/* Token & Priority */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {req.priority === 'critical' ? (
                            <span className="flex size-2 rounded-full bg-rose-600 ring-4 ring-rose-100" />
                          ) : req.priority === 'high' ? (
                            <span className="flex size-2 rounded-full bg-amber-500" />
                          ) : (
                            <span className="flex size-2 rounded-full bg-slate-300" />
                          )}
                          <div>
                            <span className="font-mono text-xs font-bold text-[#082046]">{req.token}</span>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {new Date(req.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Candidate Particulars */}
                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-[#082046] leading-tight">{req.applicant.fullName}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 font-semibold text-slate-700">
                              {req.applicant.socialCategory}
                            </span>
                            <span>·</span>
                            <span>{req.applicant.gender}</span>
                            <span>·</span>
                            <span className="font-mono">{req.applicant.mobile}</span>
                          </div>
                        </div>
                      </td>

                      {/* Target Opportunity & Portal */}
                      <td className="px-4 py-4 max-w-xs">
                        <p className="font-bold text-slate-900 truncate" title={req.serviceTitle}>
                          {req.serviceTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate" title={req.targetPortalName}>
                          {req.targetPortalName}
                        </p>
                      </td>

                      {/* Originating Kiosk */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building className="size-3.5 text-slate-400 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800 text-[11px]">{req.partner.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {req.partner.type} · {req.partner.city}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Filing Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusMeta.tone}`}
                        >
                          <span className={`size-1.5 rounded-full ${statusMeta.dotColor}`} />
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* SLA Deadline */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock
                            className={`size-3.5 ${
                              sla.isCritical
                                ? 'text-rose-600'
                                : sla.isAmber
                                ? 'text-amber-600'
                                : 'text-slate-400'
                            }`}
                          />
                          <div>
                            <p
                              className={`text-xs font-bold ${
                                sla.isCritical
                                  ? 'text-rose-700 font-extrabold'
                                  : sla.isAmber
                                  ? 'text-amber-700'
                                  : 'text-slate-700'
                              }`}
                            >
                              {sla.text}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {new Date(req.portalDeadline).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              IST
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Workstation Action */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/desk/${req.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#082046] hover:bg-[#0e7bf4] hover:text-white transition shadow-sm"
                        >
                          <span>Open File</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

