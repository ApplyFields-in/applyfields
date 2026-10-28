import type { CourseDetail } from '@applyfields/types';
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
  Route,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { apiGet } from '@/lib/api';
import { TOP_50_COLLEGES } from '@/lib/top-50-colleges-data';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PrintExportButton } from '@/components/print-export-button';

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

const LEVEL_LABELS: Record<string, string> = {
  ug: 'Undergraduate (UG)',
  pg: 'Postgraduate (PG)',
  diploma: 'Polytechnic Diploma',
  certificate: 'Certificate',
  phd: 'Doctoral / Ph.D',
};

const STATIC_COURSES: Record<string, CourseDetail> = {
  mbbs: {
    id: 'c-mbbs',
    slug: 'mbbs',
    name: 'Bachelor of Medicine, Bachelor of Surgery (MBBS)',
    short_name: 'MBBS',
    level: 'ug',
    stream: 'Medicine',
    duration_months: 66,
    min_qualification: '12th',
    description:
      'The Bachelor of Medicine and Bachelor of Surgery (MBBS) is the foundational undergraduate medical degree in India regulated by the National Medical Commission (NMC), preparing physicians for clinical practice, hospital residency, and specialization.',
    eligibility_text:
      'Candidates must have passed 10+2 with Physics, Chemistry, Biology/Biotechnology, and English with a minimum 50% aggregate score (40% for reserved categories). Mandatory qualification in the National Eligibility cum Entrance Test (NEET-UG).',
    skills_developed: [
      'Clinical Diagnosis & Patient Examination',
      'Emergency Medicine & Trauma Resuscitation',
      'Pharmacotherapeutics & Prescription Management',
      'Medical Ethics & Forensic Medicine',
      'Surgical Scrubbing & Minor Procedures',
      'Epidemiology & Community Healthcare',
    ],
    career_outcomes:
      'General Duty Medical Officer (GDMO), Junior Resident Physician, Clinical Research Associate, Healthcare Administrator, Defense Medical Officer.',
    careers: [
      { id: 'cr-doctor', slug: 'doctor', title: 'Physician / Medical Doctor' },
      { id: 'cr-surgeon', slug: 'general-surgeon', title: 'General Surgeon' },
      { id: 'cr-pediatrician', slug: 'pediatrician', title: 'Pediatrician' },
      { id: 'cr-radiologist', slug: 'radiologist', title: 'Clinical Radiologist' },
    ],
    exams: [
      { id: 'ex-neet-ug', slug: 'neet-ug', title: 'NEET-UG (National Eligibility cum Entrance Test)' },
      { id: 'ex-ini-cet', slug: 'ini-cet', title: 'INI-CET (Institutes of National Importance)' },
    ],
    institutions: [
      {
        id: 'b5000000-0000-0000-0000-000000000001',
        slug: 'aiims-new-delhi',
        name: 'All India Institute of Medical Sciences (AIIMS New Delhi)',
        short_name: 'AIIMS New Delhi',
        city: 'New Delhi',
        state_code: 'DL',
        seats: 125,
        fee_per_year: 1628,
        fees_text: 'INR 1,628 (Complete 5.5 Year Course)',
        admission_process: 'Admission via NEET-UG All India 100% merit counseling conducted by MCC.',
      },
      {
        id: 'b5000000-0000-0000-0000-000000000003',
        slug: 'cmc-vellore',
        name: 'Christian Medical College (CMC Vellore)',
        short_name: 'CMC Vellore',
        city: 'Vellore',
        state_code: 'TN',
        seats: 100,
        fee_per_year: 52000,
        fees_text: 'INR 52,000 / yr',
        admission_process: 'Admission via NEET-UG score followed by Tamil Nadu state counseling.',
      },
      {
        id: 'b5000000-0000-0000-0000-000000000004',
        slug: 'jipmer-puducherry',
        name: 'Jawaharlal Institute of Postgraduate Medical Education & Research (JIPMER)',
        short_name: 'JIPMER Puducherry',
        city: 'Puducherry',
        state_code: 'PY',
        seats: 150,
        fee_per_year: 14910,
        fees_text: 'INR 14,910 / yr',
        admission_process: 'Admission through NEET-UG centralized national MCC counseling.',
      },
    ],
    careers_count: 4,
    colleges_count: 50,
  },
  'md-general-medicine': {
    id: 'c-md-medicine',
    slug: 'md-general-medicine',
    name: 'Doctor of Medicine (MD) in General Medicine',
    short_name: 'MD Medicine',
    level: 'pg',
    stream: 'Medicine',
    duration_months: 36,
    min_qualification: 'graduate',
    description:
      'Doctor of Medicine (MD) in General Medicine is an apex 3-year postgraduate clinical residency training doctors in complex adult medicine, inpatient care, ICU resuscitation, and multi-system pathology.',
    eligibility_text:
      'Candidates must hold an NMC-recognized MBBS degree with completion of the mandatory 1-year compulsory rotatory residential internship. Valid qualification in NEET-PG or INI-CET examination is required.',
    skills_developed: [
      'Advanced Internal Medicine Differential Diagnosis',
      'Intensive Care Unit (ICU) & Critical Care Protocol',
      'Infectious Disease Management & Antimicrobial Stewardship',
      'Cardiology, Pulmonology & Nephrology Workups',
      'Clinical Research Methodology & Medical Audits',
    ],
    career_outcomes:
      'Consultant Physician, Chief Medical Superintendent, Critical Care Specialist, Associate Professor of Internal Medicine.',
    careers: [
      { id: 'cr-physician', slug: 'consultant-physician', title: 'Consultant Physician' },
      { id: 'cr-intensivist', slug: 'critical-care-specialist', title: 'Intensivist / Critical Care Specialist' },
      { id: 'cr-cardiologist', slug: 'cardiologist', title: 'Cardiology Fellow' },
    ],
    exams: [
      { id: 'ex-neet-pg', slug: 'neet-pg', title: 'NEET-PG (Postgraduate Medical Entrance Exam)' },
      { id: 'ex-ini-cet', slug: 'ini-cet', title: 'INI-CET Postgraduate Exam' },
    ],
    institutions: [
      {
        id: 'b5000000-0000-0000-0000-000000000001',
        slug: 'aiims-new-delhi',
        name: 'AIIMS New Delhi',
        short_name: 'AIIMS New Delhi',
        city: 'New Delhi',
        state_code: 'DL',
        seats: 24,
        fee_per_year: 3000,
        fees_text: 'INR 3,000 / yr (With Junior Resident Stipend INR 95,000/mo)',
        admission_process: 'Admission via INI-CET merit rank conducted by AIIMS Examination Section.',
      },
      {
        id: 'b5000000-0000-0000-0000-000000000002',
        slug: 'pgimer-chandigarh',
        name: 'Postgraduate Institute of Medical Education and Research (PGIMER)',
        short_name: 'PGIMER Chandigarh',
        city: 'Chandigarh',
        state_code: 'CH',
        seats: 30,
        fee_per_year: 3500,
        fees_text: 'INR 3,500 / yr (Includes Senior Residency Track)',
        admission_process: 'Admission via INI-CET national entrance counseling.',
      },
    ],
    careers_count: 3,
    colleges_count: 45,
  },
};

export async function generateMetadata({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const res = await apiGet<CourseDetail>(`/career/courses/${slug}`);
  const course = res || STATIC_COURSES[slug];
  return {
    title: course ? `${course.name} - Eligibility, Skills & Colleges` : 'Course Details',
    description: course
      ? `Explore duration, eligibility criteria, curriculum skills, top colleges, and careers for ${course.name}.`
      : 'Explore comprehensive degree and course curriculum details.',
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  await connection();

  let course = await apiGet<CourseDetail>(`/career/courses/${slug}`);
  if (!course) {
    course = STATIC_COURSES[slug] || null;
  }

  // If still not found, check if it matches any course offering in TOP_50_COLLEGES
  if (!course) {
    for (const c of TOP_50_COLLEGES) {
      const match = c.courses?.find((courseItem) => courseItem.slug === slug);
      if (match) {
        course = {
          id: match.id,
          slug: match.slug,
          name: match.name,
          short_name: match.short_name,
          level: match.level as any,
          stream: c.accreditation?.nirf_category || 'Higher Education',
          duration_months: match.level === 'pg' ? 24 : 48,
          min_qualification: match.level === 'pg' ? 'graduate' : '12th',
          description: `Specialized curriculum in ${match.name} offered by premier accredited higher education institutions across India.`,
          eligibility_text:
            match.level === 'pg'
              ? 'Recognized Bachelor degree in relevant specialization with minimum 55% aggregate marks and qualifying national entrance test rank.'
              : 'Passed 10+2 standard examination with Physics, Chemistry, Mathematics / Biology with qualifying merit in national entrance examination.',
          skills_developed: [
            'Analytical Problem Solving',
            'Advanced Domain Technical Knowledge',
            'Laboratory & Clinical Protocols',
            'Research Methodology & Data Synthesis',
            'Professional Ethics & Communications',
          ],
          career_outcomes:
            'Professional specialization roles across industry, academia, research institutions, and corporate enterprise.',
          careers: [
            { id: 'cr-spec', slug: 'specialist-engineer', title: `${match.short_name} Professional` },
            { id: 'cr-researcher', slug: 'research-scientist', title: 'Research Scientist' },
          ],
          exams: (c.accreditation?.accepted_exams || ['JEE Main', 'NEET UG']).map((ex: string, idx: number) => ({
            id: `ex-${idx}`,
            slug: ex.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            title: ex,
          })),
          institutions: [
            {
              id: c.id,
              slug: c.slug,
              name: c.name,
              short_name: c.short_name,
              city: c.city,
              state_code: c.state_code,
              seats: match.seats || 60,
              fee_per_year: match.fee_per_year || 150000,
              fees_text: match.fees_text || c.fees_text,
              admission_process: match.admission_process || 'Centralized counseling based on entrance merit rank',
            },
          ],
          careers_count: 2,
          colleges_count: 1,
        };
        break;
      }
    }
  }

  if (!course) {
    notFound();
  }

  const levelLabel = LEVEL_LABELS[course.level] || course.level.toUpperCase();
  const durationText = course.duration_months
    ? `${Math.round(course.duration_months / 12)} Years (${course.duration_months} Months)`
    : 'Duration varies';

  return (
    <div>
      {/* Warm Yellowish Top Section matching Career Mode and Colleges */}
      <section className="border-y border-[#e5d0aa] bg-[#F4E8D1]">
        <div className="mx-auto max-w-[1360px] space-y-4 px-4 pt-6 pb-6 sm:pt-8 sm:pb-7 sm:px-6 lg:px-8">
          {/* Contextual Breadcrumbs Navigation & Export Action */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Breadcrumbs
              items={[
                { label: 'Career', href: '/career' },
                { label: 'Courses', href: '/career/courses' },
                ...(course.stream ? [{ label: course.stream, href: `/career/courses?stream=${encodeURIComponent(course.stream.toLowerCase())}` }] : []),
                { label: course.short_name || course.name },
              ]}
            />

            <div className="flex items-center gap-2">
              <PrintExportButton
                label="Print Curriculum / PDF"
                documentTitle={`${course.name} - Degree Curriculum & Career Pathways - ApplyFields`}
              />
              <Link
                href="/career/courses"
                className="print:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-[#76562d] hover:text-[#082046] transition-colors"
              >
                <ArrowLeft className="size-3.5" /> Back
              </Link>
            </div>
          </div>

          {/* Top Metadata Badges - Rectangular rounded-md */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded border border-[#dec9a5] bg-[#F4E8D1] px-2.5 py-1 text-xs font-bold text-[#76562d]">
                <GraduationCap className="size-3.5 text-[#76562d]" /> {levelLabel}
              </span>
              {course.stream && (
                <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2.5 py-1 text-xs font-medium text-[#243b5b]">
                  {course.stream}
                </span>
              )}
              {course.min_qualification && (
                <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2.5 py-1 text-xs font-medium text-[#536780]">
                  Min. Eligibility: {course.min_qualification.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/career/colleges"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-semibold text-[#082046] hover:bg-[#ffffff] transition-colors shadow-sm"
              >
                <Building className="size-3.5 text-[#0e7bf4]" /> Top Colleges
              </Link>
              <Link
                href="/career"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#F4E8D1] px-3.5 text-xs font-bold text-[#082046] hover:bg-[#ebdcc0] transition-colors shadow-sm"
              >
                <Briefcase className="size-3.5 text-[#76562d]" /> Career Mode
              </Link>
            </div>
          </div>

          {/* Course Title Area - Clean Typography */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#082046] sm:text-3xl lg:text-4xl">
              {course.name}
            </h1>
            {course.short_name && (
              <p className="mt-1 font-mono text-xs font-semibold text-[#536780]">
                {course.short_name}
              </p>
            )}
            {course.description && (
              <p className="mt-2.5 max-w-4xl text-xs sm:text-sm text-[#435775] leading-relaxed">
                {course.description}
              </p>
            )}
          </div>

          {/* Key Metrics Bar - Rectangular rounded-md */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
            <div className="rounded-md bg-[#ffffff] p-4 border border-[#dec9a5] shadow-sm">
              <span className="text-[11px] font-semibold text-[#76562d]">Typical Duration</span>
              <p className="mt-1 font-bold text-[#082046] text-base sm:text-lg">
                {durationText}
              </p>
            </div>
            <div className="rounded-md bg-[#ffffff] p-4 border border-[#dec9a5] shadow-sm">
              <span className="text-[11px] font-semibold text-[#76562d]">Minimum Qualification</span>
              <p className="mt-1 font-bold text-[#082046] text-base sm:text-lg">
                {course.min_qualification?.toUpperCase() || '12th Standard'}
              </p>
            </div>
            <div className="rounded-md bg-[#ffffff] p-4 border border-[#dec9a5] shadow-sm">
              <span className="text-[11px] font-semibold text-[#76562d]">Affiliated Colleges</span>
              <p className="mt-1 font-bold text-[#082046] text-base sm:text-lg">
                {course.institutions.length} Institutions
              </p>
            </div>
            <div className="rounded-md bg-[#ffffff] p-4 border border-[#dec9a5] shadow-sm">
              <span className="text-[11px] font-semibold text-[#76562d]">Qualifying Careers</span>
              <p className="mt-1 font-bold text-[#082046] text-base sm:text-lg">
                {course.careers.length} Pathways
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body - Soft Neutral Parchment Background */}
      <div className="bg-[#F2F1ED] min-h-screen">
        <div className="mx-auto max-w-[1360px] space-y-8 px-4 py-6 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Eligibility, Skills, Offering Colleges */}
            <div className="space-y-6 lg:col-span-2">
              {/* Eligibility Section - Rectangular rounded-md */}
              <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-6 space-y-3 shadow-sm">
                <h2 className="text-base font-bold text-[#082046] flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#76562d]" /> Eligibility &amp; Admission Requirements
                </h2>
                <div className="text-xs sm:text-sm text-[#435775] leading-relaxed whitespace-pre-line">
                  {course.eligibility_text ||
                    'Candidates must fulfill standard state/central board percentages with mandatory qualification in recognized entrance examinations.'}
                </div>
              </div>

              {/* Curriculum & Skills Developed - Rectangular rounded-md */}
              {course.skills_developed && course.skills_developed.length > 0 && (
                <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#082046] flex items-center gap-2">
                      <Layers className="size-4 text-[#76562d]" /> Curriculum &amp; Core Competencies
                    </h2>
                    <span className="text-xs font-semibold text-[#76562d]">
                      {course.skills_developed.length} Core Skills
                    </span>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {course.skills_developed.map((skill, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 rounded-md border border-[#dec9a5]/70 bg-[#f8f5ef] p-3 text-xs font-medium text-[#082046]"
                      >
                        <CheckCircle2 className="size-4 text-[#76562d] shrink-0" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Offering Colleges - Rectangular rounded-md */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#082046] flex items-center gap-2">
                    <Building className="size-4 text-[#76562d]" /> Top Colleges Offering This Degree
                  </h2>
                  <Link
                    href="/career/colleges"
                    className="text-xs font-semibold text-[#0e7bf4] hover:underline"
                  >
                    Browse all colleges →
                  </Link>
                </div>

                {course.institutions.length === 0 ? (
                  <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-6 text-xs text-[#536780]">
                    Verified affiliated institutions for this course will be listed shortly.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {course.institutions.map((inst) => (
                      <div
                        key={inst.id}
                        className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-5 hover:border-[#082046]/50 transition-all shadow-sm"
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                          <div className="space-y-1">
                            <Link
                              href={`/career/colleges/${inst.slug}`}
                              className="font-bold text-[#082046] hover:text-[#0e7bf4] hover:underline text-sm sm:text-base transition-colors"
                            >
                              {inst.name}
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#536780]">
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3 text-[#76562d]" /> {inst.city}, {inst.state_code}
                              </span>
                              {inst.seats && <span>· {inst.seats} Approved Intake</span>}
                            </div>
                            {inst.admission_process && (
                              <p className="mt-2 text-xs text-[#536780] max-w-2xl">
                                <strong className="text-[#082046] font-semibold">Admission:</strong>{' '}
                                {inst.admission_process}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[#dec9a5]/40">
                            <span className="text-xs font-bold text-[#76562d]">
                              {inst.fees_text || 'Subsidized Fee Structure'}
                            </span>
                            <div className="mt-2">
                              <Link
                                href={`/career/colleges/${inst.slug}`}
                                className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[#dec9a5] bg-[#F4E8D1] px-3 text-xs font-bold text-[#082046] hover:bg-[#ebdcc0] transition-colors shadow-sm"
                              >
                                View College <ArrowRight className="size-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Careers & Entrance Exams */}
            <div className="space-y-6">
              {/* Target Careers - Rectangular rounded-md */}
              <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-base font-bold text-[#082046] flex items-center gap-2">
                    <Briefcase className="size-4 text-[#76562d]" /> Careers This Qualifies For
                  </h3>
                  <p className="mt-1 text-xs text-[#536780]">
                    Professional roles directly aligned with this qualification:
                  </p>
                </div>

                <div className="space-y-2">
                  {course.careers.length === 0 ? (
                    <p className="text-xs text-[#536780] py-1">General professional career pathways.</p>
                  ) : (
                    course.careers.map((c) => (
                      <Link
                        key={c.id}
                        href={`/career/${c.slug}`}
                        className="flex items-center justify-between rounded-md border border-[#dec9a5]/70 bg-[#f8f5ef] p-3 text-xs font-bold text-[#082046] hover:bg-[#ffffff] hover:border-[#082046]/50 transition-all"
                      >
                        <span>{c.title}</span>
                        <ArrowRight className="size-3.5 text-[#0e7bf4]" />
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Entrance Exams - Rectangular rounded-md */}
              {course.exams && course.exams.length > 0 && (
                <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-6 space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-base font-bold text-[#082046] flex items-center gap-2">
                      <GraduationCap className="size-4 text-[#76562d]" /> Accepted Entrance Exams
                    </h3>
                    <p className="mt-1 text-xs text-[#536780]">
                      National and state entrance exams accepted for admission:
                    </p>
                  </div>

                  <div className="space-y-2">
                    {course.exams.map((e) => (
                      <Link
                        key={e.id}
                        href={`/exams/${e.slug}`}
                        className="flex items-center justify-between rounded-md border border-[#dec9a5]/70 bg-[#f8f5ef] p-3 text-xs font-bold text-[#082046] hover:bg-[#ffffff] hover:border-[#082046]/50 transition-all"
                      >
                        <span>{e.title}</span>
                        <span className="rounded border border-[#dec9a5] bg-[#F4E8D1] px-2 py-0.5 text-[10px] font-bold text-[#76562d]">
                          Official Exam
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Career Outcomes Text Box */}
              {course.career_outcomes && (
                <div className="rounded-md border border-[#dec9a5] bg-[#F4E8D1]/40 p-5 space-y-2 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#76562d]">
                    Industry Job Titles &amp; Outcomes
                  </h3>
                  <p className="text-xs font-medium text-[#082046] leading-relaxed">
                    {course.career_outcomes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
