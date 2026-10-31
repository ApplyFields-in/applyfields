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
import { useLanguage } from '@/lib/i18n/language-context';

export function ServicesQuickBridge() {
  const { t } = useLanguage();

  return (
    <section className="my-10 grid gap-6 md:grid-cols-2">
      {/* Citizen Booking Callout */}
      <div className="relative overflow-hidden rounded-3xl border border-[#c4d2e3] bg-gradient-to-br from-[#ffffff] via-[#f8fbff] to-[#e6f4fe] p-7 shadow-sm transition hover:shadow-md">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100/80 px-3 py-1 text-xs font-bold text-cyan-800">
            <Sparkles className="size-3.5 text-cyan-600" />
            <span>{t('bridge_hub_badge')}</span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-[#082046]">
            {t('bridge_citizen_title')}
          </h3>

          <p className="text-xs leading-relaxed text-[#536780]">
            {t('bridge_citizen_desc')}
          </p>

          <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold text-[#082046]">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 border border-[#c4d7ec] text-[#082046] shadow-xs">
              <span className="font-bold text-[#0e7bf4]">✓</span> {t('bridge_feat_xerox')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 border border-[#c4d7ec] text-[#082046] shadow-xs">
              <span className="font-bold text-[#0e7bf4]">✓</span> {t('bridge_feat_pan')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 border border-[#c4d7ec] text-[#082046] shadow-xs">
              <span className="font-bold text-[#0e7bf4]">✓</span> {t('bridge_feat_certs')}
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
              <span className="font-bold !text-white" style={{ color: '#ffffff' }}>{t('bridge_book_slots')}</span>
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
            <span>{t('bridge_partner_badge')}</span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-[#082046]">
            {t('bridge_partner_title')}
          </h3>

          <p className="text-xs leading-relaxed text-[#536780]">
            {t('bridge_partner_desc')}
          </p>

          <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold text-[#082046]">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 border border-[#c4d7ec] text-[#082046] shadow-xs">
              <span className="font-bold text-emerald-600">✓</span> {t('bridge_feat_gps')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 border border-[#c4d7ec] text-[#082046] shadow-xs">
              <span className="font-bold text-emerald-600">✓</span> {t('bridge_feat_shifts')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 border border-[#c4d7ec] text-[#082046] shadow-xs">
              <span className="font-bold text-emerald-600">✓</span> {t('bridge_feat_print')}
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
              <span className="font-bold !text-white" style={{ color: '#ffffff' }}>{t('bridge_register_partner')}</span>
              <ArrowRight className="size-4 text-emerald-200" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
