import type { InstitutionDetail } from '@applyfields/types';
import { Badge, buttonClass, Card } from '@applyfields/ui';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building,
  CheckCircle2,
  Columns,
  ExternalLink,
  GraduationCap,
  MapPin,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { apiGet } from '@/lib/api';
import { SaveButton } from '@/components/save-button';
import { EnquiryDialog } from './enquiry-dialog';

export default async function CollegeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connection();

  const college = await apiGet<InstitutionDetail>(`/career/colleges/${slug}`);
  if (!college) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Back button */}
      <div>
        <Link
          href="/career/colleges"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal/70 hover:text-teal"
        >
          <ArrowLeft className="size-3.5" /> Back to colleges
        </Link>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-line/60 bg-cream/40 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="teal" className="text-xs uppercase">
              {college.type}
            </Badge>
            {college.ranking_text && (
              <Badge tone="tea" className="gap-1 text-xs font-bold">
                <Award className="size-3.5" /> {college.ranking_text}
              </Badge>
            )}
            <Badge tone="tea" className="text-xs">
              {college.ownership === 'government' ? 'Government of India' : college.ownership?.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <SaveButton
              itemType="institution"
              slug={college.slug}
              title={college.name}
            />
            <Link
              href={`/career/colleges/compare?slugs=${college.slug}`}
              className={buttonClass({ variant: 'secondary', size: 'sm', className: 'gap-1.5' })}
            >
              <Columns className="size-3.5" /> Compare with Another College
            </Link>
            {college.website && (
              <a
                href={college.website}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass({ variant: 'primary', size: 'sm', className: 'gap-1 shadow-clay' })}
              >
                Official Website <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-teal sm:text-3xl">
          {college.name}
        </h1>
        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-teal/70">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5 text-teal/50" /> {college.city || college.district || 'India'}{college.state_code ? `, ${college.state_code}` : ''}
          </span>
          {college.established_year && <span>· Est. {college.established_year}</span>}
        </div>

        <p className="mt-3 max-w-3xl text-xs sm:text-sm text-teal/80 leading-relaxed">
          {college.description}
        </p>

        {/* Placement Metrics Highlights */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-line/60 pt-6">
          <div className="rounded-2xl bg-canvas p-3.5 border border-line/60">
            <span className="text-[11px] font-medium text-teal/70">Average Package</span>
            <p className="mt-0.5 font-bold text-teal text-sm sm:text-base">
              {college.placement_stats?.avg_package || 'Industry standard'}
            </p>
          </div>
          <div className="rounded-2xl bg-canvas p-3.5 border border-line/60">
            <span className="text-[11px] font-medium text-teal/70">Highest Package</span>
            <p className="mt-0.5 font-bold text-teal text-sm sm:text-base">
              {college.placement_stats?.highest_package || 'N/A'}
            </p>
          </div>
          <div className="rounded-2xl bg-canvas p-3.5 border border-line/60">
            <span className="text-[11px] font-medium text-teal/70">Tuition Fees</span>
            <p className="mt-0.5 font-bold text-teal text-xs sm:text-sm truncate" title={college.fees_text || ''}>
              {college.fees_text || 'Subsidized'}
            </p>
          </div>
          <div className="rounded-2xl bg-canvas p-3.5 border border-line/60">
            <span className="text-[11px] font-medium text-teal/70">Academic Programs</span>
            <p className="mt-0.5 font-bold text-teal text-sm sm:text-base">
              {college.courses.length} Degrees Offered
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Programs Offered & Campus Facilities */}
        <div className="space-y-8 lg:col-span-2">
          {/* Programs Offered */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-teal">Programmes & Degrees Offered</h2>
            {college.courses.length === 0 ? (
              <p className="text-xs text-teal/70">No specific courses listed yet.</p>
            ) : (
              <div className="space-y-3">
                {college.courses.map((c) => (
                  <Card key={c.id} className="p-5 hover:border-teal/40 transition-all">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <Link
                          href={`/career/courses/${c.slug}`}
                          className="font-bold text-teal hover:underline text-sm sm:text-base"
                        >
                          {c.name}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 text-xs text-teal/70">
                          <span className="uppercase font-semibold">{c.level}</span>
                          {c.seats && <span>· {c.seats} Seats</span>}
                        </div>
                        {c.admission_process && (
                          <p className="mt-2 text-xs text-teal/80">
                            <strong className="text-teal font-semibold">Admission:</strong> {c.admission_process}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <span className="text-xs font-bold text-teal">
                          {c.fees_text || 'Subsidized Fee'}
                        </span>
                        <div className="mt-2">
                          <Link
                            href={`/career/courses/${c.slug}`}
                            className={buttonClass({ variant: 'secondary', size: 'sm', className: 'gap-1' })}
                          >
                            Course Details <ArrowRight className="size-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Campus Facilities */}
          {college.campus_facilities && college.campus_facilities.length > 0 && (
            <Card className="p-6">
              <h2 className="text-base font-bold text-teal">Campus Facilities & Infrastructure</h2>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {college.campus_facilities.map((fac, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl bg-canvas p-2.5 border border-line/60 text-xs font-semibold text-teal"
                  >
                    <CheckCircle2 className="size-4 text-celadon shrink-0" />
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Col: Admission Desk, Top Recruiters & Accreditation */}
        <div className="space-y-6">
          {/* Admission Inquiry Desk */}
          <EnquiryDialog
            collegeSlug={college.slug}
            collegeName={college.name}
            courses={college.courses.map((c) => ({ id: c.id, name: c.name, level: c.level }))}
          />

          {/* Top Recruiters */}
          {college.placement_stats?.top_recruiters && college.placement_stats.top_recruiters.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 text-teal">
                <TrendingUp className="size-5" />
                <h3 className="text-base font-bold">Top Recruiters & Employers</h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {college.placement_stats.top_recruiters.map((rec, rIdx) => (
                  <span
                    key={rIdx}
                    className="rounded-lg bg-canvas px-2.5 py-1 text-xs font-semibold text-teal border border-line/60"
                  >
                    {rec}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Accreditation Box */}
          <Card className="p-6 bg-tea/20">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal/70">
                Accreditations & Recognition
              </h3>
              <Badge tone="teal" className="text-[10px] gap-1 font-bold">
                <CheckCircle2 className="size-3 text-celadon" /> Verified
              </Badge>
            </div>
            <div className="mt-3 space-y-2 text-xs font-semibold text-teal">
              {college.ranking_text && <p className="font-bold">🏆 {college.ranking_text}</p>}
              {college.accreditation?.aicte && (
                <p>🏛️ AICTE Status: {college.accreditation.aicte} {college.accreditation.aicte_id && college.accreditation.aicte_id !== 'Data not given' ? `(ID: ${college.accreditation.aicte_id})` : ''}</p>
              )}
              {college.accreditation?.nba && college.accreditation.nba !== 'Data not given' && (
                <p>⭐ NBA Accreditation: {college.accreditation.nba}</p>
              )}
              {college.accreditation?.naac && college.accreditation.naac !== 'Data not given' && (
                <p>🏅 NAAC Grade: {college.accreditation.naac}</p>
              )}
              <p>📍 {college.city || college.district || 'India'}{college.state_code ? `, ${college.state_code}` : ''} (Central & State Approvals)</p>
            </div>
          </Card>

          {/* Scholarships & Fee Waivers */}
          <Card className="p-6 bg-canvas border border-line/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal/70">
              Scholarships & Fee Concessions
            </h3>
            <p className="mt-2 text-xs text-teal/80 leading-relaxed">
              Standard central and state government fee concessions apply for SC/ST/EWS and merit-cum-need eligible applicants. Contact the admissions desk for specific institutional endowment waivers.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
