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

          <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold text-[#324b6f]">
            <span className="rounded-lg bg-white px-2.5 py-1 border border-[#d6e3f2]">✓ Laser Xerox &amp; Spiral Binding</span>
            <span className="rounded-lg bg-white px-2.5 py-1 border border-[#d6e3f2]">✓ Instant e-PAN &amp; NSDL</span>
            <span className="rounded-lg bg-white px-2.5 py-1 border border-[#d6e3f2]">✓ Caste &amp; Income Certificates</span>
          </div>

          <div className="pt-2">
            <a
              href={SERVICE_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#082046] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#0c2f66]"
            >
              <span>Explore Centers &amp; Book Slots</span>
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

          <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold text-[#324b6f]">
            <span className="rounded-lg bg-white px-2.5 py-1 border border-[#d6e3f2]">✓ GPS Distance Discovery</span>
            <span className="rounded-lg bg-white px-2.5 py-1 border border-[#d6e3f2]">✓ Swiggy-Style Shift Scheduler</span>
            <span className="rounded-lg bg-white px-2.5 py-1 border border-[#d6e3f2]">✓ 1-Click Document Printing</span>
          </div>

          <div className="pt-2">
            <a
              href={`${PARTNER_PORTAL_URL}/onboard`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
            >
              <span>Register Your Center in 3 Mins</span>
              <ArrowRight className="size-4 text-emerald-200" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
