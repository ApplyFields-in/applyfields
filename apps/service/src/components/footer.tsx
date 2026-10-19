'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  const MAIN_WEB_URL = process.env.NEXT_PUBLIC_MAIN_WEB_URL || 'http://localhost:3000';
  const PARTNER_URL = process.env.NEXT_PUBLIC_PARTNER_PORTAL_URL || 'http://localhost:3002';

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400 font-black text-slate-950 text-xs">
                ⚡
              </div>
              <span className="text-sm font-bold text-white tracking-tight">ApplyFields Services</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              India’s first online reservation and convenience platform connecting citizens directly with local verified MeeSeva, CSC, and Xerox kiosks.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-wider text-[10px]">Citizen Services</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/?category=meeseva" className="hover:text-cyan-400">MeeSeva Certificates</Link></li>
              <li><Link href="/?category=aadhaar" className="hover:text-cyan-400">Aadhaar PVC &amp; Updates</Link></li>
              <li><Link href="/?category=pan" className="hover:text-cyan-400">Instant e-PAN &amp; NSDL</Link></li>
              <li><Link href="/?category=xerox" className="hover:text-cyan-400">Xerox &amp; Project Binding</Link></li>
              <li><Link href="/?category=exams" className="hover:text-cyan-400">Exam Online Registration</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-wider text-[10px]">Ecosystem Portals</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href={MAIN_WEB_URL} className="hover:text-cyan-400">ApplyFields Main Portal</a></li>
              <li><a href={`${MAIN_WEB_URL}/jobs`} className="hover:text-cyan-400">Govt Job Notifications</a></li>
              <li><a href={`${MAIN_WEB_URL}/exams`} className="hover:text-cyan-400">Competitive Entrance Exams</a></li>
              <li><a href={`${MAIN_WEB_URL}/scholarships`} className="hover:text-cyan-400">Scholarship Portal</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-wider text-[10px]">For Business Operators</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href={`${PARTNER_URL}/onboard`} className="text-emerald-400 font-bold hover:underline">Register Your Center</a></li>
              <li><a href={PARTNER_URL} className="hover:text-white">Partner Portal Login</a></li>
              <li><a href={`${PARTNER_URL}/dashboard`} className="hover:text-white">Operator Command Desk</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 text-center text-[11px] text-slate-500">
          <p>© 2026 ApplyFields Technologies Inc. · Dedicated Citizen Services Portal (`service.applyfields.in`)</p>
        </div>
      </div>
    </footer>
  );
}
