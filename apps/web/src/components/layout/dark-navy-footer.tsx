'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/language-context';
import { CookiePreferencesTrigger } from '@/components/cookie-banner';
import { PARTNER_PORTAL_URL } from '@/lib/urls';

export function DarkNavyFooter() {
  const { t } = useLanguage();

  return (
    <footer className="mt-12 border-t border-white/10 bg-[#0B2240] text-[#c8d5e6]">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Image src="/logo-mark.png" alt="" width={40} height={32} unoptimized className="h-8 w-10 object-contain" />
              <span className="text-lg font-bold tracking-tight text-white">Apply<span className="text-[#0e7bf4]">Fields</span></span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-[#c8d5e6]">
              {t('footer_tagline')}
            </p>
            <a href="mailto:support@applyfields.in" className="inline-block text-xs font-semibold text-white hover:underline">
              support@applyfields.in
            </a>
          </div>

          {/* Column 1: Apply */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white">{t('footer_apply')}</p>
            <ul className="space-y-1.5 text-xs text-[#c8d5e6]">
              <li>
                <Link href="/jobs" className="hover:text-white transition-colors">
                  {t('footer_gov_jobs')}
                </Link>
              </li>
              <li>
                <Link href="/exams" className="hover:text-white transition-colors">
                  {t('footer_exams')}
                </Link>
              </li>
              <li>
                <Link href="/scholarships" className="hover:text-white transition-colors">
                  {t('footer_scholarships')}
                </Link>
              </li>
              <li>
                <Link href="/admissions" className="hover:text-white transition-colors">
                  {t('footer_admissions')}
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  {t('footer_services')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Career */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white">{t('footer_career')}</p>
            <ul className="space-y-1.5 text-xs text-[#c8d5e6]">
              <li>
                <Link href="/career" className="hover:text-white transition-colors">
                  {t('footer_explore_careers')}
                </Link>
              </li>
              <li>
                <Link href="/career/courses" className="hover:text-white transition-colors">
                  {t('footer_courses')}
                </Link>
              </li>
              <li>
                <Link href="/career/colleges" className="hover:text-white transition-colors">
                  {t('footer_colleges')}
                </Link>
              </li>
              <li>
                <Link href="/career/skills" className="hover:text-white transition-colors">
                  {t('footer_skills')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: ApplyFields */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white">{t('footer_applyfields')}</p>
            <ul className="space-y-1.5 text-xs text-[#c8d5e6]">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  {t('footer_about')}
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  {t('footer_how_verify')}
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  {t('footer_contact')}
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-white transition-colors">
                  {t('footer_settings', 'Settings & Preferences')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  {t('footer_privacy')}
                </Link>
              </li>
              <li>
                <a
                  href={`${PARTNER_PORTAL_URL}/onboard`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 text-emerald-400 font-semibold"
                >
                  <span>Become a Partner</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-bold uppercase tracking-wider">MeeSeva/CSC</span>
                </a>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <CookiePreferencesTrigger className="hover:text-white transition-colors text-left" />
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-3.5 text-[11px] text-[#c8d5e6] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="leading-relaxed">
            {t('footer_copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}

