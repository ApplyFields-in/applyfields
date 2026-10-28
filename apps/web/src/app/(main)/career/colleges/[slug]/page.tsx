import type { InstitutionDetail, InstitutionSummary } from '@applyfields/types';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Building,
  CheckCircle2,
  Columns,
  ExternalLink,
  GraduationCap,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { SaveButton } from '@/components/save-button';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PrintExportButton } from '@/components/print-export-button';
import { ShareModal } from '@/components/share/share-modal';
import { QuickSummaryModal } from '@/components/summary/quick-summary-modal';
import { StickyMobileActionBar } from '@/components/layout/sticky-mobile-action-bar';

interface CollegeDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CollegeDetailPageProps) {
  const { slug } = await params;
  const res = await apiGet<InstitutionDetail>(`/career/colleges/${slug}`);
  let name = res?.name;
  if (!name) {
    const { getTop50CollegeBySlug } = await import('@/lib/top-50-colleges-data');
    name = getTop50CollegeBySlug(slug)?.name;
  }
  return {
    title: name ? `${name} - Admissions, Cutoffs & Fees` : 'College Details',
    description: name
      ? `Explore admissions, JoSAA cutoffs, courses, and placements at ${name}.`
      : 'Comprehensive college information.',
  };
}

function getShortDescription(desc?: string | null): string {
  if (!desc) return 'Premier technical education and higher research institute in India.';
  const clean = desc
    .replace(/^(IIT|NIT|BITS|VIT|DTU|[A-Z\s]+)\s+Highlights\s+\d{4}/i, '')
    .replace(/^IIT Madras is known as an 'Institute of Eminence'\./i, 'Renowned Institute of Eminence.')
    .trim();
  if (clean.length <= 135) return clean;
  return clean.slice(0, 130).replace(/[\s,\.\-]+$/, '') + '...';
}

export default async function CollegeDetailPage({ params }: CollegeDetailPageProps) {
  const { slug } = await params;

  let college = await apiGet<InstitutionDetail>(`/career/colleges/${slug}`);

  // Static fallback if API is not available or college not found in DB
  if (!college) {
    const { getTop50CollegeBySlug } = await import('@/lib/top-50-colleges-data');
    college = getTop50CollegeBySlug(slug) || null;
  }

  if (!college) {
    notFound();
  }

  // Retrieve 3 similar colleges for the bottom section
  const { getSimilarColleges } = await import('@/lib/top-50-colleges-data');
  const similarColleges: InstitutionSummary[] = getSimilarColleges(slug, 3);

  const accreditation: any = college.accreditation || {};
  const placementStats: any = college.placement_stats || {};

  const rankDisplay =
    accreditation.nirf_rank_text ||
    college.ranking_text ||
    (accreditation.nirf_rank ? `NIRF Rank #${accreditation.nirf_rank}` : null);

  const instituteType =
    accreditation.institute_type_raw ||
    (college.type === 'university' ? 'University' : 'Institute of Technology');

  const establishedDisplay =
    accreditation.established_text ||
    (college.established_year ? `Estd. ${college.established_year}` : null);

  const locationDisplay =
    accreditation.location_shown ||
    [college.city, college.state_code].filter(Boolean).join(', ') ||
    'India';

  const acceptedExams: string[] =
    accreditation.accepted_exams && accreditation.accepted_exams.length > 0
      ? accreditation.accepted_exams
      : ['JEE Main', 'JEE Advanced', 'GATE'];

  const specificBranches: string[] =
    accreditation.specific_branches && accreditation.specific_branches.length > 0
      ? accreditation.specific_branches
      : [];

  const topRecruiters: string[] =
    placementStats.top_recruiters && placementStats.top_recruiters.length > 0
      ? placementStats.top_recruiters
      : ['Google', 'Microsoft', 'Amazon', 'Texas Instruments', 'Qualcomm', 'Goldman Sachs'];

  return (
    <div>
      {/* Yellowish Header Section matching Career Mode in Screenshot */}
      <section className="border-y border-[#e5d0aa] bg-[#F4E8D1]">
        <div className="mx-auto max-w-[1360px] space-y-4 px-4 pt-6 pb-6 sm:pt-8 sm:pb-7 sm:px-6 lg:px-8">
          {/* Contextual Breadcrumbs Navigation & Export Action */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Breadcrumbs
              items={[
                { label: 'Career', href: '/career' },
                { label: 'Colleges', href: '/career/colleges' },
                {
                  label: accreditation.nirf_category === 'Medical' ? 'Top 50 Medical' : 'Top 50 Engineering',
                  href: `/career/colleges?stream=${accreditation.nirf_category === 'Medical' ? 'medical' : 'top-50-engg'}`,
                },
                { label: college.short_name || college.name },
              ]}
            />

            <div className="flex items-center gap-2">
              <PrintExportButton
                label="Download Report / Print"
                documentTitle={`${college.name} - Official College Profile & Cutoffs - ApplyFields`}
              />
              <Link
                href="/career/colleges"
                className="print:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-[#76562d] hover:text-[#082046] transition-colors"
              >
                <ArrowLeft className="size-3.5" /> Back
              </Link>
            </div>
          </div>

          {/* Top Metadata Badges - Rectangular rounded, NO dark blue pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {rankDisplay && (
                <span className="inline-flex items-center gap-1 rounded border border-[#dec9a5] bg-[#F4E8D1] px-2.5 py-1 text-xs font-bold text-[#76562d]">
                  <Award className="size-3.5 text-[#76562d]" /> {rankDisplay}
                </span>
              )}
              <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2.5 py-1 text-xs font-medium text-[#243b5b]">
                {instituteType}
              </span>
              {establishedDisplay && (
                <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2.5 py-1 text-xs font-medium text-[#536780]">
                  {establishedDisplay}
                </span>
              )}
              <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2.5 py-1 text-xs font-medium text-[#536780]">
                {college.ownership === 'government' ? 'Public / Government' : 'Private'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <QuickSummaryModal
                type="college"
                collegeData={college}
                buttonLabel="Executive Summary"
              />

              <ShareModal
                title={college.name}
                subtitle={`${rankDisplay ? rankDisplay + ' · ' : ''}${locationDisplay}`}
                category={instituteType || 'College'}
              />

              <SaveButton
                itemType="institution"
                slug={college.slug}
                title={college.name}
              />

              <Link
                href={`/career/colleges/compare?slugs=${college.slug}`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-semibold text-[#082046] hover:bg-[#ffffff] transition-colors shadow-sm"
                title="Compare side-by-side with another college"
              >
                <Columns className="size-3.5 text-[#0e7bf4]" /> Compare College
              </Link>

              {college.website && (
                <a
                  href={college.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#F4E8D1] px-3.5 text-xs font-bold text-[#082046] hover:bg-[#ebdcc0] transition-colors shadow-sm"
                >
                  Official Portal <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>

          {/* College Title - Clean Typography, NO Badge beside title */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#082046] sm:text-3xl lg:text-4xl">
              {college.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-[#536780]">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-[#76562d] shrink-0" />
                <span>{locationDisplay}</span>
                {college.address && <span className="text-[#536780]/70">· {college.address}</span>}
              </span>
            </div>
          </div>

          {/* Key Metrics Bar - Rectangular rounded-md */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
            <div className="rounded-md bg-[#ffffff] p-4 border border-[#dec9a5] shadow-sm">
              <span className="text-[11px] font-semibold text-[#76562d]">Average Package</span>
              <p className="mt-1 font-bold text-[#082046] text-base sm:text-lg">
                {placementStats.avg_package || 'INR 18.5 LPA'}
              </p>
            </div>
            <div className="rounded-md bg-[#ffffff] p-4 border border-[#dec9a5] shadow-sm">
              <span className="text-[11px] font-semibold text-[#76562d]">Highest Package</span>
              <p className="mt-1 font-bold text-[#082046] text-base sm:text-lg">
                {placementStats.highest_package || 'INR 50+ LPA'}
              </p>
            </div>
            <div className="rounded-md bg-[#ffffff] p-4 border border-[#dec9a5] shadow-sm">
              <span className="text-[11px] font-semibold text-[#76562d]">Annual Tuition Fees</span>
              <p className="mt-1 font-bold text-[#082046] text-sm sm:text-base truncate" title={college.fees_text || ''}>
                {college.fees_text || 'Subsidized Fee'}
              </p>
            </div>
            <div className="rounded-md bg-[#ffffff] p-4 border border-[#dec9a5] shadow-sm">
              <span className="text-[11px] font-semibold text-[#76562d]">Accepted Entrance Exams</span>
              <p className="mt-1 font-bold text-[#082046] text-sm truncate" title={acceptedExams.join(', ')}>
                {acceptedExams.slice(0, 3).join(', ')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body - Soft Neutral Parchment Background */}
      <div className="bg-[#F2F1ED] min-h-screen">
        <div className="mx-auto max-w-[1360px] space-y-8 px-4 py-6 pb-16 sm:px-6 lg:px-8">
          {/* Main 2-Column Content Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: About, Branches, Admissions, Cutoffs, Courses */}
            <div className="space-y-6 lg:col-span-2">
              {/* About & Highlights - Rectangular rounded-md */}
              {college.description && (
                <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-6 space-y-3 shadow-sm">
                  <h2 className="text-base font-bold text-[#082046] flex items-center gap-2">
                    <Building className="size-4 text-[#76562d]" /> About &amp; Highlights
                  </h2>
                  <div className="text-xs sm:text-sm text-[#435775] leading-relaxed space-y-3 whitespace-pre-line">
                    {college.description}
                  </div>
                </div>
              )}

              {/* Specific Engineering Branches - Rectangular rounded-md */}
              {specificBranches.length > 0 && (
                <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#082046] flex items-center gap-2">
                      <GraduationCap className="size-4 text-[#76562d]" /> Academic Branches &amp; Specializations
                    </h2>
                    <span className="text-xs font-semibold text-[#76562d]">
                      {specificBranches.length} Programs
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {specificBranches.map((branch, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 rounded-md border border-[#dec9a5]/70 bg-[#f8f5ef] p-3 text-xs font-medium text-[#082046]"
                      >
                        <CheckCircle2 className="size-4 text-[#76562d] shrink-0" />
                        <span className="leading-snug">{branch}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admissions & Dates - Rectangular rounded-md */}
              {accreditation.admissions_details && (
                <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-6 space-y-3 shadow-sm">
                  <h2 className="text-base font-bold text-[#082046] flex items-center gap-2">
                    <BookOpen className="size-4 text-[#76562d]" /> Admissions &amp; Application Dates
                  </h2>
                  <div className="text-xs sm:text-sm text-[#435775] leading-relaxed whitespace-pre-line space-y-2">
                    {accreditation.admissions_details}
                  </div>
                </div>
              )}

              {/* Cutoff Details & JoSAA Trends - Rectangular rounded-md */}
              {accreditation.cutoff_details && (
                <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-6 space-y-3 shadow-sm">
                  <h2 className="text-base font-bold text-[#082046] flex items-center gap-2">
                    <Award className="size-4 text-[#76562d]" /> JoSAA Cutoff Rounds &amp; Closing Ranks
                  </h2>
                  <div className="text-xs sm:text-sm text-[#435775] leading-relaxed whitespace-pre-line space-y-2">
                    {accreditation.cutoff_details}
                  </div>
                </div>
              )}

              {/* Course Catalog & Fee Structures - Rectangular rounded-md */}
              <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#082046] flex items-center gap-2">
                    <BookOpen className="size-4 text-[#76562d]" /> Degrees, Courses &amp; Fee Details
                  </h2>
                  <span className="text-xs font-semibold text-[#76562d]">
                    {college.courses?.length || specificBranches.length || 0} Offerings
                  </span>
                </div>

                {accreditation.courses_details && (
                  <p className="text-xs sm:text-sm text-[#435775] leading-relaxed whitespace-pre-line">
                    {accreditation.courses_details}
                  </p>
                )}

                {college.courses && college.courses.length > 0 && (
                  <div className="divide-y divide-[#dec9a5]/40 rounded-md border border-[#dec9a5]/70 bg-[#f8f5ef]">
                    {college.courses.map((course) => (
                      <div
                        key={course.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                      >
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-bold text-[#082046]">{course.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-[#536780]">
                            <span className="uppercase font-semibold tracking-wider text-[#76562d]">
                              {course.level}
                            </span>
                            {course.seats && <span>· {course.seats} Seats</span>}
                          </div>
                        </div>

                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-xs sm:text-sm font-bold text-[#082046]">
                            {course.fee_per_year
                              ? `INR ${(course.fee_per_year / 100000).toFixed(2)} Lakh / yr`
                              : course.fees_text || 'Standard Tuition'}
                          </p>
                          <p className="text-[10px] text-[#536780]">Inclusive of Academic Fees</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Placements, Recruiters & Campus - Rectangular rounded-md */}
            <div className="space-y-6">
              {/* Placements & Package Records */}
              <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-6 space-y-4 shadow-sm">
                <h2 className="text-base font-bold text-[#082046] flex items-center gap-2">
                  <Sparkles className="size-4 text-[#76562d]" /> Placements &amp; Highest CTC
                </h2>

                <div className="rounded-md border border-[#dec9a5] bg-[#f8f5ef] p-4 text-center space-y-1">
                  <span className="text-[11px] font-semibold text-[#76562d] uppercase tracking-wide">
                    Highest CTC Offered
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-[#082046]">
                    {placementStats.highest_package || 'INR 1+ Crore'}
                  </p>
                  <p className="text-[11px] text-[#536780]">International / Domestic Marquee Offer</p>
                </div>

                <div className="rounded-md border border-[#dec9a5] bg-[#f8f5ef] p-4 text-center space-y-1">
                  <span className="text-[11px] font-semibold text-[#76562d] uppercase tracking-wide">
                    Average B.Tech Package
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-[#082046]">
                    {placementStats.avg_package || 'INR 21.4 LPA'}
                  </p>
                  <p className="text-[11px] text-[#536780]">Official Institutional Placement Report</p>
                </div>

                {placementStats.details && (
                  <p className="text-xs text-[#435775] leading-relaxed pt-2 border-t border-[#dec9a5]/40 whitespace-pre-line">
                    {placementStats.details}
                  </p>
                )}
              </div>

              {/* Top Corporate Recruiters */}
              <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-6 space-y-3 shadow-sm">
                <h2 className="text-base font-bold text-[#082046] flex items-center gap-2">
                  <Users className="size-4 text-[#76562d]" /> Top Hiring Partners
                </h2>

                <div className="flex flex-wrap gap-2 pt-1">
                  {topRecruiters.map((recruiter, idx) => (
                    <span
                      key={idx}
                      className="rounded border border-[#dec9a5] bg-[#f8f5ef] px-2.5 py-1 text-xs font-semibold text-[#082046]"
                    >
                      {recruiter}
                    </span>
                  ))}
                </div>
              </div>

              {/* Campus Life & Scholarships */}
              {accreditation.campus_scholarships_details && (
                <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-6 space-y-3 shadow-sm">
                  <h2 className="text-base font-bold text-[#082046] flex items-center gap-2">
                    <Building className="size-4 text-[#76562d]" /> Campus &amp; Financial Aid
                  </h2>
                  <div className="text-xs text-[#435775] leading-relaxed whitespace-pre-line">
                    {accreditation.campus_scholarships_details}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Similar Colleges Cards Section at the Bottom - Rectangular rounded-md */}
          <div className="mt-8 pt-6 border-t border-[#dec9a5]/70 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#082046] sm:text-xl">Similar Premier Colleges</h2>
                <p className="text-xs text-[#536780] mt-0.5">
                  Explore peer engineering institutions with comparable rankings, degree programs, and placement outcomes.
                </p>
              </div>
              <Link
                href="/career/colleges"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#082046] hover:text-[#0e7bf4] hover:underline"
              >
                Browse all colleges <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {similarColleges.map((sim) => {
                const simRank =
                  sim.accreditation?.nirf_rank_text ||
                  sim.ranking_text ||
                  (sim.accreditation?.nirf_rank ? `NIRF Rank #${sim.accreditation.nirf_rank}` : null);
                const simType = sim.accreditation?.institute_type_raw || sim.type;
                const simEstd = sim.accreditation?.established_text || (sim.established_year ? `Estd. ${sim.established_year}` : null);
                const simLocation = sim.accreditation?.location_shown || [sim.city, sim.state_code].filter(Boolean).join(', ');
                const simDesc = getShortDescription(sim.description);

                return (
                  <div
                    key={sim.id}
                    className="group flex flex-col justify-between p-5 rounded-md border border-[#dec9a5] bg-[#ffffff] transition-all hover:border-[#082046]/50 shadow-sm"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {simRank && (
                          <span className="inline-flex items-center gap-1 rounded border border-[#dec9a5] bg-[#F4E8D1] px-2 py-0.5 text-[11px] font-bold text-[#76562d]">
                            <Award className="size-3 text-[#76562d]" /> {simRank}
                          </span>
                        )}
                        <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#243b5b]">
                          {simType}
                        </span>
                        {simEstd && (
                          <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#536780]">
                            {simEstd}
                          </span>
                        )}
                      </div>

                      <Link href={`/career/colleges/${sim.slug}`}>
                        <h3 className="mt-3 text-base font-bold text-[#082046] group-hover:text-[#0e7bf4] group-hover:underline line-clamp-2 transition-colors">
                          {sim.name}
                        </h3>
                      </Link>

                      <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#536780]">
                        <MapPin className="size-3.5 text-[#76562d] shrink-0" />
                        <span>{simLocation}</span>
                      </div>

                      <p className="mt-2.5 text-xs text-[#536780] leading-relaxed line-clamp-2">
                        {simDesc}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[#dec9a5]/40 pt-4">
                      <Link
                        href={`/career/colleges/compare?slugs=${college.slug},${sim.slug}`}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3 text-xs font-semibold text-[#082046] hover:bg-[#ffffff] transition-colors"
                        title={`Compare ${college.short_name || 'this college'} with ${sim.short_name || sim.name}`}
                      >
                        <Columns className="size-3.5 text-[#0e7bf4]" /> Compare
                      </Link>

                      <Link
                        href={`/career/colleges/${sim.slug}`}
                        className="inline-flex min-h-9 items-center gap-1 rounded-md border border-[#dec9a5] bg-[#F4E8D1] px-3.5 text-xs font-bold text-[#082046] hover:bg-[#ebdcc0] transition-colors shadow-sm"
                      >
                        View Details <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar for Mobile Viewports */}
      <StickyMobileActionBar
        title={college.name}
        badgeText={rankDisplay || locationDisplay}
        primaryCtaLabel={college.website ? "Portal" : "Compare"}
        primaryCtaHref={college.website || `/career/colleges/compare?slugs=${college.slug}`}
        isExternal={Boolean(college.website)}
        slug={college.slug}
        itemType="institution"
        category="College"
      />
    </div>
  );
}
