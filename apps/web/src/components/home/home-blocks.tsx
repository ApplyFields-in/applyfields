'use client';

import type { HomeStat, OpportunityCard, UpdateItem } from '@applyfields/types';
import { Avatar, Badge, buttonClass, Card, cn, EmptyState, ProgressBar, SectionTitle } from '@applyfields/ui';
import { ArrowRight, Award, Bookmark, BriefcaseBusiness, CircleCheck, Circle, ClipboardList, Clock, Compass, HandHelping, History, Landmark, School, Search } from 'lucide-react';
import Link from 'next/link';
import { formatDate, TYPE_META, UPDATE_LABEL } from '@/lib/format';
import { useLanguage } from '@/lib/i18n/language-context';

/* ------------------------------------------------------------------ hero */

export function Hero({ popular, deadlines }: { popular: string[]; deadlines: OpportunityCard[] }) {
  const { t } = useLanguage();

  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0e7bf4]">
          <span className="size-2 rounded-full bg-[#0e7bf4]" aria-hidden="true" /> {t('hero_tag')}
        </p>
        <h1 className="mt-4 text-5xl font-black leading-[1.05] tracking-tight text-[#082046] sm:text-6xl lg:text-7xl">
          {t('hero_title')}
          <span className="mt-1 block text-[#0e7bf4]">{t('hero_subtitle_1')}<br />{t('hero_subtitle_2')}</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg sm:text-xl font-medium leading-relaxed text-[#435775]">
          {t('hero_desc')}
        </p>

        <form action="/search" role="search" className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl bg-canvas p-2 pl-4 shadow-pressed">
          <Search className="size-5 shrink-0 text-[#0e7bf4]" aria-hidden="true" />
          <input
            name="q"
            type="search"
            aria-label="Search ApplyFields"
            placeholder={t('hero_search_placeholder')}
            className="h-11 min-w-0 flex-1 bg-transparent text-base text-[#082046] outline-none placeholder:text-[#71839b]"
          />
          <button type="submit" className={buttonClass()}>
            {t('hero_search_btn')} <ArrowRight aria-hidden="true" />
          </button>
        </form>

        {!!popular.length && <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
          <span className="text-[#536780]">{t('hero_trending')}</span>
          {popular.map((q) => (
            <Link key={q} href={`/search?q=${encodeURIComponent(q)}`} className="font-semibold text-teal hover:text-sea">
              {q} ↗
            </Link>
          ))}
        </div>}
      </div>

      <aside className="border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-teal">{t('hero_horizon_title')}</h2>
          <span className="grid size-5 place-items-center rounded-full border border-sea text-[10px] font-bold text-sea" aria-hidden="true">i</span>
        </div>
        {deadlines.length ? <ul className="mt-4 divide-y divide-line">
          {deadlines.slice(0, 3).map((item) => (
            <li key={item.slug}>
              <Link href={`${TYPE_META[item.type].base}/${item.slug}`} className="flex items-center gap-3 py-3 hover:text-sea">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-canvas text-center shadow-clay">
                  <span className="text-base font-bold leading-none text-sea">{item.days_left ?? '—'}</span>
                  <span className="text-[9px] uppercase text-teal/75">{t('hero_days_left')}</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug text-teal">{item.title}</span>
                  <span className="mt-1 block text-xs text-[#536780]">{item.organization}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul> : <p className="mt-4 text-sm text-[#536780]">{t('hero_no_deadlines')}</p>}
        <Link href="/apply" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sea">
          {t('hero_all_deadlines')} <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </aside>
    </section>
  );
}

/* ------------------------------------------------------------------ stats & ambition section */

export function ExploreAmbitionSection({ stats }: { stats: HomeStat[] }) {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="explore-opportunities">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 id="explore-opportunities" className="text-xl sm:text-2xl font-black text-[#082046]">{t('ambition_title')}</h2>
        <Link href="/career" className="text-xs font-semibold text-[#536780] hover:text-[#0e7bf4]">{t('ambition_find_dir')}</Link>
      </div>
      <StatsRow stats={stats} />
    </section>
  );
}

export function StatsRow({ stats }: { stats: HomeStat[] }) {
  const { t } = useLanguage();
  const byKey = new Map<HomeStat['key'], HomeStat>(stats.map((stat) => [stat.key, stat] as const));
  const tiles = [
    { label: t('stat_jobs'), href: '/jobs', icon: BriefcaseBusiness, stat: byKey.get('open_jobs'), hint: t('stat_jobs_hint') },
    { label: t('stat_exams'), href: '/exams', icon: ClipboardList, stat: byKey.get('exams_this_month'), hint: t('stat_exams_hint') },
    { label: t('stat_scholarships'), href: '/scholarships', icon: Award, stat: byKey.get('scholarships_open'), hint: t('stat_scholarships_hint') },
    { label: t('stat_admissions'), href: '/admissions', icon: School, stat: undefined, hint: t('stat_admissions_hint') },
    { label: t('stat_services'), href: '/services', icon: Landmark, stat: undefined, hint: t('stat_services_hint') },
    { label: t('stat_careers'), href: '/career', icon: Compass, stat: undefined, hint: t('stat_careers_hint') },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {tiles.map(({ label, href, icon: Icon, stat, hint }) => (
        <Link key={label} href={href} className="clay-lift flex min-h-[118px] flex-col justify-between rounded-2xl bg-canvas p-4 shadow-clay">
          <Icon className="size-5 text-sea" aria-hidden="true" />
          <span>
            <span className="block text-sm font-semibold text-teal">{label}</span>
            <span className="mt-0.5 block text-xs text-[#536780]">
              {stat ? <><strong className="font-semibold text-teal">{stat.value.toLocaleString('en-IN')}</strong> {stat.label.toLowerCase()}</> : hint}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ closing soon */

export function ClosingSoon({ items }: { items: OpportunityCard[] }) {
  const { t } = useLanguage();

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3 border-b border-line pb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#536780]">{t('closing_soon_badge')}</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-black text-[#082046]">{t('closing_soon_title')}</h2>
        </div>
        <Link href="/apply" className="inline-flex items-center gap-1 text-xs font-semibold text-teal hover:text-sea">{t('closing_soon_all')} <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
      </div>
      {items.length ? <ul className="divide-y divide-line">
        {items.slice(0, 5).map((item) => (
          <li key={item.slug}>
            <Link href={`${TYPE_META[item.type].base}/${item.slug}`} className="grid gap-3 py-4 transition-colors hover:bg-[#ffffff] sm:grid-cols-[minmax(0,1fr)_150px_130px] sm:items-center sm:px-2">
              <span className="min-w-0">
                <span className="mb-1 inline-flex rounded-md border border-[#d5e1ef] bg-[#f8fbff] px-2 py-0.5 text-[10px] font-medium text-teal">{TYPE_META[item.type].label}</span>
                <span className="block truncate text-sm font-semibold text-teal">{item.title}</span>
                <span className="mt-0.5 block truncate text-xs text-[#536780]">{item.organization}</span>
              </span>
              <span className="text-xs text-[#536780]">{item.last_date ? formatDate(item.last_date) : t('closing_rolling')}{item.days_left != null ? ` · ${item.days_left}d` : ''}</span>
              <span className="text-xs font-semibold text-sea sm:text-right">{t('closing_soon_view')} <ArrowRight className="ml-1 inline size-3.5" aria-hidden="true" /></span>
            </Link>
          </li>
        ))}
      </ul> : <p className="rounded-xl bg-[#f8fbff] p-5 text-sm text-[#536780]">{t('closing_soon_none')}</p>}
    </section>
  );
}

/* ------------------------------------------------------------------ updates */

export function LatestUpdates({ items }: { items: UpdateItem[] }) {
  const { t } = useLanguage();

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3 border-b border-line pb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#536780]">{t('updates_source')}</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-black text-[#082046]">{t('updates_title')}</h2>
        </div>
        <Link href="/updates" className="inline-flex items-center gap-1 text-xs font-semibold text-teal hover:text-sea">{t('updates_all')} <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
      </div>
      {items.length === 0 && <p className="text-sm text-[#536780]">{t('updates_none')}</p>}
      <ul className="divide-y divide-line">
        {items.map((u) => (
          <li key={u.id} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:gap-4 transition-colors hover:bg-white/60 rounded-xl px-2">
            <span className="w-20 shrink-0 text-xs text-[#536780]">{formatDate(u.date)}</span>
            <div className="shrink-0">
              <Badge tone={u.kind === 'result' || u.kind === 'admit_card' ? 'celadon' : 'tea'} className="whitespace-nowrap font-semibold">
                {UPDATE_LABEL[u.kind]}
              </Badge>
            </div>
            <span className="min-w-0 flex-1 text-sm font-medium text-teal leading-snug">{u.title}</span>
            <span className="shrink-0 text-xs text-[#536780] sm:text-right max-w-[280px] truncate">{u.organization}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CareerPromo() {
  const { t } = useLanguage();
  const links: [string, string][] = [
    [t('career_link_explore'), '/career'],
    [t('career_link_courses'), '/career/courses'],
    [t('career_link_colleges'), '/career/colleges'],
    [t('career_link_roadmaps'), '/career/roadmaps'],
    [t('career_link_skills'), '/career/skills'],
    [t('career_link_guidance'), '/career/guidance'],
  ];
  return (
    <section className="grid gap-6 border-y border-line bg-[#f8fbff] py-8 md:grid-cols-[minmax(0,1fr)_1.2fr] md:items-center">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-sea">{t('career_promo_tag')}</p>
        <h2 className="mt-2 max-w-sm text-2xl font-bold leading-tight text-teal">{t('career_promo_title')}</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[#536780]">{t('career_promo_desc')}</p>
        <Link href="/career" className={buttonClass({ className: 'mt-4' })}>{t('career_promo_btn')} <ArrowRight aria-hidden="true" /></Link>
      </div>
      <nav aria-label="Career resources" className="grid grid-cols-2 gap-x-6 sm:grid-cols-3">
        {links.map(([label, href]) => <Link key={href} href={href} className="border-b border-line py-3 text-sm font-semibold text-teal hover:text-sea">{label}</Link>)}
      </nav>
    </section>
  );
}

/* ------------------------------------------------------------------ calendar */

const pad = (n: number) => String(n).padStart(2, '0');

export function DeadlineCalendar({ deadlines }: { deadlines: OpportunityCard[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startPad = (new Date(year, month, 1).getDay() + 6) % 7; // weeks start on Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const byDate = new Map<string, OpportunityCard[]>();
  for (const d of deadlines) {
    if (d.last_date) byDate.set(d.last_date, [...(byDate.get(d.last_date) ?? []), d]);
  }
  const cells: (number | null)[] = [...Array(startPad).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <Card className="p-5">
      <SectionTitle
        title="Deadline calendar"
        action={<Badge tone="tea">{now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Badge>}
      />
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="py-1 font-bold text-teal/80">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`pad-${i}`} />;
          const key = `${year}-${pad(month + 1)}-${pad(day)}`;
          const due = byDate.get(key);
          const isToday = day === now.getDate();
          return (
            <span
              key={key}
              title={due?.map((d) => d.title).join(', ')}
              className={cn(
                'relative grid aspect-square place-items-center rounded-full text-[13px] font-semibold',
                due ? 'bg-teal text-cream shadow-clay' : 'text-teal',
                isToday && !due && 'ring-2 ring-sea',
              )}
            >
              {day}
              {due && <span className="absolute bottom-1 size-1 rounded-full bg-celadon" aria-hidden="true" />}
            </span>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-teal/80">
        <span className="size-3 rounded-full bg-teal" aria-hidden="true" /> Last date ·
        <span className="size-3 rounded-full ring-2 ring-sea" aria-hidden="true" /> Today
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------------ side cards */

export function ProfileStrength() {
  const steps = ['Personal details', 'Education', 'Category & state', 'Career interests'];
  return (
    <Card tone="celadon" className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-teal">Profile strength</span>
        <Badge tone="celadon">60%</Badge>
      </div>
      <p className="mt-1 text-xs text-[#536780]">Add your education to unlock instant eligibility checks.</p>
      <div className="mt-3 space-y-1.5">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 text-xs">
            {i < 2 ? (
              <CircleCheck className="size-3.5 text-sea" aria-hidden="true" />
            ) : (
              <Circle className="size-3.5 text-[#536780]" aria-hidden="true" />
            )}
            <span className={i < 2 ? 'text-teal' : 'text-[#536780]'}>{s}</span>
          </div>
        ))}
      </div>
      <Link href="/profile" className={buttonClass({ variant: 'secondary', size: 'sm', className: 'mt-4 w-full' })}>
        Complete profile
      </Link>
    </Card>
  );
}

export function MiniList({ items }: { items: OpportunityCard[] }) {
  return (
    <ul className="divide-y divide-line text-xs">
      {items.slice(0, 4).map((item) => (
        <li key={item.slug} className="py-2.5">
          <Link href={`${TYPE_META[item.type].base}/${item.slug}`} className="block hover:text-sea">
            <span className="font-semibold text-teal">{item.title}</span>
            <span className="mt-0.5 flex items-center justify-between text-[#536780]">
              <span>{item.organization}</span>
              {item.days_left != null && <span>{item.days_left}d left</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SavedShortcuts({ items }: { items?: OpportunityCard[] }) {
  return (
    <Card className="p-5">
      <SectionTitle
        title={
          <span className="flex items-center gap-2">
            <Bookmark className="size-4 text-sea" aria-hidden="true" /> Saved items
          </span>
        }
        action={
          items?.length ? (
            <Link href="/saved" className="text-xs font-semibold text-sea">
              View all ({items.length})
            </Link>
          ) : undefined
        }
      />
      {items?.length ? (
        <MiniList items={items} />
      ) : (
        <EmptyState
          icon={<Bookmark className="size-5" />}
          title="No saved items yet"
          text="Save jobs, exams and scholarships to get reminders before the last date."
          action={
            items ? undefined : (
              <Link href="/login" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                Log in to save
              </Link>
            )
          }
          className="py-6"
        />
      )}
    </Card>
  );
}

export function RecentlyViewed({ items }: { items: OpportunityCard[] }) {
  if (items.length === 0) return null;
  return (
    <Card className="p-5">
      <SectionTitle
        title={
          <span className="flex items-center gap-2">
            <History className="size-4" aria-hidden="true" /> Recently viewed
          </span>
        }
      />
      <MiniList items={items} />
    </Card>
  );
}

export function AssistancePromo() {
  const { t } = useLanguage();
  return (
    <Card tone="tea" className="p-5">
      <HandHelping className="size-6" aria-hidden="true" />
      <p className="mt-2 font-bold">{t('assistance_need_help')}</p>
      <p className="mt-0.5 text-sm">{t('assistance_desc')}</p>
      <div className="mt-3 flex -space-x-2">
        {['MeeSeva', 'CSC Centre', 'Sai Browsing', 'Typing Point'].map((n) => (
          <Avatar key={n} name={n} />
        ))}
      </div>
      <Link href="/assistance" className={buttonClass({ variant: 'primary', size: 'sm', className: 'mt-4' })}>
        {t('assistance_find_btn')} <ArrowRight aria-hidden="true" />
      </Link>
    </Card>
  );
}

export function TrustNote() {
  const { t } = useLanguage();
  const notes = [
    t('trust_official_links'),
    t('trust_no_invented'),
    t('trust_verified_date'),
    t('trust_private_docs'),
  ];
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border border-[#d5e1ef] bg-[#f8fbff] px-6 py-4 text-xs font-medium text-teal shadow-xs">
      {notes.map((item) => (
        <span key={item} className="flex items-center gap-2 whitespace-nowrap">
          <CircleCheck className="size-4 shrink-0 text-sea" aria-hidden="true" />
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}
