'use client';

import React from 'react';
import Link from 'next/link';
import {
  Printer,
  ShieldCheck,
  Store,
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { SERVICE_PORTAL_URL, PARTNER_PORTAL_URL } from '@/lib/urls';

export function ServicesQuickBridge() {
  return (
    <section className="my-10 grid gap-6 md:grid-cols-2">
      {/* Citizen Booking Callout */}
      <div className="relative overflow-hidden rounded-3xl border border-[#c4d2e3] bg-gradient-to-br from-[#ffffff] via-[#f8fbff] to-[#e6f4fe] p-7 shadow-sm transition hover:shadow-md">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100/80 px-3 py-1 text-xs font-bold text-cyan-800">
            <Sparkles className="size-3.5 text-cyan-600" />
            <span>ApplyFields Citizen Services Hub</span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-[#082046]">
            Need MeeSeva, PAN Card or Xerox?
          </h3>

          <p className="text-xs leading-relaxed text-[#536780]">
            Skip walk-in queues. Reserve guaranteed 15-to-30 minute time slots at verified digital centers near your home or college with pre-filled forms.
          </p>

          <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold text-[#082046]">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 border border-[#c4d7ec] text-[#082046] shadow-xs">
              <span className="font-bold text-[#0e7bf4]">✓</span> Laser Xerox &amp; Spiral Binding
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 border border-[#c4d7ec] text-[#082046] shadow-xs">
              <span className="font-bold text-[#0e7bf4]">✓</span> Instant e-PAN &amp; NSDL
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 border border-[#c4d7ec] text-[#082046] shadow-xs">
              <span className="font-bold text-[#0e7bf4]">✓</span> Caste &amp; Income Certificates
            </span>
          </div>

          <div className="pt-2">
            <a
              href={SERVICE_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#082046] px-5 py-3 text-xs font-bold !text-white shadow-md transition hover:bg-[#0e7bf4] hover:shadow-lg active:scale-95"
              style={{ color: '#ffffff' }}
            >
              <span className="font-bold !text-white" style={{ color: '#ffffff' }}>Explore Centers &amp; Book Slots</span>
              <ArrowRight className="size-4 text-cyan-300" />
            </a>
          </div>
        </div>
      </div>

      {/* Partner Operator Recruitment Callout */}
      <div className="relative overflow-hidden rounded-3xl border border-[#c4d2e3] bg-gradient-to-br from-[#ffffff] via-[#fcfdf9] to-[#ecfdf5] p-7 shadow-sm transition hover:shadow-md">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800">
            <Store className="size-3.5 text-emerald-600" />
            <span>For Local Shop &amp; Kiosk Owners</span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-[#082046]">
            Run a MeeSeva, CSC, or Xerox Shop?
          </h3>

          <p className="text-xs leading-relaxed text-[#536780]">
            Join the ApplyFields Partner Network. Receive pre-scheduled citizen appointments, boost monthly revenue, and manage your shifts with zero software friction.
          </p>

          <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold text-[#082046]">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 border border-[#c4d7ec] text-[#082046] shadow-xs">
              <span className="font-bold text-emerald-600">✓</span> GPS Distance Discovery
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 border border-[#c4d7ec] text-[#082046] shadow-xs">
              <span className="font-bold text-emerald-600">✓</span> Swiggy-Style Shift Scheduler
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 border border-[#c4d7ec] text-[#082046] shadow-xs">
              <span className="font-bold text-emerald-600">✓</span> 1-Click Document Printing
            </span>
          </div>

          <div className="pt-2">
            <a
              href={`${PARTNER_PORTAL_URL}/onboard`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold !text-white shadow-md transition hover:bg-emerald-500 hover:shadow-lg active:scale-95"
              style={{ color: '#ffffff' }}
            >
              <span className="font-bold !text-white" style={{ color: '#ffffff' }}>Register Your Center in 3 Mins</span>
              <ArrowRight className="size-4 text-emerald-200" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
