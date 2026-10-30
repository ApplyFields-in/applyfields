'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Kanban,
  List,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Send,
  User,
  X,
} from 'lucide-react';
import { listPartnerEnquiries, respondToPartnerEnquiry } from '@/lib/api';
import type { InstitutionEnquiry, InstitutionEnquiryStatus } from '@applyfields/types';

const INITIAL_DEMO_ENQUIRIES: InstitutionEnquiry[] = [
  {
    id: 'enq-01',
    institution_id: 'inst-cbit',
    institution_name: 'Chaitanya Bharathi Institute of Technology',
    institution_slug: 'cbit-hyderabad',
    user_id: 'usr-01',
    course_id: 'prog-01',
    course_name: 'B.Tech in Artificial Intelligence & Data Science',
    name: 'Sai Kiran Reddy',
    phone: '+91 98490 11223',
    email: 'kiran.reddy@gmail.com',
    message: 'What was the TS EAMCET closing rank for AI & DS in the previous counselling round? Are management quota seats available?',
    status: 'new',
    response: null,
    responded_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'enq-02',
    institution_id: 'inst-cbit',
    institution_name: 'Chaitanya Bharathi Institute of Technology',
    institution_slug: 'cbit-hyderabad',
    user_id: 'usr-02',
    course_id: 'prog-02',
    course_name: 'B.Tech in Computer Science & Engineering',
    name: 'Ananya Sharma',
    phone: '+91 99887 66554',
    email: 'ananya.sharma@outlook.com',
    message: 'I have secured 96.8 percentile in JEE Main. Can I apply for Category B quota seats? Please share fee details.',
    status: 'new',
    response: null,
    responded_at: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'enq-03',
    institution_id: 'inst-cbit',
    institution_name: 'Chaitanya Bharathi Institute of Technology',
    institution_slug: 'cbit-hyderabad',
    user_id: 'usr-03',
    course_id: 'prog-03',
    course_name: 'Master of Business Administration (MBA)',
    name: 'P. Mohammed Imran',
    phone: '+91 91234 56789',
    email: 'imran.p@gmail.com',
    message: 'Do you offer fee waivers for merit students with TS ICET rank below 500?',
    status: 'responded',
    response: 'Spoke on phone on 24 Oct. Sent MBA brochure via WhatsApp. Student scheduled campus tour.',
    responded_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'enq-04',
    institution_id: 'inst-cbit',
    institution_name: 'Chaitanya Bharathi Institute of Technology',
    institution_slug: 'cbit-hyderabad',
    user_id: 'usr-04',
    course_id: 'prog-04',
    course_name: 'B.Tech in Electronics & Communication Engineering',
    name: 'R. Sneha Latha',
    phone: '+91 97000 88991',
    email: 'sneha.latha@gmail.com',
    message: 'Is hostel accommodation available inside the campus for first-year women engineering students?',
    status: 'closed',
    response: 'Hostel booking guide shared and confirmed application admission form submitted.',
    responded_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
];

export default function InstitutionInquiriesPage() {
  const [enquiries, setEnquiries] = useState<InstitutionEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Inquiry Modal
  const [selectedEnquiry, setSelectedEnquiry] = useState<InstitutionEnquiry | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [targetStatus, setTargetStatus] = useState<InstitutionEnquiryStatus>('responded');
  const [savingResponse, setSavingResponse] = useState(false);

  useEffect(() => {
    async function fetchEnquiries() {
      setLoading(true);
      try {
        const res = await listPartnerEnquiries(statusFilter === 'all' ? undefined : statusFilter);
        if (res.data?.items && res.data.items.length > 0) {
          setEnquiries(res.data.items);
        } else {
          setEnquiries(INITIAL_DEMO_ENQUIRIES);
        }
      } catch {
        setEnquiries(INITIAL_DEMO_ENQUIRIES);
      } finally {
        setLoading(false);
      }
    }
    fetchEnquiries();
  }, [statusFilter]);

  function handleOpenEnquiry(enq: InstitutionEnquiry) {
    setSelectedEnquiry(enq);
    setResponseNotes(enq.response || '');
    setTargetStatus(enq.status);
  }

  async function handleSaveResponse(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEnquiry) return;
    setSavingResponse(true);

    try {
      await respondToPartnerEnquiry(selectedEnquiry.id, {
        status: targetStatus,
        response: responseNotes.trim() || 'Response logged by admissions coordinator.',
      });

      // Update in local state
      setEnquiries((prev) =>
        prev.map((item) =>
          item.id === selectedEnquiry.id
            ? {
                ...item,
                status: targetStatus,
                response: responseNotes.trim() || item.response,
                responded_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );
      setSelectedEnquiry(null);
    } catch {
      // optimistic update for preview
      setEnquiries((prev) =>
        prev.map((item) =>
          item.id === selectedEnquiry.id
            ? { ...item, status: targetStatus, response: responseNotes }
            : item
        )
      );
      setSelectedEnquiry(null);
    } finally {
      setSavingResponse(false);
    }
  }

  const filteredEnquiries = enquiries.filter((item) => {
    const nameStr = item.name || '';
    const phoneStr = item.phone || '';
    const courseStr = item.course_name || '';
    const messageStr = item.message || '';

    const matchesSearch =
      nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phoneStr.includes(searchQuery) ||
      courseStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      messageStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const kanbanColumns: Array<{ id: InstitutionEnquiryStatus; label: string; tone: string }> = [
    { id: 'new', label: '1. New Enquiries', tone: 'border-amber-500/30 bg-amber-500/5' },
    { id: 'responded', label: '2. In Progress / Responded', tone: 'border-blue-500/30 bg-blue-500/5' },
    { id: 'closed', label: '3. Enrolled / Closed', tone: 'border-emerald-500/30 bg-emerald-500/5' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Admissions Enquiries Desk
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time pipeline of prospective students requesting fee details, counselling, and cutoff info.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, phone, course, or query keywords..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Inquiries' },
            { id: 'new', label: 'New' },
            { id: 'responded', label: 'Responded' },
            { id: 'closed', label: 'Closed' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`whitespace-nowrap px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                statusFilter === tab.id
                  ? 'border-blue-500/50 bg-blue-500/20 text-blue-300'
                  : 'border-slate-850 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          <span className="text-xs">Loading inquiries from ApplyFields database...</span>
        </div>
      )}

      {/* VIEW: KANBAN BOARD */}
      {!loading && viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanColumns.map((col) => {
            const colItems = filteredEnquiries.filter((item) => item.status === col.id);
            return (
              <div
                key={col.id}
                className={`rounded-2xl border ${col.tone} p-4 flex flex-col min-h-[460px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{col.label}</span>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-300">
                    {colItems.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {colItems.map((enq) => (
                    <div
                      key={enq.id}
                      onClick={() => handleOpenEnquiry(enq)}
                      className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition hover:border-blue-500/50 hover:bg-slate-850 shadow-md space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition">
                            {enq.name || 'Prospective Candidate'}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            {new Date(enq.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
                          {enq.course_name ? enq.course_name.split(' ')[0] : 'General'}
                        </span>
                      </div>

                      {enq.course_name && (
                        <div className="text-[11px] font-medium text-blue-300/90 truncate">
                          Program: {enq.course_name}
                        </div>
                      )}

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                        &quot;{enq.message}&quot;
                      </p>

                      {enq.response && (
                        <div className="text-[10px] text-emerald-400/90 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 line-clamp-2">
                          Admissions Officer: {enq.response}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                        <span className="font-mono text-slate-400 flex items-center gap-1">
                          <Phone className="h-3 w-3 text-emerald-400" />
                          {enq.phone || 'N/A'}
                        </span>
                        {enq.phone && (
                          <a
                            href={`https://wa.me/${enq.phone.replace(/[^0-9]/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 font-bold hover:underline"
                          >
                            WhatsApp →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {colItems.length === 0 && (
                    <div className="text-center py-12 text-[11px] text-slate-600">
                      No leads in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: TABLE */}
      {!loading && viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Phone / WhatsApp</th>
                  <th className="p-4">Course Enquired</th>
                  <th className="p-4">Inquiry Excerpt</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEnquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-slate-850/60 transition">
                    <td className="p-4">
                      <div className="font-bold text-white">{enq.name || 'Anonymous Student'}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(enq.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      <div>{enq.phone || 'N/A'}</div>
                      {enq.email && <div className="text-[11px] text-slate-500">{enq.email}</div>}
                    </td>
                    <td className="p-4 text-blue-400 font-medium">
                      {enq.course_name || 'General Admission Enquiry'}
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-300">{enq.message}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          enq.status === 'new'
                            ? 'bg-amber-500/20 text-amber-300'
                            : enq.status === 'responded'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {enq.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {enq.phone && (
                          <a
                            href={`https://wa.me/${enq.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
                          >
                            WhatsApp
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEnquiry(enq)}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-500 transition"
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INQUIRY DETAIL & RESPONSE DRAWER MODAL */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedEnquiry.name || 'Prospective Candidate'}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 uppercase">
                    {selectedEnquiry.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inquiry submitted on {new Date(selectedEnquiry.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Student Message */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Student Query &amp; Program:
              </div>
              <div className="text-xs font-semibold text-blue-300">
                {selectedEnquiry.course_name || 'General Admission Guidance'}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed italic">
                &quot;{selectedEnquiry.message}&quot;
              </p>
            </div>

            {/* Quick Contact Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {selectedEnquiry.phone && (
                <>
                  <a
                    href={`tel:${selectedEnquiry.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-750 transition"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-400" />
                    Call {selectedEnquiry.phone}
                  </a>
                  <a
                    href={`https://wa.me/${selectedEnquiry.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(
                      selectedEnquiry.name || 'Candidate'
                    )},%20this%20is%20from%20the%20Admissions%20Office%20regarding%20your%20inquiry%20on%20ApplyFields.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
                  >
                    Open Official WhatsApp Chat →
                  </a>
                </>
              )}
            </div>

            {/* Response Form */}
            <form onSubmit={handleSaveResponse} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Update Lead CRM Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as InstitutionEnquiryStatus)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="new">New (Uncontacted)</option>
                  <option value="responded">In Progress / Responded</option>
                  <option value="closed">Closed / Enrolled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Officer Response / Internal Notes
                </label>
                <textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  rows={3}
                  placeholder="Record counselling notes or official reply sent to student..."
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="rounded-xl border border-slate-800 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResponse}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition disabled:opacity-50"
                >
                  {savingResponse ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
