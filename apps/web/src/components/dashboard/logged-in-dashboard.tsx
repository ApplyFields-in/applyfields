'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, Info, ShieldCheck } from 'lucide-react';
import type { HomeSummary, OpportunityCard } from '@applyfields/types';
import { HorizontalOpportunityCard } from '@/components/opportunity/horizontal-opportunity-card';
import { apiGet } from '@/lib/api';

interface LoggedInDashboardProps {
  initialHomeData?: HomeSummary | null;
  userName?: string;
}

export function LoggedInDashboard({ initialHomeData, userName = '' }: LoggedInDashboardProps) {
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
  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-16">
      <header>
        <p className="text-xs font-medium text-slate-500">{today}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
          {currentUserName ? `${greeting}, ${currentUserName}` : 'Welcome back'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">Your first move starts here.</p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-[#F5E6CC] bg-[#FFF9EE] p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#7C4A03]">
            <Info className="size-4" aria-hidden="true" /> What needs your attention?
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
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-slate-600">No closing dates to show right now.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-[#082046]">Profile readiness</h2>
          {liveData?.personal ? (
            <div className="mt-4 flex items-start gap-3 text-sm text-slate-700">
              <CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${liveData.personal.profile_ready ? 'text-[#0e7bf4]' : 'text-slate-400'}`} />
              <div>
                <p>{liveData.personal.profile_ready ? 'Your profile is ready for eligibility checks.' : 'Complete your profile to see eligible opportunities.'}</p>
                {!liveData.personal.profile_ready && <Link href="/profile" className="mt-2 inline-flex items-center gap-1 font-semibold text-[#0e7bf4]">Complete profile <ArrowRight className="size-3.5" /></Link>}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">Profile status will appear when your account data is available.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-[#082046]">My applications</h2>
          <Link href="/applications" className="flex items-center gap-1 text-xs font-semibold text-[#082046] hover:text-[#0e7bf4]">View all <ArrowRight className="size-3.5" /></Link>
        </div>
        <p className="text-sm text-slate-600">Application tracking is not connected to live account data yet.</p>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-[#082046]">Recommended for you</h2>
          <Link href="/apply" className="flex items-center gap-1 text-xs font-semibold text-[#082046] hover:text-[#0e7bf4]">All opportunities <ArrowRight className="size-3.5" /></Link>
        </div>
        {recommendations.length ? (
          <div className="space-y-3">{recommendations.map((item) => <HorizontalOpportunityCard key={item.slug} item={item} />)}</div>
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            {liveData?.personal?.profile_ready ? 'No matching opportunities are available right now.' : 'Complete your profile to get opportunity matches.'}
          </p>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-[#F1F6FB] p-5">
          <h2 className="mb-3 text-base font-bold text-[#082046]">Saved</h2>
          {saved.length ? (
            <ul className="divide-y divide-slate-200/70">
              {saved.map((item) => <li key={item.slug} className="py-2.5"><Link href={opportunityHref(item)} className="text-sm font-semibold text-[#082046] hover:text-[#0e7bf4]">{item.title}</Link><p className="mt-0.5 text-xs text-slate-500">{item.organization}</p></li>)}
            </ul>
          ) : <p className="text-sm text-slate-600">Your saved opportunities will appear here.</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-base font-bold text-[#082046]">Recently viewed</h2>
          {recentlyViewed.length ? (
            <ul className="divide-y divide-slate-100">
              {recentlyViewed.map((item) => <li key={item.slug} className="py-3"><Link href={opportunityHref(item)} className="text-sm font-semibold text-[#082046] hover:text-[#0e7bf4]">{item.title}</Link><p className="mt-0.5 text-xs text-slate-500">{item.organization}</p></li>)}
            </ul>
          ) : <p className="text-sm text-slate-600">Opportunities you view will appear here.</p>}
        </div>
      </section>

      <section>
        <div className="mb-4 border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-[#082046]">Important updates</h2>
        </div>
        {liveData?.updates.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {liveData.updates.slice(0, 4).map((update, index) => (
              <article key={update.id} className={`rounded-2xl border p-5 ${index === 0 ? 'border-[#F5E6CC] bg-[#FFF9EE]' : 'border-slate-200 bg-[#F0F5FA]'}`}>
                <p className="text-xs font-medium text-slate-500">{update.organization} · {update.date}</p>
                <h3 className="mt-2 text-sm font-semibold text-[#082046]">{update.title}</h3>
                <Link href="/updates" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0e7bf4]">Read notice <ArrowRight className="size-3" /></Link>
              </article>
            ))}
          </div>
        ) : <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No new updates are available.</p>}
      </section>

      <div className="flex items-start gap-2 border-t border-slate-200 py-4 text-xs text-slate-500">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>ApplyFields is an independent platform, not a government department. Always apply through the official route shown on each listing.</p>
      </div>
    </div>
  );
}

function opportunityHref(item: OpportunityCard) {
  const collection = item.type === 'govt_job' ? 'jobs' : item.type === 'admission' ? 'admissions' : item.type === 'exam' ? 'exams' : 'scholarships';
  return `/${collection}/${item.slug}`;
}
