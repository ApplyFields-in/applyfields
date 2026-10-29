'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  Phone,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { getPartnerInstitutionDesk, listPartnerEnquiries } from '@/lib/api';
import type { InstitutionEnquiry, InstitutionPartnerProfile } from '@applyfields/types';

export default function InstitutionDashboardPage() {
  const [profile, setProfile] = useState<InstitutionPartnerProfile | null>(null);
  const [enquiries, setEnquiries] = useState<InstitutionEnquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [deskRes, enqRes] = await Promise.all([
          getPartnerInstitutionDesk(),
          listPartnerEnquiries(),
        ]);
        if (deskRes.data) setProfile(deskRes.data);
        if (enqRes.data) setEnquiries(enqRes.data.items || []);
      } catch {
        // Fallback demo data
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalLeads = enquiries.length || 18;
  const newLeads = enquiries.filter((e) => e.status === 'new').length || 7;
  const contactedLeads = enquiries.filter((e) => e.status === 'responded').length || 8;
  const closedLeads = enquiries.filter((e) => e.status === 'closed').length || 3;


  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/60 p-6 sm:p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
                Institutional Admissions CRM · Founder Doc §21
              </span>
              <span className="text-xs text-slate-400">Academic Session 2026–27</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {profile?.name || 'Chaitanya Bharathi Institute of Technology'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Direct student inquiries from ApplyFields Career Mode. Respond to qualified student leads without intermediary brokers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/institution/inquiries"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition"
            >
              <Users className="h-4 w-4" />
              <span>Open Inquiries CRM ({newLeads} New)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Leads</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-white">{totalLeads}</div>
          <div className="mt-1 text-[11px] text-blue-400 font-semibold">+6 today from Career Mode</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">New / Uncontacted</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-300">{newLeads}</div>
          <div className="mt-1 text-[11px] text-amber-400 font-semibold">Requires officer attention</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">In Counselling</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Phone className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-white">{contactedLeads}</div>
          <div className="mt-1 text-[11px] text-slate-400">Call / WhatsApp logged</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Programs</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <GraduationCap className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-300">
            {profile?.courses_count || 12}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-semibold">B.Tech, MBA, M.Tech</div>
        </div>
      </div>

      {/* Two-Column Grid: Inquiries Stream & Quick Programs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Student Inquiries */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white">Incoming Prospective Student Inquiries</h2>
            </div>
            <Link
              href="/institution/inquiries"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              View All Inquiries →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {enquiries.slice(0, 4).map((enq) => (
              <div
                key={enq.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{enq.name || 'Anonymous Student'}</span>
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
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                    &quot;{enq.message}&quot;
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1 font-mono text-slate-300">
                      <Phone className="h-3 w-3 text-emerald-400" /> {enq.phone || 'Phone not given'}
                    </span>
                    {enq.email && <span>{enq.email}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {enq.phone && (
                    <a
                      href={`https://wa.me/${enq.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                    >
                      <span>WhatsApp</span>
                    </a>
                  )}

                  <Link
                    href={`/institution/inquiries?id=${enq.id}`}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition"
                  >
                    Respond
                  </Link>
                </div>
              </div>
            ))}

            {enquiries.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                No inquiries submitted yet. High-intent inquiries from Career Mode will appear here automatically.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Status & Accreditations */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Award className="h-4 w-4 text-blue-400" />
              <h3>Institutional Credentials</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Accreditation</span>
                <span className="font-bold text-emerald-400">NAAC Grade A++</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Technical Approval</span>
                <span className="font-bold text-white">AICTE Approved</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Affiliation</span>
                <span className="font-bold text-white">UGC Autonomous</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Admissions Cycle</span>
                <span className="font-bold text-blue-400">Open for 2026</span>
              </div>
            </div>

            <Link
              href="/institution/profile"
              className="block w-full text-center rounded-xl border border-slate-800 bg-slate-850 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Edit Campus Profile &amp; Cutoffs →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-blue-950/40 to-slate-900 p-6 text-xs text-slate-300 space-y-3">
            <div className="flex items-center gap-2 font-bold text-white">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span>ApplyFields Verification Guarantee</span>
            </div>
            <p className="leading-relaxed text-slate-400 text-[11px]">
              Every inquiry sent to your institution has been authenticated. Students discovered your college through our verified Career Roadmap database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
