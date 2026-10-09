import type { CourseDetail } from '@applyfields/types';
import { Badge, buttonClass, Card, EmptyState, PageHeader } from '@applyfields/ui';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Layers,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { apiGet } from '@/lib/api';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connection();

  const course = await apiGet<CourseDetail>(`/career/courses/${slug}`);
  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Back button */}
      <div>
        <Link
          href="/career/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal/70 hover:text-teal"
        >
          <ArrowLeft className="size-3.5" /> Back to courses
        </Link>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-line/60 bg-cream/40 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="teal" className="text-xs uppercase">
            {course.level}
          </Badge>
          {course.stream && (
            <Badge tone="tea" className="text-xs">
              {course.stream}
            </Badge>
          )}
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-teal sm:text-3xl">
          {course.name}
        </h1>
        {course.short_name && (
          <p className="mt-1 font-mono text-xs font-semibold text-teal/60">
            {course.short_name}
          </p>
        )}

        <p className="mt-3 max-w-3xl text-xs sm:text-sm text-teal/80 leading-relaxed">
          {course.description}
        </p>

        {/* Quick Facts Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-line/60 pt-6">
          <div className="rounded-2xl bg-canvas p-3.5 border border-line/60">
            <span className="text-[11px] font-medium text-teal/70">Typical Duration</span>
            <p className="mt-0.5 font-bold text-teal text-sm sm:text-base">
              {course.duration_months ? `${Math.round(course.duration_months / 12)} Years` : 'Self-paced'}
            </p>
          </div>
          <div className="rounded-2xl bg-canvas p-3.5 border border-line/60">
            <span className="text-[11px] font-medium text-teal/70">Minimum Qualification</span>
            <p className="mt-0.5 font-bold text-teal text-sm sm:text-base">
              {course.min_qualification?.toUpperCase() || '12th Standard'}
            </p>
          </div>
          <div className="rounded-2xl bg-canvas p-3.5 border border-line/60">
            <span className="text-[11px] font-medium text-teal/70">Offering Colleges</span>
            <p className="mt-0.5 font-bold text-teal text-sm sm:text-base">
              {course.institutions.length} Institutions
            </p>
          </div>
          <div className="rounded-2xl bg-canvas p-3.5 border border-line/60">
            <span className="text-[11px] font-medium text-teal/70">Qualifying Careers</span>
            <p className="mt-0.5 font-bold text-teal text-sm sm:text-base">
              {course.careers.length} Pathways
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Eligibility, Skills, Colleges */}
        <div className="space-y-8 lg:col-span-2">
          {/* Eligibility Section */}
          <Card className="p-6">
            <div className="flex items-center gap-2 text-teal">
              <ShieldCheck className="size-5" />
              <h2 className="text-base font-bold">Eligibility & Admission Requirements</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-teal/85 sm:text-sm">
              {course.eligibility_text || 'Standard qualifying board examination criteria apply.'}
            </p>
          </Card>

          {/* Curriculum & Skills Developed */}
          {course.skills_developed && course.skills_developed.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 text-teal">
                <Layers className="size-5" />
                <h2 className="text-base font-bold">Curriculum & Core Skills Developed</h2>
              </div>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {course.skills_developed.map((skill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl bg-canvas p-2.5 border border-line/60 text-xs font-semibold text-teal"
                  >
                    <CheckCircle2 className="size-4 text-celadon shrink-0" />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Offering Colleges */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal">
                <Building className="size-5" />
                <h2 className="text-lg font-bold">Top Colleges Offering This Degree</h2>
              </div>
              <Link
                href="/career/colleges"
                className="text-xs font-semibold text-teal hover:underline"
              >
                Browse all colleges →
              </Link>
            </div>

            {course.institutions.length === 0 ? (
              <p className="text-xs text-teal/70">No affiliated institutions listed yet.</p>
            ) : (
              <div className="space-y-3">
                {course.institutions.map((inst) => (
                  <Card key={inst.id} className="p-5 hover:border-teal/40 transition-all">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <Link
                          href={`/career/colleges/${inst.slug}`}
                          className="font-bold text-teal hover:underline text-sm sm:text-base"
                        >
                          {inst.name}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 text-xs text-teal/70">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3 text-teal/50" /> {inst.city}, {inst.state_code}
                          </span>
                          {inst.seats && <span>· {inst.seats} Total Seats</span>}
                        </div>
                        {inst.admission_process && (
                          <p className="mt-2 text-xs text-teal/80">
                            <strong className="text-teal font-semibold">Admission:</strong> {inst.admission_process}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <span className="text-xs font-bold text-teal">
                          {inst.fees_text || 'Subsidized Fee'}
                        </span>
                        <div className="mt-2">
                          <Link
                            href={`/career/colleges/${inst.slug}`}
                            className={buttonClass({ variant: 'secondary', size: 'sm', className: 'gap-1' })}
                          >
                            College Details <ArrowRight className="size-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Careers & Entrance Exams */}
        <div className="space-y-6">
          {/* Target Careers */}
          <Card className="p-6">
            <div className="flex items-center gap-2 text-teal">
              <Briefcase className="size-5" />
              <h3 className="text-base font-bold">Careers This Qualifies For</h3>
            </div>
            <p className="mt-1 text-xs text-teal/70">
              High-growth professional roles directly aligned with this curriculum:
            </p>

            <div className="mt-4 space-y-2">
              {course.careers.length === 0 ? (
                <p className="text-xs text-teal/60 py-2">General professional career pathways.</p>
              ) : (
                course.careers.map((c) => (
                  <Link
                    key={c.id}
                    href={`/career/${c.slug}`}
                    className="flex items-center justify-between rounded-xl bg-canvas p-3 border border-line/60 text-xs font-bold text-teal hover:border-teal/40 hover:bg-cream/60 transition-all"
                  >
                    <span>{c.title}</span>
                    <ArrowRight className="size-3.5 text-teal/60" />
                  </Link>
                ))
              )}
            </div>
          </Card>

          {/* Entrance Exams */}
          {course.exams && course.exams.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 text-teal">
                <GraduationCap className="size-5" />
                <h3 className="text-base font-bold">Accepted Entrance Exams</h3>
              </div>
              <p className="mt-1 text-xs text-teal/70">
                Official competitive exams accepted for admission to this course:
              </p>

              <div className="mt-4 space-y-2">
                {course.exams.map((e) => (
                  <Link
                    key={e.id}
                    href={`/exams/${e.slug}`}
                    className="flex items-center justify-between rounded-xl bg-canvas p-3 border border-line/60 text-xs font-bold text-teal hover:border-teal/40 transition-all"
                  >
                    <span>{e.title}</span>
                    <Badge tone="tea" className="text-[10px]">
                      Apply Mode Exam
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Career Outcomes Text */}
          {course.career_outcomes && (
            <Card className="p-6 bg-tea/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal/70">
                Industry Job Titles
              </h3>
              <p className="mt-2 text-xs font-medium text-teal leading-relaxed">
                {course.career_outcomes}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
