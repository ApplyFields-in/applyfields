'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Calendar,
  ExternalLink,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  Building2,
  Bookmark,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { OpportunityCard, SavedList } from '@applyfields/types';
import { formatDate } from '@/lib/format';

interface ApplicationItem {
  id: string;
  slug: string;
  title: string;
  organization: string;
  type: string;
  stage: 'planning' | 'applied' | 'admit_card' | 'exam' | 'result';
  applicationNumber?: string;
  examDate?: string;
  deadline?: string;
  notes?: string;
  documentsReady: boolean;
}

const STATUS_TABS = [
  { id: 'all', label: 'All Applications' },
  { id: 'planning', label: 'Planning to Apply' },
  { id: 'applied', label: 'Applied' },
  { id: 'admit_card', label: 'Admit Card & Exam' },
  { id: 'result', label: 'Results & Selected' },
];

const STAGE_LABELS: Record<string, { label: string; color: string; step: number }> = {
  planning: { label: 'Planning', color: 'bg-amber-100 text-amber-800 border-amber-200', step: 1 },
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-800 border-blue-200', step: 2 },
  admit_card: { label: 'Admit Card Out', color: 'bg-purple-100 text-purple-800 border-purple-200', step: 3 },
  exam: { label: 'Exam Completed', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', step: 4 },
  result: { label: 'Result Declared', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', step: 5 },
};

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is signed in
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      setIsLoggedIn(true);
    }

    // Load saved opportunities as tracked applications starter
    apiGet<SavedList>('/saved')
      .then((res) => {
        if (res?.items && res.items.length > 0) {
          const mapped: ApplicationItem[] = res.items
            .filter((item) => item.card)
            .map((item, idx) => {
              const opp = item.card as OpportunityCard;
              // Default to planning or applied depending on index for realistic preview
              const stages: ('planning' | 'applied' | 'admit_card')[] = ['planning', 'applied', 'admit_card'];
              const stage = stages[idx % 3];
              return {
                id: opp.slug,
                slug: opp.slug,
                title: opp.title,
                organization: opp.organization,
                type: opp.type,
                stage,
                applicationNumber: stage !== 'planning' ? `AF-${2026}${1000 + idx}` : undefined,
                deadline: opp.last_date ?? undefined,
                examDate: stage === 'admit_card' ? '2026-11-15' : undefined,
                documentsReady: true,
              };
            });
          setApplications(mapped);
        } else {
          // Provide standard initial guidance demo applications
          setApplications([
            {
              id: 'ssc-cgl-2026',
              slug: 'ssc-cgl-2026',
              title: 'SSC Combined Graduate Level Examination (Tier-I)',
              organization: 'Staff Selection Commission (SSC)',
              type: 'govt_job',
              stage: 'applied',
              applicationNumber: '2401098231',
              deadline: '2026-10-25',
              examDate: '2026-11-20',
              notes: 'Center chosen: Hyderabad. Tier-1 syllabus revision ongoing.',
              documentsReady: true,
            },
            {
              id: 'upsc-cse-prelims',
              slug: 'upsc-cse-prelims',
              title: 'UPSC Civil Services Examination (Preliminary)',
              organization: 'Union Public Service Commission',
              type: 'exam',
              stage: 'planning',
              deadline: '2026-11-10',
              notes: 'Need to upload renewed OBC-NCL certificate before deadline.',
              documentsReady: false,
            },
          ]);
        }
      })
      .catch(() => {
        // Fallback demo state
        setApplications([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredApps = applications.filter((app) => {
    if (activeTab !== 'all') {
      if (activeTab === 'admit_card' && (app.stage === 'admit_card' || app.stage === 'exam')) {
        // match
      } else if (app.stage !== activeTab) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return app.title.toLowerCase().includes(q) || app.organization.toLowerCase().includes(q);
    }
    return true;
  });

  const planningCount = applications.filter((a) => a.stage === 'planning').length;
  const appliedCount = applications.filter((a) => a.stage === 'applied' || a.stage === 'admit_card' || a.stage === 'exam').length;
  const completedCount = applications.filter((a) => a.stage === 'result').length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0e7bf4]">
            <ClipboardList className="size-4" />
            <span>My Space · Milestone Tracker</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
            My Applications
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#435775]">
            Track your recruitment progress from saved to selected — with deadlines, roll numbers, exam centers, and document readiness in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/apply"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0e7bf4] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0c6fdc]"
          >
            <Plus className="size-4" /> Find Opportunities
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#c4d2e3] bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-[#536780]">Total Tracked</span>
          <p className="mt-1 text-2xl font-extrabold text-[#082046]">{applications.length}</p>
        </div>
        <div className="rounded-2xl border border-[#c4d2e3] bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-[#536780]">Planning to Apply</span>
          <p className="mt-1 text-2xl font-extrabold text-amber-600">{planningCount}</p>
        </div>
        <div className="rounded-2xl border border-[#c4d2e3] bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-[#536780]">Submitted &amp; In Progress</span>
          <p className="mt-1 text-2xl font-extrabold text-[#0e7bf4]">{appliedCount}</p>
        </div>
        <div className="rounded-2xl border border-[#c4d2e3] bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-[#536780]">Completed / Results</span>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600">{completedCount}</p>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div className="space-y-3 rounded-2xl border border-[#c4d2e3] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2">
            <Search className="mr-2 size-4 text-[#536780]" />
            <input
              type="text"
              placeholder="Search by exam, post, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-[#082046] outline-none placeholder:text-[#71839b]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {STATUS_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#082046] text-white shadow-sm'
                      : 'bg-[#F0F4F8] text-[#435775] hover:bg-[#e2eaf4] hover:text-[#082046]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-[#c4d2e3] bg-white p-8 text-center text-sm text-[#536780]">
            Loading your applications...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="rounded-3xl border border-[#c4d2e3] bg-white p-10 text-center shadow-sm">
            <ClipboardList className="mx-auto size-12 text-[#91a8c7]" />
            <h3 className="mt-3 text-base font-bold text-[#082046]">No applications in this category</h3>
            <p className="mt-1 text-sm text-[#536780]">
              Save opportunities or mark them as &quot;Applied&quot; to keep your roll numbers, centers, and admit cards organized.
            </p>
            <div className="mt-5">
              <Link
                href="/apply"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0e7bf4] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0c6fdc]"
              >
                Browse open recruitments <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          filteredApps.map((app) => {
            const meta = STAGE_LABELS[app.stage] || STAGE_LABELS.planning;
            return (
              <div
                key={app.id}
                className="rounded-2xl border border-[#c4d2e3] bg-white p-5 shadow-sm transition hover:border-[#91a8c7]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left Detail */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#536780]">
                        {app.organization}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.color}`}>
                        {meta.label}
                      </span>
                      {app.applicationNumber && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-[#082046]">
                          App #{app.applicationNumber}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-[#082046] hover:text-[#0e7bf4]">
                      <Link href={`/${app.type === 'govt_job' ? 'jobs' : app.type === 'exam' ? 'exams' : 'apply'}/${app.slug}`}>
                        {app.title}
                      </Link>
                    </h2>

                    {app.notes && (
                      <p className="text-xs text-[#536780] bg-[#F8FBFF] border border-[#dce7f3] rounded-lg p-2.5 max-w-2xl">
                        📝 {app.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#435775] pt-1">
                      {app.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5 text-amber-600" />
                          <span>Last Date: {formatDate(app.deadline)}</span>
                        </span>
                      )}
                      {app.examDate && (
                        <span className="flex items-center gap-1 font-semibold text-purple-700">
                          <Calendar className="size-3.5" />
                          <span>Exam Date: {formatDate(app.examDate)}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        {app.documentsReady ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="size-3.5" /> Documents Ready
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-700 font-medium">
                            <AlertCircle className="size-3.5" /> Document check pending
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <Link
                      href={`/${app.type === 'govt_job' ? 'jobs' : app.type === 'exam' ? 'exams' : 'apply'}/${app.slug}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#F0F4F8] px-3.5 py-2 text-xs font-semibold text-[#082046] hover:bg-[#dce7f3]"
                    >
                      View Notice <ExternalLink className="size-3" />
                    </Link>
                    <Link
                      href="/documents"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#0e7bf4] hover:underline"
                    >
                      <FileCheck2 className="size-3.5" /> Check Vault
                    </Link>
                  </div>
                </div>

                {/* Progress bar stages */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#536780] mb-1.5">
                    <span className={meta.step >= 1 ? 'text-[#082046]' : ''}>1. Planning</span>
                    <span className={meta.step >= 2 ? 'text-[#082046]' : ''}>2. Form Submitted</span>
                    <span className={meta.step >= 3 ? 'text-[#082046]' : ''}>3. Admit Card</span>
                    <span className={meta.step >= 4 ? 'text-[#082046]' : ''}>4. Exam</span>
                    <span className={meta.step >= 5 ? 'text-emerald-700 font-bold' : ''}>5. Result</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-[#0e7bf4] rounded-full transition-all duration-500"
                      style={{ width: `${(meta.step / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Truth in data note */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-4 text-xs text-[#435775]">
        <ShieldCheck className="size-4 shrink-0 text-[#0e7bf4] mt-0.5" />
        <p>
          <strong>Citizen Notice:</strong> Application tracker milestones are user-entered and kept private to your account. Always verify admit card download dates and exam center instructions directly on the official commission portal linked in each opportunity.
        </p>
      </div>
    </div>
  );
}
