import type { OpportunityDetail } from '@applyfields/types';
import { Badge, Card, IconTile, PageHeader, SectionTitle } from '@applyfields/ui';
import {
  AlertCircle,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  GraduationCap,
  HelpCircle,
  IndianRupee,
  Info,
  Landmark,
  Layers,
  MapPin,
  Megaphone,
  School,
  ShieldCheck,
  Sparkles,
  Users,
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
import { SaveButton } from './save-button';
import { ReportWrongInfoButton } from './report-wrong-info-modal';
import { isSaved } from '@/lib/server-api';
import {
  DATE_KIND_LABEL,
  daysLeftLabel,
  formatCurrency,
  formatDate,
  STATE_NAMES,
  TYPE_META,
  urgencyTone,
} from '@/lib/format';

export async function OpportunityDetailView({ item }: { item: OpportunityDetail }) {
  const saved = await isSaved('opportunity', item.slug);
  const meta = TYPE_META[item.type];
  const generalEligibility = item.eligibility.find((e) => e.post_id === null) ?? item.eligibility[0];

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

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-teal/70">
        <Link href={meta.base} className="hover:underline">
          {meta.plural.charAt(0).toUpperCase() + meta.plural.slice(1)}
        </Link>
        <ChevronRight className="size-3" aria-hidden="true" />
        <span className="truncate max-w-[280px] font-semibold text-teal">{item.title}</span>
      </nav>

      {/* Main Header */}
      <header className="rounded-3xl border border-line bg-canvas/70 p-5 shadow-card sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <IconTile tone={meta.tone} className="size-14 rounded-2xl [&>svg]:size-7 shrink-0">
              {meta.icon}
            </IconTile>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-teal/80">
                  {item.organization.name}
                  {item.organization.short_name && ` (${item.organization.short_name})`}
                </span>
                {item.notification_number && (
                  <Badge tone="outline" className="text-[11px] font-mono">
                    {item.notification_number}
                  </Badge>
                )}
                <Badge tone={meta.tone === 'sea' ? 'teal' : meta.tone} className="text-[11px]">
                  {meta.label}
                </Badge>
              </div>

              <h1 className="mt-1.5 text-xl font-extrabold sm:text-2xl lg:text-3xl text-teal leading-snug">
                {item.title}
              </h1>

              {item.summary && (
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-teal/80 max-w-3xl">
                  {item.summary}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-teal/80">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {locationText}
                </span>
                <span>•</span>
                {item.last_verified_at && (
                  <span className="flex items-center gap-1 text-teal/70">
                    <ShieldCheck className="size-3.5 text-sea" aria-hidden="true" />
                    Verified on {formatDate(item.last_verified_at.slice(0, 10))}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 shrink-0">
            <SaveButton itemType="opportunity" slug={item.slug} title={item.title} initial={saved} />
            <ShareButton title={item.title} />
            <ReminderButton title={item.title} deadline={item.application_end} />
            {generalEligibility && (
              <CheckEligibilityButton
                ageMin={generalEligibility.age_min}
                ageMax={generalEligibility.age_max}
                ageAsOnDate={generalEligibility.age_as_on_date}
                relaxations={generalEligibility.age_relaxations}
                qualificationLevel={generalEligibility.qualification_level}
                domicileStates={generalEligibility.domicile_states}
                genderRule={generalEligibility.gender}
              />
            )}
            <ReportWrongInfoButton
              targetType="opportunity"
              targetSlug={item.slug}
              targetTitle={item.title}
            />
          </div>
        </div>

        {/* Highlights Bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-5 sm:grid-cols-4">
          <div className="rounded-2xl bg-cream/70 p-3 shadow-clay">
            <span className="text-[11px] font-semibold text-teal/70 flex items-center gap-1">
              <Users className="size-3.5" /> Total Vacancies
            </span>
            <p className="mt-1 text-lg sm:text-xl font-extrabold text-teal">
              {item.vacancies_total !== null
                ? item.vacancies_total.toLocaleString('en-IN')
                : 'See notice'}
            </p>
          </div>

          <div className="rounded-2xl bg-cream/70 p-3 shadow-clay">
            <span className="text-[11px] font-semibold text-teal/70 flex items-center gap-1">
              <IndianRupee className="size-3.5" /> Salary / Pay Scale
            </span>
            <p className="mt-1 text-lg sm:text-xl font-extrabold text-teal truncate">
              {item.posts[0]?.salary_text ||
                (item.posts[0]?.salary_min
                  ? `From ${formatCurrency(item.posts[0].salary_min)}`
                  : 'As per norms')}
            </p>
          </div>

          <div className="rounded-2xl bg-cream/70 p-3 shadow-clay">
            <span className="text-[11px] font-semibold text-teal/70 flex items-center gap-1">
              <CalendarDays className="size-3.5" /> Application Deadline
            </span>
            <p className="mt-1 text-sm sm:text-base font-extrabold text-teal">
              {item.application_end ? formatDate(item.application_end) : 'To be notified'}
            </p>
          </div>

          <div className="rounded-2xl bg-cream/70 p-3 shadow-clay">
            <span className="text-[11px] font-semibold text-teal/70 flex items-center gap-1">
              <Clock className="size-3.5" /> Status / Timeline
            </span>
            <div className="mt-1">
              <Badge tone={urgencyTone(item.days_left)} className="text-xs">
                {daysLeftLabel(item.days_left)}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Main In-Depth Information */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section: Overview & Translated Summary (Source of Truth Disclaimer) */}
          <TranslatedSummary
            summaryEn={item.summary || item.title}
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
                <div className="rounded-2xl border border-line bg-canvas/40 p-4">
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

                <div className="rounded-2xl border border-line bg-canvas/40 p-4">
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
                  <div className="overflow-x-auto rounded-xl border border-line">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-canvas border-b border-line text-teal/70">
                        <tr>
                          <th className="px-3.5 py-2 font-semibold">Category / Condition</th>
                          <th className="px-3.5 py-2 font-semibold text-right">Age Relaxation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {generalEligibility.age_relaxations.map((rel, idx) => (
                          <tr key={idx} className="hover:bg-cream/40">
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
                <div className="mt-4 rounded-xl bg-cream/70 p-3.5 border border-line">
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

              <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-line text-teal/70 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Post Name</th>
                      <th className="px-3 py-3">Pay Level / Salary</th>
                      <th className="px-3 py-3 text-right">Vacancies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {item.posts.map((post) => (
                      <tr key={post.id} className="hover:bg-cream/40">
                        <td className="px-4 py-3 font-bold text-teal">
                          {post.name}
                          {post.vacancies_by_category && (
                            <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                              {Object.entries(post.vacancies_by_category).map(([cat, cnt]) => (
                                <span key={cat} className="rounded bg-tea px-1.5 py-0.5 text-teal font-medium">
                                  {cat}: {cnt}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-teal/80">
                          {post.salary_text || post.pay_level || 'As per 7th CPC'}
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
                  <div key={idx} className="flex items-start gap-3 rounded-xl border border-line bg-canvas/30 p-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-teal text-cream text-xs font-bold shadow-clay">
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
                    className="flex flex-col justify-between rounded-xl border border-line bg-canvas/40 p-3"
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
                <div className="rounded-xl border border-line bg-canvas/40 p-4">
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
                        className="flex items-center justify-between rounded-xl border border-line bg-cream/50 p-3 text-xs font-bold text-teal transition hover:bg-cream"
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

            <div className="mt-3 relative space-y-4 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-line">
              {item.dates.map((d) => (
                <div key={d.id} className="relative flex items-start gap-3 pl-1">
                  <div className="relative z-10 grid size-4 shrink-0 place-items-center rounded-full bg-teal ring-4 ring-cream" />
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
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-line text-teal/70">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Category</th>
                      <th className="px-3 py-2 text-right font-semibold">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {item.fees.map((f, idx) => (
                      <tr key={idx} className="hover:bg-cream/40">
                        <td className="px-3 py-2 font-medium text-teal">
                          {f.category}
                          {f.gender !== 'any' && ` (${f.gender})`}
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
              <div className="mt-3 border-t border-line pt-2 text-[11px] text-teal/70">
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
                  className="clay-press flex items-center justify-between rounded-xl bg-teal p-3 text-xs font-bold text-cream shadow-clay hover:bg-teal/90"
                >
                  <span className="flex items-center gap-2">
                    <Download className="size-4" />
                    Download Official Notification (PDF)
                  </span>
                  <ExternalLink className="size-3.5" />
                </a>
              )}

              {item.links.apply_url && (
                <a
                  href={item.links.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clay-press flex items-center justify-between rounded-xl border border-line bg-cream p-3 text-xs font-bold text-teal shadow-clay hover:bg-tea"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="size-4" />
                    Official Online Application Portal
                  </span>
                  <ChevronRight className="size-3.5" />
                </a>
              )}

              {item.links.official_website && (
                <a
                  href={item.links.official_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-line bg-canvas/60 p-2.5 text-xs font-medium text-teal/80 hover:bg-canvas"
                >
                  <span>Organisation Website</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </Card>

          {/* Updates for this opportunity */}
          {item.updates && item.updates.length > 0 && (
            <Card className="p-5">
              <SectionTitle
                title={
                  <div className="flex items-center gap-2 text-teal">
                    <Megaphone className="size-4" />
                    <span>Admit Cards & Updates</span>
                  </div>
                }
              />

              <div className="mt-3 space-y-2">
                {item.updates.map((u) => (
                  <div key={u.id} className="rounded-xl border border-line bg-canvas/40 p-3">
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
        </div>
      </div>
    </>
  );
}
