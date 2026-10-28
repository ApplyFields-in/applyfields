import type { CareerDetail } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, IconTile, PageHeader } from '@applyfields/ui';
import {
  ArrowLeft,
  ArrowUpRight,
  BookMarked,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  Laptop,
  Sparkles,
  TrendingUp,
  Video,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { apiGet } from '@/lib/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const career = await apiGet<CareerDetail>(`/career/${slug}`);
  if (!career) return { title: 'Career Not Found' };
  return {
    title: `${career.title} — Career Pathway & Learning Resources`,
    description: career.summary,
  };
}

export default async function CareerDetailPage({ params }: PageProps) {
  const { slug } = await params;
  await connection();

  const career = await apiGet<CareerDetail>(`/career/${slug}`);
  if (!career) notFound();

  // Group learning resources by type (platforms, books, videos)
  const platforms = career.learning_resources.filter((r) => r.type === 'platform');
  const books = career.learning_resources.filter((r) => r.type === 'book');
  const videos = career.learning_resources.filter((r) => r.type === 'video');

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link href="/career" className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal/80 hover:text-teal hover:underline">
          <ArrowLeft className="size-3.5" /> Back to all careers
        </Link>
      </div>

      {/* Hero Header */}
      <div className="rounded-card bg-cream p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge tone="teal">{career.category_name}</Badge>
          {career.outlook_text && (
            <Badge tone="celadon">
              <TrendingUp className="size-3" /> {career.outlook_text}
            </Badge>
          )}
          {career.views_count > 0 && (
            <span className="text-xs text-teal/60">👁️ {career.views_count} views</span>
          )}
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-teal sm:text-4xl">{career.title}</h1>
        <p className="mt-3 max-w-3xl text-base text-teal/90 sm:text-lg">{career.summary}</p>

        {/* Quick Facts Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 border-t border-line/60 pt-6">
          <div className="rounded-2xl bg-tea/40 p-3.5">
            <span className="text-xs font-medium text-teal/70">Estimated Salary</span>
            <p className="mt-1 font-bold text-teal text-sm sm:text-base">{career.salary_text || 'Industry standard'}</p>
          </div>
          <div className="rounded-2xl bg-tea/40 p-3.5">
            <span className="text-xs font-medium text-teal/70">Entry Education</span>
            <p className="mt-1 font-bold text-teal text-sm sm:text-base">{career.education_required}</p>
          </div>
          <div className="rounded-2xl bg-tea/40 p-3.5">
            <span className="text-xs font-medium text-teal/70">Learning Resources</span>
            <p className="mt-1 font-bold text-teal text-sm sm:text-base">{career.learning_resources.length} Books/Videos</p>
          </div>
          <div className="rounded-2xl bg-tea/40 p-3.5">
            <span className="text-xs font-medium text-teal/70">Pathway Steps</span>
            <p className="mt-1 font-bold text-teal text-sm sm:text-base">{career.pathway_steps.length} Milestones</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Columns: Overview, Pathway & Learning Resources */}
        <div className="space-y-8 lg:col-span-2">
          {/* 1. What It Involves */}
          {career.what_it_involves && (
            <section className="rounded-card bg-cream p-6 shadow-card sm:p-7">
              <h2 className="flex items-center gap-2 text-xl font-bold text-teal">
                <Briefcase className="size-5 text-teal" /> What It Involves
              </h2>
              <div className="mt-4 text-sm leading-relaxed text-teal/90 space-y-3">
                <p>{career.what_it_involves}</p>
              </div>

              {career.learning_areas && career.learning_areas.length > 0 && (
                <div className="mt-5 border-t border-line/60 pt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal/70">Key Focus Areas</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {career.learning_areas.map((area) => (
                      <Badge key={area} tone="tea">{area}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 2. Step-by-Step Educational Pathway */}
          {career.pathway_steps && career.pathway_steps.length > 0 && (
            <section id="pathway-steps" className="scroll-mt-6 rounded-card bg-cream p-6 shadow-card sm:p-7">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold text-teal">
                  <Compass className="size-5 text-teal" /> Step-by-Step Education Pathway
                </h2>
                <Badge tone="tea">{career.pathway_steps.length} Stages</Badge>
              </div>
              <p className="mt-1 text-xs text-teal/70">Recommended milestones from high school to professional career launch.</p>

              <div className="mt-6 space-y-4">
                {career.pathway_steps.map((st, i) => (
                  <div key={st.step || i} className="relative flex items-start gap-4 rounded-2xl bg-tea/30 p-4 transition-colors hover:bg-tea/50">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal text-xs font-bold text-cream shadow-clay">
                      {st.step || i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-bold text-teal text-sm sm:text-base">{st.title}</h3>
                        {st.duration && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-teal/70">
                            <Clock className="size-3" /> {st.duration}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs sm:text-sm text-teal/80 leading-normal">{st.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. SUGGESTED LEARNING RESOURCES (Platforms, Books, Videos to watch) */}
          <section className="rounded-card bg-cream p-6 shadow-card sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-teal">
                  <Sparkles className="size-5 text-teal" /> Suggested Learning Resources
                </h2>
                <p className="mt-1 text-xs text-teal/70">Hand-curated books, video lectures, and practice platforms for this career path.</p>
              </div>
              <Badge tone="celadon">{career.learning_resources.length} Resources</Badge>
            </div>

            <div className="mt-6 space-y-6">
              {/* Videos & Channels */}
              {videos.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal/70 mb-3">
                    <Video className="size-4 text-teal" /> Recommended Videos & Channels to Watch
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {videos.map((vid, idx) => (
                      <div key={idx} className="flex flex-col justify-between rounded-2xl bg-tea/40 p-4 border border-line/40">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-teal text-sm leading-snug">{vid.title}</h4>
                            <Badge tone="celadon" className="text-[10px]">Free Video</Badge>
                          </div>
                          {vid.provider_or_author && (
                            <p className="mt-1 text-xs font-medium text-teal/70">Channel: {vid.provider_or_author}</p>
                          )}
                          {vid.description && (
                            <p className="mt-2 text-xs text-teal/80 leading-relaxed">{vid.description}</p>
                          )}
                        </div>
                        {vid.url && (
                          <a
                            href={vid.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal hover:underline"
                          >
                            Watch on YouTube <ArrowUpRight className="size-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Books */}
              {books.length > 0 && (
                <div className="border-t border-line/60 pt-5">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal/70 mb-3">
                    <BookMarked className="size-4 text-teal" /> Recommended Books to Read
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {books.map((bk, idx) => (
                      <div key={idx} className="flex flex-col justify-between rounded-2xl bg-tea/40 p-4 border border-line/40">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-teal text-sm leading-snug">{bk.title}</h4>
                            <Badge tone="outline" className="text-[10px]">Book</Badge>
                          </div>
                          {bk.provider_or_author && (
                            <p className="mt-1 text-xs font-medium text-teal/70">Author: {bk.provider_or_author}</p>
                          )}
                          {bk.description && (
                            <p className="mt-2 text-xs text-teal/80 leading-relaxed">{bk.description}</p>
                          )}
                        </div>
                        {bk.url && (
                          <a
                            href={bk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal hover:underline"
                          >
                            View Book Details <ArrowUpRight className="size-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Online Platforms & Tools */}
              {platforms.length > 0 && (
                <div className="border-t border-line/60 pt-5">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal/70 mb-3">
                    <Laptop className="size-4 text-teal" /> Suggested Platforms & Portals
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {platforms.map((plat, idx) => (
                      <div key={idx} className="flex flex-col justify-between rounded-2xl bg-tea/40 p-4 border border-line/40">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-teal text-sm leading-snug">{plat.title}</h4>
                            <Badge tone={plat.is_free ? 'celadon' : 'tea'} className="text-[10px]">
                              {plat.is_free ? 'Free Platform' : 'Platform'}
                            </Badge>
                          </div>
                          {plat.provider_or_author && (
                            <p className="mt-1 text-xs font-medium text-teal/70">Provider: {plat.provider_or_author}</p>
                          )}
                          {plat.description && (
                            <p className="mt-2 text-xs text-teal/80 leading-relaxed">{plat.description}</p>
                          )}
                        </div>
                        {plat.url && (
                          <a
                            href={plat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal hover:underline"
                          >
                            Open Portal <ArrowUpRight className="size-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Skills, Pros/Cons & Linked Apply Mode Opportunities */}
        <div className="space-y-6">
          {/* Required Skills */}
          {career.skills && career.skills.length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-teal text-base">Key Skills & Competencies</h3>
              <p className="mt-1 text-xs text-teal/70">Abilities required to thrive in this role.</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {career.skills.map((sk) => (
                  <Badge key={sk} tone="tea" className="text-xs py-1">
                    {sk}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Pros & Cons */}
          {(career.pros.length > 0 || career.cons.length > 0) && (
            <Card className="p-5 space-y-4">
              <h3 className="font-bold text-teal text-base">Career Realities</h3>
              {career.pros.length > 0 && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal/70">What People Love</span>
                  <ul className="mt-2 space-y-1.5">
                    {career.pros.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-teal/90">
                        <CheckCircle2 className="size-3.5 shrink-0 text-teal mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {career.cons.length > 0 && (
                <div className="border-t border-line/60 pt-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal/70">Challenges to Expect</span>
                  <ul className="mt-2 space-y-1.5">
                    {career.cons.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-teal/90">
                        <XCircle className="size-3.5 shrink-0 text-teal/60 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* Linked Opportunities from Apply Mode */}
          {career.linked_opportunities && career.linked_opportunities.length > 0 && (
            <Card className="p-5 bg-teal text-cream shadow-card">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-celadon" />
                <h3 className="font-bold text-base text-cream">Apply Mode Connections</h3>
              </div>
              <p className="mt-1 text-xs text-cream/80">
                Live entrance exams, government jobs, and scholarships linked to this career.
              </p>
              <div className="mt-4 space-y-2">
                {career.linked_opportunities.map((opp, idx) => (
                  <Link
                    key={idx}
                    href={opp.url}
                    className="flex items-center justify-between rounded-xl bg-cream/15 p-3 text-xs text-cream hover:bg-cream/25 transition-colors"
                  >
                    <div>
                      <span className="block font-semibold">{opp.title}</span>
                      <span className="text-[10px] text-cream/70 uppercase">{opp.type}</span>
                    </div>
                    <ArrowUpRight className="size-3.5 text-celadon" />
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* "Next Step" Sticky CTA Bar */}
      {career.pathway_steps && career.pathway_steps.length > 0 && (
        <div className="fixed bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 w-auto sm:min-w-[440px] max-w-xl">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-tea/30 bg-teal/95 px-4 py-3 text-cream shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-celadon text-teal text-xs font-bold shadow-xs">
                {career.pathway_steps[0].step || 1}
              </span>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-celadon block">
                  Next Step in Pathway
                </span>
                <p className="text-xs font-bold text-cream truncate">
                  {career.pathway_steps[0].title}
                </p>
              </div>
            </div>

            <a
              href="#pathway-steps"
              className="clay-press shrink-0 rounded-xl bg-celadon px-3.5 py-1.5 text-xs font-extrabold text-teal shadow-clay hover:bg-celadon/90 flex items-center gap-1.5"
            >
              <span>Explore Step</span>
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
