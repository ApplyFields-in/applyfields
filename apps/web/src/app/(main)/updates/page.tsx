'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Search,
  Calendar,
  ExternalLink,
  Building2,
  FileText,
  ShieldCheck,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { UpdateItem, UpdateList } from '@applyfields/types';
import { formatDate, UPDATE_LABEL } from '@/lib/format';

const UPDATE_TABS = [
  { id: 'all', label: 'All Updates' },
  { id: 'admit_card', label: 'Admit Cards' },
  { id: 'result', label: 'Results' },
  { id: 'answer_key', label: 'Answer Keys' },
  { id: 'date_change', label: 'Date Changes' },
];

export default function UpdatesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<UpdateList>('/updates')
      .then((res) => {
        setUpdates(res?.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredUpdates = updates.filter((u) => {
    if (activeTab !== 'all' && u.kind !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.title.toLowerCase().includes(q) ||
        u.organization.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0e7bf4]">
          <Megaphone className="size-4" />
          <span>Apply Mode · Official Announcements</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
          Results &amp; Updates
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#435775]">
          Real-time admit card release notices, answer keys, merit lists, and schedule revisions verified directly from official government commission portals.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 rounded-2xl border border-[#c4d2e3] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2">
            <Search className="mr-2 size-4 text-[#536780]" />
            <input
              type="text"
              placeholder="Search updates by commission, exam name, or post..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-[#082046] outline-none placeholder:text-[#71839b]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {UPDATE_TABS.map((tab) => {
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

      {/* Updates List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-[#c4d2e3] bg-white p-8 text-center text-sm text-[#536780]">
            Fetching latest verified updates...
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="rounded-3xl border border-[#c4d2e3] bg-white p-10 text-center shadow-sm">
            <Megaphone className="mx-auto size-12 text-[#91a8c7]" />
            <h3 className="mt-3 text-base font-bold text-[#082046]">No updates match your filter</h3>
            <p className="mt-1 text-sm text-[#536780]">
              New admit cards, results, and answer keys are monitored and published as soon as official boards issue them.
            </p>
          </div>
        ) : (
          filteredUpdates.map((u) => {
            const kindLabel = UPDATE_LABEL[u.kind] ?? u.kind;
            const badgeColor =
              u.kind === 'result'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : u.kind === 'admit_card'
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : u.kind === 'answer_key'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200';

            return (
              <div
                key={u.id}
                className="rounded-2xl border border-[#c4d2e3] bg-white p-5 shadow-sm transition hover:border-[#91a8c7] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#536780]">
                      {u.organization}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeColor}`}>
                      {kindLabel}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-[#082046] hover:text-[#0e7bf4]">
                    <Link href={`/updates/${u.id}`}>
                      {u.title}
                    </Link>
                  </h2>

                  <div className="flex items-center gap-3 text-xs text-[#536780]">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      <span>{formatDate(u.date)}</span>
                    </span>
                    {u.opportunity_slug && (
                      <Link
                        href={`/search?q=${encodeURIComponent(u.title)}`}
                        className="text-[#0e7bf4] hover:underline"
                      >
                        View related recruitment →
                      </Link>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    href={`/updates/${u.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#082046] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#061835]"
                  >
                    View Notice <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Truth in data footer */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-4 text-xs text-[#435775]">
        <ShieldCheck className="size-4 shrink-0 text-[#0e7bf4] mt-0.5" />
        <p>
          <strong>Official Source Verification:</strong> ApplyFields monitors state public service commissions, SSC, UPSC, NTA, and central boards. Every link routes directly to official commission PDF notices or hall ticket login portals.
        </p>
      </div>
    </div>
  );
}
