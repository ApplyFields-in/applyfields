'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Route } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { CareerCollegesHoverMenu } from '@/components/career-colleges-hover-menu';
import type { CareerCategory, CareerDetail, CareerSummary } from '@applyfields/types';

export default function CareerPage() {
  const [categories, setCategories] = useState<CareerCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [careers, setCareers] = useState<CareerSummary[]>([]);
  const [activeCareer, setActiveCareer] = useState<CareerSummary | null>(null);
  const [careerDetail, setCareerDetail] = useState<CareerDetail | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingCareers, setLoadingCareers] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGet<CareerCategory[]>('/career/categories').then((result) => {
      if (cancelled) return;
      setCategories(result ?? []);
      setSelectedCategory(result?.[0]?.slug ?? '');
      setApiUnavailable(result === null);
      setLoadingCategories(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingCareers(true);
    setCareers([]);
    setActiveCareer(null);
    setCareerDetail(null);
    const query = selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : '';
    apiGet<CareerSummary[]>(`/career${query}`).then((result) => {
      if (cancelled) return;
      setCareers(result ?? []);
      setActiveCareer(result?.[0] ?? null);
      setApiUnavailable((previous) => previous || result === null);
      setLoadingCareers(false);
    });
    return () => { cancelled = true; };
  }, [selectedCategory]);

  useEffect(() => {
    if (!activeCareer) return;
    let cancelled = false;
    setLoadingDetail(true);
    setCareerDetail(null);
    apiGet<CareerDetail>(`/career/${encodeURIComponent(activeCareer.slug)}`).then((result) => {
      if (cancelled) return;
      setCareerDetail(result);
      setApiUnavailable((previous) => previous || result === null);
      setLoadingDetail(false);
    });
    return () => { cancelled = true; };
  }, [activeCareer]);

  return (
    <div>
      <section className="border-y border-[#e5d0aa] bg-[#F4E8D1]">
          <div className="mx-auto max-w-[1360px] space-y-4 px-4 pt-8 pb-6 sm:pt-10 sm:pb-7 sm:px-6 lg:px-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#76562d]">Career mode</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#082046] sm:text-3xl">Career</h1>
              <p className="mt-1 text-sm text-[#435775]">Your first move starts here.</p>
            </div>
            <nav aria-label="Career resources" className="flex flex-wrap items-center gap-2">
              <Link href="/career/roadmaps" className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-medium text-[#082046] hover:bg-[#ffffff]"><Route className="size-4 text-[#0e7bf4]" /> Roadmaps</Link>
              <Link href="/career/courses" className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-medium text-[#082046] hover:bg-[#ffffff]"><BookOpen className="size-4 text-[#0e7bf4]" /> Courses</Link>
              <CareerCollegesHoverMenu />
            </nav>
            {categories.length > 0 && (
              <nav aria-label="Career categories" className="flex gap-2 overflow-x-auto pt-1 scrollbar-none">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.slug)}
                    aria-pressed={selectedCategory === category.slug}
                    className={`min-h-9 shrink-0 rounded-md border px-3.5 text-xs font-medium transition-colors ${selectedCategory === category.slug ? 'border-[#082046] bg-[#082046] text-[#ffffff]' : 'border-[#dec9a5] bg-[#f8f5ef] text-[#243b5b] hover:bg-[#ffffff]'}`}
                  >
                    {category.name}<span className="ml-1.5 opacity-70">{category.careers_count ?? 0}</span>
                  </button>
                ))}
              </nav>
            )}
          </div>
        </section>

        <div className="bg-[#F2F1ED]">
        <div className="mx-auto max-w-[1360px] space-y-5 px-4 py-6 pb-12 sm:px-6 lg:px-8">

        {loadingCategories || loadingCareers ? (
          <p className="rounded-xl border border-[#d3ddeb] bg-[#f8fbff] p-6 text-sm text-[#536780]">Loading careers…</p>
        ) : careers.length === 0 ? (
          <div className="rounded-xl border border-[#d3ddeb] bg-[#f8fbff] p-6">
            <h2 className="font-semibold text-[#082046]">{apiUnavailable ? 'Career information is unavailable right now.' : 'No careers published in this category yet.'}</h2>
            <p className="mt-1 text-sm text-[#536780]">Try another category or return later.</p>
          </div>
        ) : (
          <section className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside>
              <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-[#536780]">{categories.find((category) => category.slug === selectedCategory)?.name} careers</p>
              <ul className="overflow-hidden rounded-2xl border border-[#d3ddeb] bg-[#DCE7F3]">
                {careers.map((career) => (
                  <li key={career.id}>
                    <button
                      type="button"
                      onClick={() => setActiveCareer(career)}
                      aria-pressed={activeCareer?.id === career.id}
                      className={`min-h-11 w-full border-b border-[#d3ddeb] px-4 text-left text-sm last:border-0 ${activeCareer?.id === career.id ? 'bg-[#f8fbff] font-semibold text-[#082046]' : 'text-[#334a69] hover:bg-[#ffffff]'}`}
                    >
                      {career.title}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <article className="overflow-hidden rounded-2xl border border-[#d3ddeb] bg-[#f8fbff]">
              {activeCareer && <>
                <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#d3ddeb] bg-[#F0F5FA] p-5 sm:p-6">
                  <div>
                    <span className="rounded-md border border-[#b8d7ff] bg-[#eaf3ff] px-2 py-1 text-[11px] font-medium text-[#0e7bf4]">{activeCareer.category_name}</span>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#082046]">{activeCareer.title}</h2>
                    <p className="mt-1 text-sm text-[#536780]">{[activeCareer.salary_text, activeCareer.outlook_text].filter(Boolean).join(' · ')}</p>
                  </div>
                  <Link href={`/career/roadmaps?career=${encodeURIComponent(activeCareer.slug)}`} className="inline-flex min-h-10 items-center rounded-xl bg-[#0e7bf4] px-4 text-sm font-semibold text-[#ffffff] hover:bg-[#0c6fdc]">Explore roadmap</Link>
                </header>

                <div className="grid gap-5 border-b border-[#d3ddeb] p-5 md:grid-cols-3 sm:p-6">
                  <div><h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#536780]">What you do</h3><p className="text-sm leading-relaxed text-[#334a69]">{careerDetail?.what_it_involves || activeCareer.summary}</p></div>
                  <div><h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#536780]">Education</h3><p className="whitespace-pre-line text-sm leading-relaxed text-[#334a69]">{activeCareer.education_required}</p></div>
                  <div><h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#536780]">Skills</h3>{activeCareer.skills.length ? <div className="flex flex-wrap gap-1.5">{activeCareer.skills.map((skill) => <span key={skill} className="rounded-md border border-[#d3ddeb] bg-[#f3f7fc] px-2 py-1 text-xs text-[#334a69]">{skill}</span>)}</div> : <p className="text-sm text-[#536780]">No skills listed yet.</p>}</div>
                </div>

                <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_260px] sm:p-6">
                  <section>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#536780]">Roadmap</p>
                    <h3 className="mb-4 mt-1 text-lg font-bold text-[#082046]">Career path</h3>
                    {loadingDetail ? <p className="text-sm text-[#536780]">Loading career path…</p> : careerDetail?.pathway_steps.length ? (
                      <ol className="space-y-4 border-l border-[#d3ddeb] pl-5">
                        {careerDetail.pathway_steps.map((step) => <li key={step.step} className="relative"><span className="absolute -left-[27px] grid size-5 place-items-center rounded-full border border-[#a5b5cb] bg-[#f8fbff] text-[10px] font-bold text-[#082046]">{step.step}</span><h4 className="text-sm font-semibold text-[#082046]">{step.title}</h4><p className="mt-0.5 text-sm text-[#536780]">{step.description}</p>{step.duration && <p className="mt-1 text-xs text-[#667991]">{step.duration}</p>}</li>)}
                      </ol>
                    ) : <p className="text-sm text-[#536780]">A roadmap has not been published for this career yet.</p>}
                  </section>
                  <aside className="space-y-4">
                    {!!careerDetail?.linked_opportunities.length && <div className="rounded-2xl border border-[#b8d7ff] bg-[#EAF3FF] p-4"><h3 className="text-[11px] font-bold uppercase tracking-wider text-[#0e7bf4]">Related opportunities</h3><ul className="mt-2 space-y-2 text-sm text-[#082046]">{careerDetail.linked_opportunities.map((item) => <li key={`${item.type}-${item.title}`}><Link href={`/search?q=${encodeURIComponent(item.title)}`} className="hover:text-[#0e7bf4]">{item.title}</Link></li>)}</ul></div>}
                    {!!careerDetail?.cons.length && <div className="rounded-2xl border border-[#e7d3ad] bg-[#FFF9EE] p-4"><h3 className="text-[11px] font-bold uppercase tracking-wider text-[#7C4A03]">Things to consider</h3><ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#334a69]">{careerDetail.cons.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                  </aside>
                </div>
              </>}
            </article>
          </section>
        )}
        </div>
      </div>
    </div>
  );
}
