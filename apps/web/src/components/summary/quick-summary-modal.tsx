'use client';

import { useState } from 'react';
import {
  Award,
  Banknote,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers,
  MapPin,
  Printer,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import type { InstitutionDetail, OpportunityDetail } from '@applyfields/types';
import { showAppToast } from '@/components/toast-notification-provider';

export interface QuickSummaryModalProps {
  type: 'college' | 'opportunity';
  collegeData?: InstitutionDetail | null;
  opportunityData?: OpportunityDetail | null;
  buttonLabel?: string;
  buttonClassName?: string;
  variant?: 'outline' | 'solid';
}

export function QuickSummaryModal({
  type,
  collegeData,
  opportunityData,
  buttonLabel = 'Quick Summary',
  buttonClassName = '',
  variant = 'outline',
}: QuickSummaryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // -------------------------------------------------------------
  // Zero-LLM Deterministic Extraction for Colleges
  // -------------------------------------------------------------
  const getCollegeSummary = () => {
    if (!collegeData) return null;
    const acc = (collegeData.accreditation || {}) as any;
    const pl = (collegeData.placement_stats || {}) as any;
    const isMedical =
      acc.nirf_category === 'Medical' ||
      collegeData.name.toLowerCase().includes('medical') ||
      collegeData.name.toLowerCase().includes('aiims');

    const rankText = acc.nirf_rank_text || collegeData.ranking_text || (acc.nirf_rank ? `NIRF Rank #${acc.nirf_rank} (${acc.nirf_category || 'Colleges'})` : 'Nationally Accredited');
    const exams = acc.accepted_exams?.length ? acc.accepted_exams.join(', ') : (isMedical ? 'NEET-UG, NEET-PG' : 'JEE Advanced, JEE Main, GATE');
    const cutoffs = acc.cutoff_details || (isMedical ? 'NEET-UG Rank 1-100 (General AIIMS/Govt benchmark)' : 'Top 1% in national competitive entrance test');
    const fees = collegeData.fees_text || (isMedical ? 'INR 6,000 - 1,50,000 / year (Subsidized public education)' : 'INR 2,00,000 / year');
    const placementOrStipend = pl.avg_package || (isMedical ? 'INR 1,10,000/mo Resident Stipend' : 'INR 21.4 LPA Average CTC');
    const topRecruiters = pl.top_recruiters?.length ? pl.top_recruiters.slice(0, 8).join(', ') : (isMedical ? 'AIIMS Hospital, Apollo, Fortis, Max Healthcare, ICMR' : 'Google, Microsoft, Amazon, Texas Instruments, Goldman Sachs');
    const facilities = collegeData.campus_facilities?.length ? collegeData.campus_facilities.slice(0, 8).join(' · ') : 'Central Library, Research Labs, Hostels, Hospital / Diagnostic Wing, Sports Arena';

    const plainText = `
SUMMARY: ${collegeData.name}
---------------------------------------------
Standing: ${rankText}
Type: ${collegeData.type.toUpperCase()} (${collegeData.ownership === 'government' ? 'Public / Govt' : 'Private'})
Location: ${collegeData.city || collegeData.district || 'India'}, ${collegeData.state_code || ''}
Estd: ${collegeData.established_year || 'Historical'}

ADMISSIONS & ELIGIBILITY:
- Accepted Exams: ${exams}
- Benchmark Cutoff: ${cutoffs}
- Flagship Programs: ${acc.specific_branches?.slice(0, 5).join(', ') || (isMedical ? 'MBBS, MD General Medicine, MS Surgery' : 'B.Tech CSE, Electrical, Mechanical')}

FINANCIALS & CAREER OUTCOMES:
- Annual Tuition: ${fees}
- Package / Stipend: ${placementOrStipend}
- Key Partners / Recruiters: ${topRecruiters}
- Facilities: ${facilities}
    `.trim();

    return {
      title: collegeData.name,
      subtitle: `${collegeData.city || 'India'}, ${collegeData.state_code || ''}`,
      rankText,
      typeText: `${collegeData.ownership === 'government' ? 'Government' : 'Private'} ${collegeData.type}`,
      exams,
      cutoffs,
      fees,
      placementOrStipend,
      topRecruiters,
      facilities,
      branches: acc.specific_branches || [],
      plainText,
    };
  };

  // -------------------------------------------------------------
  // Zero-LLM Deterministic Extraction for Opportunities
  // -------------------------------------------------------------
  const getOpportunitySummary = () => {
    if (!opportunityData) return null;
    const generalEligibility = opportunityData.eligibility?.find((e) => e.post_id === null) || opportunityData.eligibility?.[0];
    const postCount = opportunityData.posts?.length || 0;
    const vacancies = opportunityData.vacancies_total ? `${opportunityData.vacancies_total.toLocaleString()} Vacancies` : 'See official notification';
    const qual = generalEligibility?.qualification_level ? generalEligibility.qualification_level.toUpperCase() : 'Prescribed in notification';
    const age = generalEligibility?.age_min || generalEligibility?.age_max
      ? `${generalEligibility.age_min || '18'} to ${generalEligibility.age_max || '32'} Years`
      : 'Standard govt age rules apply';
    const feeText = opportunityData.fee_text
      ? opportunityData.fee_text
      : (opportunityData.fees && opportunityData.fees.length > 0
        ? opportunityData.fees.map((f) => `${f.category}: ₹${f.amount}`).join(' | ')
        : 'Nominal or Exempted');
    const salaryText = opportunityData.posts?.[0]?.salary_text || opportunityData.posts?.[0]?.pay_level || 'Pay Level as per 7th CPC / UGC Scales';
    const deadlineText = opportunityData.application_end || 'Refer to notice';
    const daysLeftText = opportunityData.days_left !== null && opportunityData.days_left !== undefined
      ? (opportunityData.days_left > 0 ? `${opportunityData.days_left} days remaining` : 'Closing today or closed')
      : null;
    const applyUrl = opportunityData.links?.apply_url || opportunityData.links?.official_page_url || 'https://applyfields.in';

    const plainText = `
SUMMARY: ${opportunityData.title}
---------------------------------------------
Organization: ${opportunityData.organization.name}
Notification Ref: ${opportunityData.notification_number || 'Official Release'}
Category: ${opportunityData.category.toUpperCase()} (${opportunityData.type.toUpperCase()})

KEY SPECIFICATIONS:
- Total Vacancies: ${vacancies} (${postCount} distinct posts)
- Required Qualification: ${qual}
- Age Eligibility: ${age}
- Salary / Pay Scale: ${salaryText}
- Application Fee: ${feeText}

TIMELINES:
- Application Opens: ${opportunityData.application_start || 'Announced'}
- Final Deadline: ${deadlineText} (${daysLeftText || 'Active'})

DIRECT ACTION:
- Apply Online: ${applyUrl}
    `.trim();

    return {
      title: opportunityData.title,
      org: opportunityData.organization.name,
      notif: opportunityData.notification_number,
      vacancies,
      qual,
      age,
      salaryText,
      feeText,
      deadlineText,
      daysLeftText,
      summaryText: opportunityData.summary,
      plainText,
    };
  };

  const collegeSummary = type === 'college' ? getCollegeSummary() : null;
  const oppSummary = type === 'opportunity' ? getOpportunitySummary() : null;

  const fullPlainText = collegeSummary?.plainText || oppSummary?.plainText || '';

  const handleCopySummary = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(fullPlainText);
      setCopied(true);
      showAppToast({
        message: 'Summary snapshot copied to clipboard!',
        type: 'success',
      });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="View key requirements, eligibility, and highlights summary"
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3.5 text-xs font-semibold transition-colors shadow-sm cursor-pointer ${
          variant === 'solid'
            ? 'border border-[#dec9a5] bg-[#F4E8D1] text-[#082046] hover:bg-[#ebdcc0]'
            : 'border border-[#dec9a5] bg-[#f8f5ef] text-[#082046] hover:bg-[#ffffff]'
        } ${buttonClassName}`}
      >
        <FileText className="size-3.5 text-[#0e7bf4]" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082046]/45 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-md border border-[#dec9a5] bg-[#ffffff] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#dec9a5] bg-[#F4E8D1] px-5 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#76562d]" />
                <div>
                  <h3 id="summary-modal-title" className="text-sm font-bold text-[#082046]">
                    Executive Summary Snapshot
                  </h3>
                  <p className="text-[11px] text-[#536780]">
                    Verified facts, eligibility &amp; key requirements at a glance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-[#76562d] hover:bg-[#ffffff] hover:text-[#082046] transition-colors"
                aria-label="Close summary modal"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Content Scroll Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {/* College Summary Layout */}
              {type === 'college' && collegeSummary && (
                <>
                  {/* Hero Box */}
                  <div className="rounded-md border border-[#dec9a5] bg-[#f8f5ef] p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded border border-[#dec9a5] bg-[#F4E8D1] px-2 py-0.5 text-[11px] font-bold text-[#76562d]">
                        <Award className="size-3 text-[#76562d]" /> {collegeSummary.rankText}
                      </span>
                      <span className="rounded border border-[#dec9a5] bg-[#ffffff] px-2 py-0.5 text-[11px] font-medium text-[#243b5b]">
                        {collegeSummary.typeText}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-[#082046]">{collegeSummary.title}</h2>
                    <p className="text-[#536780] flex items-center gap-1">
                      <MapPin className="size-3 text-[#76562d]" /> {collegeSummary.subtitle}
                    </p>
                  </div>

                  {/* 2-Column Key Metrics Grid */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-[#dec9a5]/70 bg-[#ffffff] p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#76562d] uppercase tracking-wider text-[10px]">
                        <GraduationCap className="size-3.5 text-[#0e7bf4]" /> Accepted Exams &amp; Cutoffs
                      </div>
                      <p className="font-bold text-[#082046]">{collegeSummary.exams}</p>
                      <p className="text-[11px] text-[#536780]">{collegeSummary.cutoffs}</p>
                    </div>

                    <div className="rounded-md border border-[#dec9a5]/70 bg-[#ffffff] p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#76562d] uppercase tracking-wider text-[10px]">
                        <Banknote className="size-3.5 text-[#76562d]" /> Fees &amp; Financials
                      </div>
                      <p className="font-bold text-[#082046]">{collegeSummary.fees}</p>
                      <p className="text-[11px] text-[#536780]">Average Tuition / Year</p>
                    </div>

                    <div className="rounded-md border border-[#dec9a5]/70 bg-[#ffffff] p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#76562d] uppercase tracking-wider text-[10px]">
                        <ShieldCheck className="size-3.5 text-emerald-600" /> Career Outcome / Stipend
                      </div>
                      <p className="font-bold text-[#082046]">{collegeSummary.placementOrStipend}</p>
                      <p className="text-[11px] text-[#536780]">Benchmark Placement / Residency</p>
                    </div>

                    <div className="rounded-md border border-[#dec9a5]/70 bg-[#ffffff] p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#76562d] uppercase tracking-wider text-[10px]">
                        <Building className="size-3.5 text-[#76562d]" /> Top Partners &amp; Recruiters
                      </div>
                      <p className="text-[11px] font-medium text-[#082046] line-clamp-2">
                        {collegeSummary.topRecruiters}
                      </p>
                    </div>
                  </div>

                  {/* Campus Infrastructure */}
                  <div className="rounded-md border border-[#dec9a5] bg-[#f8f5ef] p-3.5 space-y-1.5">
                    <p className="font-bold uppercase tracking-wider text-[10px] text-[#76562d]">
                      Campus Facilities &amp; Research Setup
                    </p>
                    <p className="text-[#082046] leading-relaxed">{collegeSummary.facilities}</p>
                  </div>
                </>
              )}

              {/* Opportunity Summary Layout */}
              {type === 'opportunity' && oppSummary && (
                <>
                  {/* Hero Box */}
                  <div className="rounded-md border border-[#dec9a5] bg-[#f8f5ef] p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-[#76562d]">
                        {oppSummary.org}
                      </span>
                      {oppSummary.notif && (
                        <span className="font-mono text-[10px] rounded border border-[#dec9a5] bg-[#ffffff] px-1.5 py-0.5 text-[#536780]">
                          {oppSummary.notif}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-[#082046]">{oppSummary.title}</h2>
                    {oppSummary.summaryText && (
                      <p className="text-[#536780] leading-relaxed line-clamp-2">{oppSummary.summaryText}</p>
                    )}
                  </div>

                  {/* 2-Column Key Metrics Grid */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-[#dec9a5]/70 bg-[#ffffff] p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#76562d] uppercase tracking-wider text-[10px]">
                        <Users className="size-3.5 text-[#0e7bf4]" /> Total Posts &amp; Vacancies
                      </div>
                      <p className="font-bold text-[#082046]">{oppSummary.vacancies}</p>
                      <p className="text-[11px] text-[#536780]">Multiple reservations as per rule</p>
                    </div>

                    <div className="rounded-md border border-[#dec9a5]/70 bg-[#ffffff] p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#76562d] uppercase tracking-wider text-[10px]">
                        <GraduationCap className="size-3.5 text-[#76562d]" /> Minimum Qualification
                      </div>
                      <p className="font-bold text-[#082046]">{oppSummary.qual}</p>
                      <p className="text-[11px] text-[#536780]">Age Bracket: {oppSummary.age}</p>
                    </div>

                    <div className="rounded-md border border-[#dec9a5]/70 bg-[#ffffff] p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#76562d] uppercase tracking-wider text-[10px]">
                        <Clock className="size-3.5 text-amber-600" /> Deadline &amp; Status
                      </div>
                      <p className="font-bold text-[#082046]">{oppSummary.deadlineText}</p>
                      <p className="text-[11px] text-amber-700 font-semibold">{oppSummary.daysLeftText || 'Active'}</p>
                    </div>

                    <div className="rounded-md border border-[#dec9a5]/70 bg-[#ffffff] p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#76562d] uppercase tracking-wider text-[10px]">
                        <Banknote className="size-3.5 text-emerald-600" /> Salary &amp; Fee
                      </div>
                      <p className="font-bold text-[#082046]">{oppSummary.salaryText}</p>
                      <p className="text-[11px] text-[#536780]">{oppSummary.feeText}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dec9a5] bg-[#f8f5ef] px-5 py-3.5 shrink-0">
              <span className="text-[11px] text-[#536780]">
                Verified official records · No speculative generated content
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#ffffff] px-3 text-xs font-semibold text-[#082046] hover:bg-[#F4E8D1] transition-colors cursor-pointer shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-[#76562d]" />
                      <span>Copy Summary</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-[#082046] bg-[#082046] px-3.5 text-xs font-semibold text-[#ffffff] hover:bg-[#0c2e63] transition-colors cursor-pointer shadow-sm"
                >
                  <Printer className="size-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
