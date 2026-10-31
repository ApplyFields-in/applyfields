'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, Info, ShieldCheck, Sparkles } from 'lucide-react';
import type { HomeSummary, OpportunityCard } from '@applyfields/types';
import { HorizontalOpportunityCard } from '@/components/opportunity/horizontal-opportunity-card';
import { apiGet } from '@/lib/api';
import { useLanguage } from '@/lib/i18n/language-context';

interface LoggedInDashboardProps {
  initialHomeData?: HomeSummary | null;
  userName?: string;
}

export function LoggedInDashboard({ initialHomeData, userName = '' }: LoggedInDashboardProps) {
  const { t, locale } = useLanguage();
  const [homeData, setHomeData] = useState<HomeSummary | null>(initialHomeData || null);
  const [currentUserName, setCurrentUserName] = useState(userName);

  useEffect(() => {
    if (!homeData) apiGet<HomeSummary>('/home').then((res) => res && setHomeData(res));

    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const name = parsed.full_name || parsed.email?.split('@')[0];
        if (name) setCurrentUserName(name.split(' ')[0]);
      } catch {
        // Keep the authenticated name supplied by the page.
      }
    }
  }, [homeData]);

  const liveData = homeData && !homeData.sample ? homeData : null;
  const recommendations = liveData?.personal?.recommended ?? [];
  const saved = liveData?.personal?.saved ?? [];
  const recentlyViewed = liveData?.personal?.recently_viewed ?? [];
  const closingSoon = liveData?.closing_soon ?? [];
  const today = new Intl.DateTimeFormat(locale === 'te' ? 'te-IN' : locale === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t('dash_good_morning') : hour < 17 ? t('dash_good_afternoon') : t('dash_good_evening');

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-16">
      <header>
        <p className="text-xs font-medium text-slate-500">{today}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
          {currentUserName ? `${greeting}, ${currentUserName}` : t('dash_welcome_back')}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{t('dash_subtitle')}</p>
      </header>

      {/* New User Welcome Onboarding State */}
      {(!liveData?.personal?.profile_ready || (saved.length === 0 && recommendations.length === 0)) && (
        <div className="rounded-3xl border border-line bg-gradient-to-br from-cream/90 via-canvas to-tea/30 p-6 sm:p-8 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-celadon/40 px-3 py-1 text-xs font-bold text-teal">
                <Sparkles className="size-3.5 text-sea" /> {t('dash_quick_start')}
              </span>
              <h2 className="mt-2 text-xl sm:text-2xl font-black text-teal">
                {t('dash_welcome_banner')}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-teal/80 max-w-xl">
                {t('dash_welcome_desc')}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col justify-between rounded-2xl border border-line bg-canvas/80 p-5 shadow-xs">
              <div>
                <span className="grid size-7 place-items-center rounded-full bg-teal text-cream text-xs font-bold">1</span>
                <h3 className="mt-3 text-sm font-bold text-teal">{t('dash_step1_title')}</h3>
                <p className="mt-1 text-xs text-teal/70 leading-relaxed">
                  {t('dash_step1_desc')}
                </p>
              </div>
              <Link href="/profile" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sea hover:underline">
                {t('dash_step1_btn')} <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col justify-between rounded-2xl border border-line bg-canvas/80 p-5 shadow-xs">
              <div>
                <span className="grid size-7 place-items-center rounded-full bg-teal text-cream text-xs font-bold">2</span>
                <h3 className="mt-3 text-sm font-bold text-teal">{t('dash_step2_title')}</h3>
                <p className="mt-1 text-xs text-teal/70 leading-relaxed">
                  {t('dash_step2_desc')}
                </p>
              </div>
              <Link href="/eligibility" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sea hover:underline">
                {t('dash_step2_btn')} <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col justify-between rounded-2xl border border-line bg-canvas/80 p-5 shadow-xs">
              <div>
                <span className="grid size-7 place-items-center rounded-full bg-teal text-cream text-xs font-bold">3</span>
                <h3 className="mt-3 text-sm font-bold text-teal">{t('dash_step3_title')}</h3>
                <p className="mt-1 text-xs text-teal/70 leading-relaxed">
                  {t('dash_step3_desc')}
                </p>
              </div>
              <Link href="/apply" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sea hover:underline">
                {t('dash_step3_btn')} <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-[#F5E6CC] bg-[#FFF9EE] p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#7C4A03]">
            <Info className="size-4" aria-hidden="true" /> {t('dash_attention_title')}
          </div>
          {closingSoon.length ? (
            <div className="divide-y divide-[#F5E6CC]">
              {closingSoon.slice(0, 3).map((item) => (
                <div key={item.slug} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Clock className="size-4 shrink-0 text-[#7C4A03]" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#082046]">{item.title}</p>
                      <p className="truncate text-xs text-slate-600">{item.organization}</p>
                    </div>
                  </div>
                  <Link href="/apply" className="shrink-0 rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c6fdc]">
                    {t('dash_view_btn')}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-slate-600">{t('dash_no_closing')}</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-[#082046]">{t('dash_profile_readiness')}</h2>
          {liveData?.personal ? (
            <div className="mt-4 flex items-start gap-3 text-sm text-slate-700">
              <CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${liveData.personal.profile_ready ? 'text-[#0e7bf4]' : 'text-slate-400'}`} />
              <div>
                <p>{liveData.personal.profile_ready ? t('dash_profile_ready') : t('dash_profile_not_ready')}</p>
                {!liveData.personal.profile_ready && (
                  <Link href="/profile" className="mt-2 inline-flex items-center gap-1 font-semibold text-[#0e7bf4]">
                    {t('dash_profile_complete_btn')} <ArrowRight className="size-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">{t('dash_profile_status_pending')}</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-[#082046]">{t('dash_my_applications')}</h2>
          <Link href="/applications" className="flex items-center gap-1 text-xs font-semibold text-[#082046] hover:text-[#0e7bf4]">
            {t('dash_view_all')} <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <p className="text-sm text-slate-600">{t('dash_app_tracking_note')}</p>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-[#082046]">{t('dash_recommended')}</h2>
          <Link href="/apply" className="flex items-center gap-1 text-xs font-semibold text-[#082046] hover:text-[#0e7bf4]">
            {t('dash_all_opps')} <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {recommendations.length ? (
          <div className="space-y-3">{recommendations.map((item) => <HorizontalOpportunityCard key={item.slug} item={item} />)}</div>
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            {liveData?.personal?.profile_ready ? t('dash_no_recs') : t('dash_profile_not_ready')}
          </p>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-[#F1F6FB] p-5">
          <h2 className="mb-3 text-base font-bold text-[#082046]">{t('dash_saved_opps')}</h2>
          {saved.length ? (
            <ul className="divide-y divide-slate-200/70">
              {saved.map((item) => (
                <li key={item.slug} className="py-2.5">
                  <Link href={opportunityHref(item)} className="text-sm font-semibold text-[#082046] hover:text-[#0e7bf4]">
                    {item.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">{item.organization}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">{t('dash_saved_empty')}</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-base font-bold text-[#082046]">{t('dash_recently_viewed')}</h2>
          {recentlyViewed.length ? (
            <ul className="divide-y divide-slate-100">
              {recentlyViewed.map((item) => (
                <li key={item.slug} className="py-3">
                  <Link href={opportunityHref(item)} className="text-sm font-semibold text-[#082046] hover:text-[#0e7bf4]">
                    {item.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">{item.organization}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">{t('dash_recent_empty')}</p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-[#082046]">{t('dash_important_updates')}</h2>
        </div>
        {liveData?.updates.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {liveData.updates.slice(0, 4).map((update, index) => (
              <article key={update.id} className={`rounded-2xl border p-5 ${index === 0 ? 'border-[#F5E6CC] bg-[#FFF9EE]' : 'border-slate-200 bg-[#F0F5FA]'}`}>
                <p className="text-xs font-medium text-slate-500">{update.organization} · {update.date}</p>
                <h3 className="mt-2 text-sm font-semibold text-[#082046]">{update.title}</h3>
                <Link href="/updates" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0e7bf4]">
                  {t('dash_read_notice')} <ArrowRight className="size-3" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">{t('dash_no_updates')}</p>
        )}
      </section>

      <div className="flex items-start gap-2 border-t border-slate-200 py-4 text-xs text-slate-500">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>{t('dash_independent_notice')}</p>
      </div>
    </div>
  );
}

function opportunityHref(item: OpportunityCard) {
  const collection = item.type === 'govt_job' ? 'jobs' : item.type === 'admission' ? 'admissions' : item.type === 'exam' ? 'exams' : 'scholarships';
  return `/${collection}/${item.slug}`;
}
