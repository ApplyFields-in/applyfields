import type { CareerCategory, CareerSummary } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, EmptyState, IconTile, PageHeader } from '@applyfields/ui';
import {
  BookOpen,
  Briefcase,
  Code,
  Compass,
  GraduationCap,
  Landmark,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { apiGet } from '@/lib/api';

export const metadata = {
  title: 'Explore Careers & Pathways',
  description: 'Explore career options, step-by-step education pathways, salary insights, and recommended learning resources.',
};

const CATEGORY_ICONS: Record<string, any> = {
  Code,
  Landmark,
  ShieldCheck,
  Stethoscope,
  Coins: TrendingUp,
  Plane,
  Briefcase,
};

interface CareerPageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function CareerPage({ searchParams }: CareerPageProps) {
  const sp = await searchParams;
  const currentCategory = sp.category || '';
  const searchQ = sp.q || '';

  await connection();

  const [categories, careers] = await Promise.all([
    apiGet<CareerCategory[]>('/career/categories'),
    apiGet<CareerSummary[]>(
      `/career?${new URLSearchParams({
        ...(currentCategory ? { category: currentCategory } : {}),
        ...(searchQ ? { q: searchQ } : {}),
      })}`,
    ),
  ]);

  const catList = categories || [];
  const careerList = careers || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader
          eyebrow="Career Mode (v3)"
          title="Explore Careers & Pathways"
          description="Discover career trajectories, educational milestones, and suggested learning resources (platforms, books, and videos)."
          icon={<Compass />}
        />
        <div className="shrink-0 flex items-center gap-2">
          <Link
            href="/career/guidance"
            className={buttonClass({ variant: 'secondary', size: 'md', className: 'gap-2' })}
          >
            <Sparkles className="size-4" /> AI Guide
          </Link>
          <Link
            href="/career/profile"
            className={buttonClass({ variant: 'primary', size: 'md', className: 'gap-2 shadow-clay' })}
          >
            <UserCheck className="size-4" /> My Profile
          </Link>
        </div>
      </div>

      {/* Career Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line/60 pb-3 text-xs font-bold">
        <Link
          href="/career"
          className="rounded-xl bg-teal px-3.5 py-1.5 text-cream shadow-sm"
        >
          All Careers
        </Link>
        <Link
          href="/career/roadmaps"
          className="rounded-xl bg-cream px-3.5 py-1.5 text-teal hover:bg-tea border border-line/60 transition-colors"
        >
          Roadmaps
        </Link>
        <Link
          href="/career/courses"
          className="rounded-xl bg-cream px-3.5 py-1.5 text-teal hover:bg-tea border border-line/60 transition-colors"
        >
          Courses & Degrees
        </Link>
        <Link
          href="/career/colleges"
          className="rounded-xl bg-cream px-3.5 py-1.5 text-teal hover:bg-tea border border-line/60 transition-colors"
        >
          Colleges & Universities
        </Link>
        <Link
          href="/career/guidance"
          className="rounded-xl bg-cream px-3.5 py-1.5 text-teal hover:bg-tea border border-line/60 transition-colors flex items-center gap-1"
        >
          <Sparkles className="size-3 text-celadon" /> AI Advisor
        </Link>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        <Link
          href="/career"
          className={cn(
            'clay-press rounded-full px-4 py-2 text-xs font-semibold shadow-clay transition-colors',
            !currentCategory ? 'bg-teal text-cream' : 'bg-cream text-teal hover:bg-tea',
          )}
        >
          All Domains
        </Link>
        {catList.map((cat) => {
          const IconComp = CATEGORY_ICONS[cat.icon] || Briefcase;
          const isActive = currentCategory === cat.slug;
          return (
            <Link
              key={cat.slug}
              href={`/career?category=${cat.slug}`}
              className={cn(
                'clay-press flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold shadow-clay transition-colors',
                isActive ? 'bg-teal text-cream' : 'bg-cream text-teal hover:bg-tea',
              )}
            >
              <IconComp className="size-3.5" />
              <span>{cat.name}</span>
              {typeof cat.careers_count === 'number' && (
                <span className={cn('ml-1 rounded-full px-1.5 py-0.2 text-[10px]', isActive ? 'bg-cream/20 text-cream' : 'bg-tea text-teal')}>
                  {cat.careers_count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Search Filter Bar */}
      <form action="/career" className="relative max-w-lg">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal/70" />
        <input
          name="q"
          type="search"
          defaultValue={searchQ}
          placeholder="Search careers, roles, or skills (e.g. Software, Pilot, Doctor)…"
          className="h-11 w-full rounded-full bg-cream pl-10 pr-4 text-sm shadow-pressed outline-none placeholder:text-teal/70 focus:shadow-clay"
        />
        {currentCategory && <input type="hidden" name="category" value={currentCategory} />}
      </form>

      {/* Career Cards Grid */}
      {careerList.length === 0 ? (
        <EmptyState
          icon={<Compass />}
          title="No careers found"
          text="Try selecting another domain or clearing your search term."
          action={
            <Link href="/career" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              View all careers
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
          {careerList.map((c) => {
            const IconComp = CATEGORY_ICONS[c.category_icon] || Briefcase;
            return (
              <Card key={c.slug} interactive className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <IconTile tone="teal">
                        <IconComp className="size-5" />
                      </IconTile>
                      <div>
                        <span className="text-xs font-semibold text-teal/70">{c.category_name}</span>
                        <Link href={`/career/${c.slug}`} className="block font-bold text-teal hover:underline text-lg">
                          {c.title}
                        </Link>
                      </div>
                    </div>
                    {c.outlook_text && (
                      <Badge tone="celadon" className="shrink-0">
                        <TrendingUp className="size-3" /> {c.outlook_text}
                      </Badge>
                    )}
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-teal/90">{c.summary}</p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {c.salary_text && (
                      <Badge tone="tea">
                        💰 {c.salary_text}
                      </Badge>
                    )}
                    <Badge tone="outline">
                      <GraduationCap className="size-3" /> {c.education_required}
                    </Badge>
                    {c.resources_count > 0 && (
                      <Badge tone="cream" className="text-teal font-semibold">
                        <BookOpen className="size-3 text-teal" /> {c.resources_count} Learning resources
                      </Badge>
                    )}
                  </div>

                  {c.skills && c.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {c.skills.slice(0, 4).map((sk) => (
                        <span key={sk} className="rounded-md bg-tea/50 px-2 py-0.5 text-[11px] font-medium text-teal">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 border-t border-line/60 pt-4 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-teal/70">
                    <Sparkles className="size-3.5 text-teal" /> Pathways & Books/Videos
                  </span>
                  <Link
                    href={`/career/${c.slug}`}
                    className={buttonClass({ variant: 'primary', size: 'sm', className: 'rounded-full px-4' })}
                  >
                    Explore pathway →
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
