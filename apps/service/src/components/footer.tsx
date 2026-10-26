'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Building2,
  ShieldCheck,
  Phone,
  Printer,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';

export function Footer() {
  const MAIN_WEB_URL = process.env.NEXT_PUBLIC_MAIN_WEB_URL || 'http://localhost:3000';
  const PARTNER_URL = process.env.NEXT_PUBLIC_PARTNER_PORTAL_URL || 'http://localhost:3002';

  return (
    <footer className="border-t border-[#0d2a58] bg-[#082046] text-[#e0edfb] py-14 text-xs mt-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-mark.png"
                alt="ApplyFields Logo"
                width={32}
                height={32}
                className="size-8 object-contain"
              />
              <span className="text-base font-black tracking-tight text-white">
                ApplyFields Services
              </span>
            </div>
            <p className="text-[#a8c1de] text-xs leading-relaxed">
              India’s first online reservation and convenience platform connecting citizens directly with local verified MeeSeva, CSC, and Xerox kiosks with zero waiting lines.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-[#38bdf8]">
              <ShieldCheck className="h-4 w-4" />
              <span>Government Portal Verified Facilitation</span>
            </div>
          </div>

          {/* Citizen Services */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold uppercase tracking-wider text-[11px]">
              Citizen Services
            </h4>
            <ul className="space-y-2 text-xs text-[#a8c1de]">
              <li>
                <Link href="/?category=meeseva" className="hover:text-white transition">
                  MeeSeva Caste &amp; Income Certificates
                </Link>
              </li>
              <li>
                <Link href="/?category=aadhaar" className="hover:text-white transition">
                  UIDAI Aadhaar PVC Smart Cards &amp; Updates
                </Link>
              </li>
              <li>
                <Link href="/?category=pan" className="hover:text-white transition">
                  Instant e-PAN &amp; NSDL Physical Cards
                </Link>
              </li>
              <li>
                <Link href="/?category=xerox" className="hover:text-white transition">
                  Laser Xerox &amp; Spiral Binding Desk
                </Link>
              </li>
              <li>
                <Link href="/?category=exams" className="hover:text-white transition">
                  SSC, UPSC, NEET &amp; EAMCET Form Filing
                </Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem Links */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold uppercase tracking-wider text-[11px]">
              Ecosystem Portals
            </h4>
            <ul className="space-y-2 text-xs text-[#a8c1de]">
              <li>
                <a href={MAIN_WEB_URL} className="hover:text-white transition inline-flex items-center gap-1">
                  <span>Main ApplyFields Portal</span>
                  <ArrowUpRight className="h-3 w-3 text-[#38bdf8]" />
                </a>
              </li>
              <li>
                <a href={`${MAIN_WEB_URL}/career`} className="hover:text-white transition">
                  Career Explorer &amp; Roadmaps
                </a>
              </li>
              <li>
                <a href={`${MAIN_WEB_URL}/jobs`} className="hover:text-white transition">
                  Government Job Alerts &amp; Results
                </a>
              </li>
              <li>
                <a href={`${MAIN_WEB_URL}/exams`} className="hover:text-white transition">
                  Entrance Exams &amp; Cutoff Scores
                </a>
              </li>
              <li>
                <a href={`${MAIN_WEB_URL}/scholarships`} className="hover:text-white transition">
                  National &amp; State Scholarships
                </a>
              </li>
            </ul>
          </div>

          {/* For Operators */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold uppercase tracking-wider text-[11px]">
              For Service Center Owners
            </h4>
            <p className="text-xs text-[#a8c1de]">
              Run a MeeSeva, CSC kiosk, or Xerox shop? List your business and get verified appointments.
            </p>
            <div className="pt-2 space-y-2">
              <a
                href={`${PARTNER_URL}/onboard`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#0c6fdc] transition"
              >
                <span>Partner Onboarding</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <div>
                <a href={PARTNER_URL} className="text-xs text-[#38bdf8] font-bold hover:underline">
                  Operator Workspace Login →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#0d2a58] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#7896bc]">
          <p>© 2026 ApplyFields Technologies Inc. · Dedicated Citizen Services Portal (`service.applyfields.in`)</p>
          <div className="flex items-center gap-4">
            <a href={`${MAIN_WEB_URL}/help`} className="hover:text-white transition">Help &amp; FAQs</a>
            <a href={`${MAIN_WEB_URL}/privacy`} className="hover:text-white transition">Privacy Policy</a>
            <a href={`${MAIN_WEB_URL}/terms`} className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
