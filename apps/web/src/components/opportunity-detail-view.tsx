import type { OpenReminderStatus, OpportunityCard, OpportunityDetail } from '@applyfields/types';
import { Badge, Card, SectionTitle } from '@applyfields/ui';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  GraduationCap,
  IndianRupee,
  Info,
  Landmark,
  Layers,
  MapPin,
  Megaphone,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { ApplyGuide } from './apply-guide';
import { TranslatedSummary } from './translated-summary';
import { CommunityDiscussionSection } from './community-discussion-section';
import {
  CheckEligibilityButton,
  ReminderButton,
  ShareButton,
} from './opportunity-actions';
import { OpenReminderButton, SaveButton } from './save-button';
import { CompareToggleButton } from './opportunity-compare/compare-button';
import { ReportWrongInfoButton } from './report-wrong-info-modal';
import { OpportunityAnalyticsTracker, ExternalApplyLink } from './analytics-tracker';
import { OpportunityTimelineStepper } from './opportunity/opportunity-timeline-stepper';
import { VacanciesDonutChart } from './opportunity/vacancies-donut-chart';
import { PipApplyButton } from './apply/pip-apply-button';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PrintExportButton } from '@/components/print-export-button';
import { QuickSummaryModal } from '@/components/summary/quick-summary-modal';
import { StickyMobileActionBar } from '@/components/layout/sticky-mobile-action-bar';
import { isSaved, apiGetAsUser, apiGetPublic } from '@/lib/server-api';
import { DATE_KIND_LABEL, DeadlineBadge, DeadlineDot, STATE_NAMES, TYPE_META, daysLeftLabel, estimateSalary, formatCurrency, formatDate } from '@/lib/format';

const RELATED_LINK_LABEL: Record<string, string> = {
  corrigendum: 'Corrigendum',
  extension: 'Date extension',
  application_form: 'Application form',
  interview_schedule: 'Interview schedule',
  shortlist: 'Shortlist',
  answer_key: 'Answer key',
  result: 'Result',
  selection_panel: 'Selection panel',
  supporting_document: 'Supporting document',
};

const todayIstIso = () => new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);

export async function OpportunityDetailView({ item }: { item: OpportunityDetail }) {
  const saved = await isSaved('opportunity', item.slug);
  // "Remind me when it opens" only while applications haven't opened yet (IST date).
  const opensLater = item.application_start && item.application_start.slice(0, 10) > todayIstIso() ? item.application_start.slice(0, 10) : null;
  const openReminder = opensLater
    ? await apiGetAsUser<OpenReminderStatus>(`/saved/opportunity/${encodeURIComponent(item.slug)}/open-reminder`)
    : null;
  const meta = TYPE_META[item.type];
  const generalEligibility = item.eligibility.find((e) => e.post_id === null) ?? item.eligibility[0];

  // Fetch similar opportunities (server-side, ISR cached 10 min)
  const similarData = await apiGetPublic<{ items: OpportunityCard[] }>(
    `/api/v1/opportunities/${item.slug}/similar`,
    600,
  );
  const similarItems = similarData?.items ?? [];

  const states = item.state_codes.filter((s) => s !== 'ALL');
  const locationText =
    states.length === 0
      ? 'All India'
      : states.map((s) => STATE_NAMES[s] ?? s).join(', ');

  // Structured Data (JSON-LD)
  const jsonLd =
    item.type === 'govt_job'
      ? {
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          title: item.title,
          description: item.summary || item.title,
          identifier: {
            '@type': 'PropertyValue',
            name: item.organization.name,
            value: item.notification_number || item.slug,
          },
          datePosted: item.published_at || undefined,
          validThrough: item.application_end ? `${item.application_end}T23:59:59` : undefined,
          employmentType: 'FULL_TIME',
          hiringOrganization: {
            '@type': 'Organization',
            name: item.organization.name,
            sameAs: item.links.official_website || undefined,
          },
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'IN',
              addressRegion: locationText,
            },
          },
          baseSalary:
            item.posts[0]?.salary_min && item.posts[0]?.salary_max
              ? {
                  '@type': 'MonetaryAmount',
                  currency: 'INR',
                  value: {
                    '@type': 'QuantitativeValue',
                    minValue: item.posts[0].salary_min,
                    maxValue: item.posts[0].salary_max,
                    unitText: 'MONTH',
                  },
                }
              : undefined,
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'SpecialAnnouncement',
          name: item.title,
          text: item.summary || item.title,
          datePosted: item.published_at || undefined,
          expires: item.application_end ? `${item.application_end}T23:59:59` : undefined,
          category: item.type,
          provider: {
            '@type': 'Organization',
            name: item.organization.name,
          },
        };

  return (
    <>
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Privacy-First Anonymous View Telemetry */}
      <OpportunityAnalyticsTracker id={item.id} slug={item.slug} type={item.type} />

      <div className="detail-flat">
      {/* Contextual Breadcrumb Navigation & Print Action */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs
          items={[
            { label: 'Apply', href: '/apply' },
            { label: meta.plural.charAt(0).toUpperCase() + meta.plural.slice(1), href: meta.base },
            { label: item.title },
          ]}
        />
        <div className="detail-actions">
          <PrintExportButton
            label="Print Notice / PDF"
            documentTitle={`${item.title} - ${item.organization.name} - ApplyFields`}
          />
        </div>
      </div>

      {/* Main Header — same visual language as the /apply list card: white, thin border, plain text */}
      <header className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
            {meta.label}
          </span>
          {generalEligibility?.qualification_level && (
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-sea">
              <Check className="size-3" aria-hidden="true" /> {generalEligibility.qualification_level}
            </span>
          )}
          {item.notification_number && (
            <span className="rounded-full border border-slate-200 px-2.5 py-0.5 font-mono text-[11px] text-slate-500">
              {item.notification_number}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-3xl">
          {item.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Source: {item.organization.name}
          {item.organization.short_name && ` (${item.organization.short_name})`}
        </p>

        {item.summary && (
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600">{item.summary}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden="true" />
            {locationText}
          </span>
          {item.last_verified_at && (
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-sea" aria-hidden="true" />
              Verified on {formatDate(item.last_verified_at.slice(0, 10))}
            </span>
          )}
          <ReportWrongInfoButton
            targetType="opportunity"
            targetSlug={item.slug}
            targetTitle={item.title}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          />
        </div>

        {/* Key facts — label/value pairs like OFFICIAL ROUTE / DEADLINE on the list card */}
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total vacancies</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">
              {item.vacancies_total !== null ? item.vacancies_total.toLocaleString('en-IN') : 'See notice'}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Salary / pay scale</dt>
            {(() => {
              const est = estimateSalary(item.posts[0]?.pay_level || item.posts[0]?.salary_text);
              return (
                <dd className="mt-1">
                  <span className="block truncate text-base font-semibold text-slate-900">
                    {est
                      ? est.formatted
                      : item.posts[0]?.salary_text ||
                        (item.posts[0]?.salary_min ? `From ${formatCurrency(item.posts[0].salary_min)}` : 'As per norms')}
                  </span>
                  {est && (
                    <span className="text-[11px] text-slate-500">
                      {item.posts[0]?.pay_level ? `Pay Level ${item.posts[0].pay_level} · ` : ''}7th CPC, in-hand
                    </span>
                  )}
                </dd>
              );
            })()}
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadline</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-base font-semibold text-slate-900">
              <DeadlineDot days={item.days_left} />
              {item.application_end ? formatDate(item.application_end) : 'To be notified'}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">{daysLeftLabel(item.days_left)}</dd>
          </div>
        </dl>

        {/* Actions — one row under the facts; .detail-actions gives the mixed shared buttons one flat style */}
        <div className="detail-actions mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
          {generalEligibility && (
            <CheckEligibilityButton
              ageMin={generalEligibility.age_min}
              ageMax={generalEligibility.age_max}
              ageAsOnDate={generalEligibility.age_as_on_date}
              relaxations={generalEligibility.age_relaxations}
              qualificationLevel={generalEligibility.qualification_level}
              domicileStates={generalEligibility.domicile_states}
              genderRule={generalEligibility.gender}
              className="detail-primary"
            />
          )}
          <SaveButton itemType="opportunity" slug={item.slug} title={item.title} initial={saved} />
          {opensLater && <OpenReminderButton slug={item.slug} opensOn={opensLater} initial={openReminder} />}
          <ReminderButton title={item.title} deadline={item.application_end} />
          <ShareButton title={item.title} />
          <QuickSummaryModal type="opportunity" opportunityData={item} buttonLabel="Quick Summary" />
          <CompareToggleButton
              item={{
                slug: item.slug,
                title: item.title,
                organization: item.organization.name,
                type: item.type,
                vacancies: item.vacancies_total,
                location: locationText,
                qualification: generalEligibility?.qualification_level || undefined,
                salary_text: item.posts[0]?.salary_text,
                application_end: item.application_end,
                days_left: item.days_left,
              }}
              variant="pill"
            />
        </div>
      </header>

      {/* Visual Application Stepper */}
      <div className="mt-6">
        <OpportunityTimelineStepper
          dates={item.dates}
          applicationEnd={item.application_end}
          publishedAt={item.published_at}
          daysLeft={item.days_left}
        />
      </div>

      {/* Main Content Layout */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Main In-Depth Information */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section: Overview & Translated Summary (Source of Truth Disclaimer) */}
          <TranslatedSummary
            summaryEn={item.summary || item.title}
            summaryTe={item.summary_te ?? item.translations?.te?.summary}
            summaryHi={item.summary_hi ?? item.translations?.hi?.summary}
            officialNotificationUrl={item.links.notification_pdf_url}
          />

          {/* Section: Eligibility Criteria */}
          {generalEligibility && (
            <Card className="p-5 sm:p-6">
              <SectionTitle
                title={
                  <div className="flex items-center gap-2 text-teal">
                    <GraduationCap className="size-5" />
                    <span>Eligibility Criteria</span>
                  </div>
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-xs font-bold text-teal/70 uppercase tracking-wider">
                    Age Limit
                  </span>
                  <p className="mt-1 text-sm font-extrabold text-teal">
                    {generalEligibility.age_min !== null ? `${generalEligibility.age_min} to ` : 'Up to '}
                    {generalEligibility.age_max !== null
                      ? `${generalEligibility.age_max} years`
                      : 'No max limit'}
                  </p>
                  {generalEligibility.age_as_on_date && (
                    <span className="mt-1 block text-[11px] text-teal/70">
                      Calculated as on {formatDate(generalEligibility.age_as_on_date)}
                    </span>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-xs font-bold text-teal/70 uppercase tracking-wider">
                    Educational Qualification
                  </span>
                  <p className="mt-1 text-sm font-extrabold text-teal capitalize">
                    {generalEligibility.qualification_level || 'See notification'}
                  </p>
                  {generalEligibility.qualification_streams.length > 0 && (
                    <span className="mt-1 block text-[11px] text-teal/70">
                      Streams: {generalEligibility.qualification_streams.join(', ')}
                    </span>
                  )}
                  {generalEligibility.final_year_allowed && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-sea">
                      <Check className="size-3" /> Final year students eligible
                    </span>
                  )}
                </div>
              </div>

              {/* Age Relaxations Table */}
              {generalEligibility.age_relaxations.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-teal uppercase tracking-wider mb-2">
                    Upper Age Relaxations
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-teal/70">
                        <tr>
                          <th className="px-3.5 py-2 font-semibold">Category / Condition</th>
                          <th className="px-3.5 py-2 font-semibold text-right">Age Relaxation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {generalEligibility.age_relaxations.map((rel, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-3.5 py-2 font-medium text-teal">
                              {rel.category || rel.condition || 'Other categories'}
                            </td>
                            <td className="px-3.5 py-2 text-right font-bold text-sea">
                              +{rel.years} years
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Official Eligibility Text */}
              {generalEligibility.official_text && (
                <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal/70 flex items-center gap-1">
                    <Info className="size-3.5" /> Official Notification Wording
                  </span>
                  <p className="mt-1.5 text-xs italic leading-relaxed text-teal/80">
                    “{generalEligibility.official_text}”
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Section: Vacancies Table */}
          {item.posts.length > 0 && (
            <Card className="p-5 sm:p-6">
              <SectionTitle
                title={
                  <div className="flex items-center gap-2 text-teal">
                    <Layers className="size-5" />
                    <span>Vacancies & Post Details ({item.posts.length})</span>
                  </div>
                }
              />

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-teal/70 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Post Name</th>
                      <th className="px-3 py-3">Pay Level / Salary</th>
                      <th className="px-3 py-3 text-right">Vacancies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {item.posts.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-teal">
                          {post.name}
                          {post.vacancies_by_category && (
                            <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                              {Object.entries(post.vacancies_by_category).map(([cat, cnt]) => (
                                <span key={cat} className="rounded bg-slate-100 px-1.5 py-0.5 text-teal font-medium">
                                  {cat}: {cnt}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-teal/80">
                          <div>
                            <span className="font-medium">{post.salary_text || (post.pay_level ? `Pay Level ${post.pay_level}` : 'As per 7th CPC')}</span>
                            {(() => {
                              const est = estimateSalary(post.pay_level || post.salary_text);
                              if (est) {
                                return (
                                  <span className="block text-[11px] font-bold text-sea mt-0.5">
                                    {est.formatted}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-extrabold text-teal tabular-nums">
                          {post.vacancies_total !== null
                            ? post.vacancies_total.toLocaleString('en-IN')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vacancies by Category Donut Chart */}
              {item.posts.some((p) => p.vacancies_by_category && Object.keys(p.vacancies_by_category).length > 1) && (
                <div className="mt-5">
                  <VacanciesDonutChart
                    categories={
                      item.posts.reduce<Record<string, number>>((acc, p) => {
                        if (p.vacancies_by_category) {
                          for (const [k, v] of Object.entries(p.vacancies_by_category)) {
                            acc[k] = (acc[k] || 0) + v;
                          }
                        }
                        return acc;
                      }, {})
                    }
                    total={item.vacancies_total}
                    title="Vacancies by Category Breakdown"
                  />
                </div>
              )}
            </Card>
          )}

          {/* Section: Selection Process */}
          {item.selection_process && item.selection_process.length > 0 && (
            <Card className="p-5 sm:p-6">
              <SectionTitle
                title={
                  <div className="flex items-center gap-2 text-teal">
                    <CheckCircle2 className="size-5" />
                    <span>Selection Process</span>
                  </div>
                }
              />
              <div className="mt-3 space-y-2.5">
                {item.selection_process.map((stage, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <p className="text-xs font-medium text-teal leading-relaxed mt-0.5">{stage}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Section: Required Documents Checklist */}
          {item.required_documents && item.required_documents.length > 0 && (
            <Card className="p-5 sm:p-6">
              <SectionTitle
                title={
                  <div className="flex items-center gap-2 text-teal">
                    <FileCheck className="size-5" />
                    <span>Required Documents Checklist</span>
                  </div>
                }
              />
              <p className="text-xs text-teal/70 mb-3">
                Have scanned soft copies and original physical certificates ready before applying.
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {item.required_documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-teal">{doc.name}</p>
                      {doc.mandatory ? (
                        <Badge tone="teal" className="text-[10px] shrink-0">
                          Mandatory
                        </Badge>
                      ) : (
                        <Badge tone="outline" className="text-[10px] shrink-0">
                          If applicable
                        </Badge>
                      )}
                    </div>
                    {doc.spec && (
                      <p className="mt-1 text-[11px] text-teal/70 italic">Spec: {doc.spec}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Section: Syllabus & Previous Papers */}
          {(item.syllabus || item.previous_papers.length > 0) && (
            <Card className="p-5 sm:p-6">
              <SectionTitle
                title={
                  <div className="flex items-center gap-2 text-teal">
                    <BookOpen className="size-5" />
                    <span>Syllabus & Previous Papers</span>
                  </div>
                }
              />

              {item.syllabus && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-xs font-bold text-teal uppercase tracking-wider mb-1">
                    Exam Pattern & Topics
                  </h4>
                  {item.syllabus.text && (
                    <p className="text-xs leading-relaxed text-teal/80">{item.syllabus.text}</p>
                  )}
                  {item.syllabus.url && (
                    <a
                      href={item.syllabus.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-sea hover:underline"
                    >
                      <Download className="size-3.5" /> Download Full Detailed Syllabus (PDF)
                    </a>
                  )}
                </div>
              )}

              {item.previous_papers.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-teal uppercase tracking-wider mb-2">
                    Previous Year Question Papers
                  </h4>
                  <div className="space-y-2">
                    {item.previous_papers.map((paper, idx) => (
                      <a
                        key={idx}
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-teal transition hover:bg-slate-50"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="size-4 text-teal/70" />
                          {paper.title}
                        </span>
                        <ExternalLink className="size-3.5 text-teal/60" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Section: Apply Guide (Official vs ApplyFields) */}
          <ApplyGuide
            applyUrl={item.links.apply_url || item.links.official_page_url}
            notificationPdfUrl={item.links.notification_pdf_url}
            opportunityTitle={item.title}
            type={item.type === 'govt_job' ? 'job' : item.type}
          />

          {/* Section: Community Discussion & Q&A */}
          <CommunityDiscussionSection
            opportunityId={item.id}
            opportunityTitle={item.title}
          />
        </div>

        {/* Right 1 Col: Important Dates, Fees, Official Links & Updates */}
        <div className="space-y-6">
          {/* Important Dates */}
          <Card className="p-5">
            <SectionTitle
              title={
                <div className="flex items-center gap-2 text-teal">
                  <Calendar className="size-4" />
                  <span>Important Dates</span>
                </div>
              }
            />

            {item.dates.length === 0 && (
              <p className="text-xs text-slate-500">Dates will appear here once the official notice announces them.</p>
            )}
            <div className="mt-3 relative space-y-4 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-line empty:hidden">
              {item.dates.map((d) => (
                <div key={d.id} className="relative flex items-start gap-3 pl-1">
                  <div className="relative z-10 grid size-4 shrink-0 place-items-center rounded-full bg-sea ring-4 ring-white" />
                  <div>
                    <span className="text-[11px] font-semibold text-teal/70">
                      {DATE_KIND_LABEL[d.kind] || d.kind}
                    </span>
                    <p className="text-xs font-bold text-teal">
                      {formatDate(d.date)}
                      {d.end_date && ` to ${formatDate(d.end_date)}`}
                    </p>
                    {d.is_tentative && (
                      <Badge tone="tea" className="mt-0.5 text-[10px]">
                        Tentative
                      </Badge>
                    )}
                    {d.note && <p className="text-[10px] text-teal/60">{d.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Fee Structure */}
          <Card className="p-5">
            <SectionTitle
              title={
                <div className="flex items-center gap-2 text-teal">
                  <IndianRupee className="size-4" />
                  <span>Application Fee</span>
                </div>
              }
            />

            {item.fees.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-teal/70">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Category</th>
                      <th className="px-3 py-2 text-right font-semibold">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {item.fees.map((f, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-teal">
                          {f.category}
                          {f.gender && f.gender !== 'any' && ` (${f.gender})`}
                        </td>
                        <td className="px-3 py-2 text-right font-extrabold text-teal">
                          {f.amount === 0 ? 'NIL (Exempted)' : formatCurrency(f.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : item.fee_text ? (
              <p className="text-xs text-teal/80">{item.fee_text}</p>
            ) : (
              <p className="text-xs text-teal/60">Fee details in notification</p>
            )}

            {item.fee_text && item.fees.length > 0 && (
              <p className="mt-2 text-[11px] text-teal/70 leading-normal">{item.fee_text}</p>
            )}

            {item.payment_modes.length > 0 && (
              <div className="mt-3 border-t border-slate-200 pt-2 text-[11px] text-teal/70">
                <span className="font-semibold text-teal">Payment modes: </span>
                {item.payment_modes.join(', ')}
              </div>
            )}
          </Card>

          {/* Official Portals & Notifications */}
          <Card className="p-5">
            <SectionTitle
              title={
                <div className="flex items-center gap-2 text-teal">
                  <Landmark className="size-4" />
                  <span>Official Sources</span>
                </div>
              }
            />

            <div className="mt-3 space-y-2.5">
              {item.links.notification_pdf_url && (
                <a
                  href={item.links.notification_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl bg-sea p-3 text-xs font-semibold text-white transition-colors hover:bg-[#0c6fdc]"
                >
                  <span className="flex items-center gap-2">
                    <Download className="size-4" />
                    Download Official Notification (PDF)
                  </span>
                  <ExternalLink className="size-3.5" />
                </a>
              )}

              {item.links.apply_url && (
                <>
                  <PipApplyButton
                    title={item.title}
                    applyUrl={item.links.apply_url}
                    slug={item.slug}
                    pdfUrl={item.links.notification_pdf_url}
                    variant="primary"
                  />

                  <ExternalApplyLink
                    opportunityId={item.id}
                    opportunitySlug={item.slug}
                    href={item.links.apply_url}
                    className="flex items-center justify-between rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="size-4" />
                      Official Online Application Portal (New Tab)
                    </span>
                    <ChevronRight className="size-3.5" />
                  </ExternalApplyLink>
                </>
              )}

              {item.links.official_website && (
                <a
                  href={item.links.official_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-teal/80 hover:bg-slate-50"
                >
                  <span>Organisation Website</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </Card>

          {/* Related official documents (corrigenda, forms, results…) found next to the notification */}
          {item.related_links?.length > 0 && (
            <Card className="p-5">
              <SectionTitle
                title={
                  <div className="flex items-center gap-2 text-teal">
                    <FileText className="size-4" />
                    <span>Related Documents</span>
                  </div>
                }
              />
              <ul className="mt-3 space-y-2">
                {item.related_links.map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-teal hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{l.title}</span>
                        <span className="text-[10px] text-teal/60">{RELATED_LINK_LABEL[l.category] ?? 'Document'}</span>
                      </span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-teal/60">From the official website. Opens the original PDF.</p>
            </Card>
          )}

          {/* Updates for this opportunity */}
          {item.updates && item.updates.length > 0 && (
            <Card className="p-5">
              <SectionTitle
                title={
                  <div className="flex items-center gap-2 text-teal">
                    <Megaphone className="size-4" />
                    <span>Admit Cards &amp; Updates</span>
                  </div>
                }
              />

              <div className="mt-3 space-y-2">
                {item.updates.map((u) => (
                  <div key={u.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="teal" className="text-[10px]">
                        {u.kind.replace('_', ' ')}
                      </Badge>
                      <span className="text-[10px] text-teal/70">{formatDate(u.date)}</span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-teal">{u.title}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Similar Opportunities */}
          {similarItems.length > 0 && (
            <Card className="p-5">
              <SectionTitle
                title={
                  <div className="flex items-center gap-2 text-teal">
                    <Layers className="size-4" />
                    <span>Similar Opportunities</span>
                  </div>
                }
              />
              <div className="mt-3 space-y-2">
                {similarItems.map((s) => {
                  const href =
                    s.type === 'govt_job' ? `/jobs/${s.slug}` :
                    s.type === 'exam' ? `/exams/${s.slug}` :
                    s.type === 'scholarship' ? `/scholarships/${s.slug}` :
                    s.type === 'admission' ? `/admissions/${s.slug}` :
                    `/services/${s.slug}`;
                  return (
                    <Link
                      key={s.slug}
                      href={href}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-teal line-clamp-1 group-hover:text-sea transition-colors">
                          {s.title}
                        </p>
                        <p className="text-[11px] text-teal/60 mt-0.5 truncate">{s.organization}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {s.days_left != null && (
                          <DeadlineBadge days={s.days_left} className="text-[10px]" />

                        )}
                        <ChevronRight className="size-3.5 text-teal/40 group-hover:text-sea transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      </div>

      {/* Sticky Bottom Action Bar for Mobile Viewports */}
      <StickyMobileActionBar
        title={item.title}
        badgeText={item.days_left != null ? daysLeftLabel(item.days_left) : (item.application_end ? `Last date: ${item.application_end}` : undefined)}
        primaryCtaLabel="Apply Online"
        primaryCtaHref={item.links.apply_url || item.links.official_page_url || meta.base}
        isExternal={Boolean(item.links.apply_url || item.links.official_page_url)}
        slug={item.slug}
        itemType="opportunity"
        category={meta.label}
      />
    </>
  );
}
