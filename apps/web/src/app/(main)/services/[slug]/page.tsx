import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import type { GovServiceDetail } from '@applyfields/types';
import { Badge, Card, IconTile, SectionTitle } from '@applyfields/ui';
import {
  AlertCircle,
  Building,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  HandHelping,
  IndianRupee,
  Info,
  Landmark,
  MapPin,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { ShareButton } from '@/components/opportunity-actions';
import { ReportWrongInfoButton } from '@/components/report-wrong-info-modal';
import { apiGet } from '@/lib/api';
import { formatDate, STATE_NAMES } from '@/lib/format';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await apiGet<GovServiceDetail>(`/services/${slug}`);

  if (!item) {
    return {
      title: 'Service Not Found — ApplyFields',
      description: 'The requested government service procedure could not be found.',
    };
  }

  const title = `${item.name} — Official Online Procedure, Documents & Fees`;
  const description =
    item.description ||
    `Step-by-step guide to apply for ${item.name} from ${item.authority_name || 'government authority'}. Required documents, official fees, processing time, and official portal link.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://applyfields.in/services/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://applyfields.in/services/${slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const item = await apiGet<GovServiceDetail>(`/services/${slug}`);

  if (!item) {
    notFound();
  }

  const states = item.state_codes.filter((s) => s !== 'ALL');
  const locationText =
    states.length === 0
      ? 'All India (Central Service)'
      : states.map((s) => STATE_NAMES[s] ?? s).join(', ');

  // Structured Data (JSON-LD) for GovernmentService
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: item.name,
    description: item.description,
    serviceType: item.category || 'Citizen Service',
    provider: {
      '@type': 'GovernmentOrganization',
      name: item.authority_name || 'Government of India',
      url: item.official_url || undefined,
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: locationText,
    },
  };

  return (
    <>
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-teal/70">
        <Link href="/services" className="hover:underline">
          Government Services
        </Link>
        <ChevronRight className="size-3" aria-hidden="true" />
        <span className="truncate max-w-[280px] font-semibold text-teal">{item.name}</span>
      </nav>

      {/* Main Service Header */}
      <header className="rounded-3xl border border-line bg-canvas/70 p-5 shadow-card sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <IconTile tone="tea" className="size-14 rounded-2xl [&>svg]:size-7 shrink-0">
              <Landmark />
            </IconTile>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-teal/80">
                  {item.authority_name || 'Government Authority'}
                </span>
                {item.category && (
                  <Badge tone="tea" className="text-[11px]">
                    {item.category}
                  </Badge>
                )}
                {item.authority_level && (
                  <Badge tone="outline" className="text-[11px] capitalize">
                    {item.authority_level} Authority
                  </Badge>
                )}
              </div>

              <h1 className="mt-1.5 text-xl font-extrabold sm:text-2xl lg:text-3xl text-teal leading-snug">
                {item.name}
              </h1>

              {item.description && (
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-teal/80 max-w-3xl">
                  {item.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-teal/80">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {locationText}
                </span>
                {item.last_verified_at && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-teal/70">
                      <ShieldCheck className="size-3.5 text-sea" aria-hidden="true" />
                      Verified on {formatDate(item.last_verified_at.slice(0, 10))}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ShareButton title={item.name} />
            <ReportWrongInfoButton
              targetType="service"
              targetSlug={item.slug}
              targetTitle={item.name}
            />
          </div>
        </div>

        {/* Highlights Bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-5 sm:grid-cols-4">
          <div className="rounded-2xl bg-cream/70 p-3 shadow-clay">
            <span className="text-[11px] font-semibold text-teal/70 flex items-center gap-1">
              <IndianRupee className="size-3.5" /> Official Fee
            </span>
            <p className="mt-1 text-base sm:text-lg font-extrabold text-teal truncate">
              {item.fee_text || 'See official portal'}
            </p>
          </div>

          <div className="rounded-2xl bg-cream/70 p-3 shadow-clay">
            <span className="text-[11px] font-semibold text-teal/70 flex items-center gap-1">
              <Clock className="size-3.5" /> Processing Time
            </span>
            <p className="mt-1 text-base sm:text-lg font-extrabold text-teal truncate">
              {item.processing_time_text || 'Standard turnaround'}
            </p>
          </div>

          <div className="rounded-2xl bg-cream/70 p-3 shadow-clay">
            <span className="text-[11px] font-semibold text-teal/70 flex items-center gap-1">
              <FileText className="size-3.5" /> Required Documents
            </span>
            <p className="mt-1 text-base sm:text-lg font-extrabold text-teal">
              {item.required_documents.length} document{item.required_documents.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="rounded-2xl bg-cream/70 p-3 shadow-clay">
            <span className="text-[11px] font-semibold text-teal/70 flex items-center gap-1">
              <HandHelping className="size-3.5" /> Physical Assistance
            </span>
            <p className="mt-1 text-xs sm:text-sm font-bold text-teal">
              {item.assistance_available ? 'Available nearby' : 'Online only'}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Comprehensive Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section 1: What is this Service & Who Needs It? */}
          <Card className="p-5 sm:p-6">
            <SectionTitle
              title={
                <div className="flex items-center gap-2 text-teal">
                  <Info className="size-5" />
                  <span>What is this Service?</span>
                </div>
              }
            />
            <p className="text-xs sm:text-sm text-teal/80 leading-relaxed">
              {item.description || 'Details available on the official government website.'}
            </p>

            {item.who_needs_it && (
              <div className="mt-4 rounded-2xl border border-line bg-canvas/40 p-4">
                <span className="text-xs font-bold text-teal uppercase tracking-wider block mb-1">
                  Who Needs It?
                </span>
                <p className="text-xs text-teal/80 leading-relaxed">{item.who_needs_it}</p>
              </div>
            )}
          </Card>

          {/* Section 2: Eligibility Criteria */}
          {item.eligibility_text && (
            <Card className="p-5 sm:p-6">
              <SectionTitle
                title={
                  <div className="flex items-center gap-2 text-teal">
                    <UserCheck className="size-5" />
                    <span>Who is Eligible?</span>
                  </div>
                }
              />
              <p className="text-xs sm:text-sm text-teal/80 leading-relaxed">
                {item.eligibility_text}
              </p>
            </Card>
          )}

          {/* Section 3: Required Documents Checklist */}
          {item.required_documents.length > 0 && (
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
                Ensure you have clear scanned copies and original documents before beginning your application.
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
                          Optional
                        </Badge>
                      )}
                    </div>
                    {doc.spec && (
                      <p className="mt-1 text-[11px] text-teal/70 italic">Note: {doc.spec}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Section 4: Step-by-Step Process */}
          {item.process_steps.length > 0 && (
            <Card className="p-5 sm:p-6">
              <SectionTitle
                title={
                  <div className="flex items-center gap-2 text-teal">
                    <CheckCircle2 className="size-5" />
                    <span>Step-by-Step Application Process</span>
                  </div>
                }
              />

              <div className="relative mt-4 space-y-4 before:absolute before:bottom-3 before:left-4 before:top-3 before:w-0.5 before:bg-line">
                {item.process_steps.map((st, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-teal text-cream text-xs font-bold shadow-clay ring-4 ring-cream">
                      {st.step || idx + 1}
                    </div>
                    <div className="flex-1 rounded-2xl border border-line bg-canvas/40 p-3.5">
                      <h3 className="font-bold text-xs sm:text-sm text-teal">{st.title}</h3>
                      <p className="mt-1 text-xs text-teal/80 leading-relaxed">{st.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Authority, Fee, Official Link & Assistance */}
        <div className="space-y-6">
          {/* Authority Details */}
          <Card className="p-5">
            <SectionTitle
              title={
                <div className="flex items-center gap-2 text-teal">
                  <Landmark className="size-4" />
                  <span>Responsible Authority</span>
                </div>
              }
            />

            <div className="mt-3 space-y-2 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-teal/70">Department / Body:</span>
                <p className="font-bold text-teal">{item.authority_name || 'Government Authority'}</p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-teal/70">Jurisdiction Level:</span>
                <p className="capitalize text-teal font-medium">
                  {item.authority_level || 'Central'} Level
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-teal/70">Applicable States:</span>
                <p className="text-teal font-medium">{locationText}</p>
              </div>
            </div>
          </Card>

          {/* Official Fee & Processing Time */}
          <Card className="p-5">
            <SectionTitle
              title={
                <div className="flex items-center gap-2 text-teal">
                  <IndianRupee className="size-4" />
                  <span>Fee & Processing Time</span>
                </div>
              }
            />

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="rounded-xl border border-line bg-canvas/40 p-3">
                <span className="text-[11px] font-semibold text-teal/70">Government Fee</span>
                <p className="text-sm font-extrabold text-teal">
                  {item.fee_text || 'See official portal'}
                </p>
              </div>

              <div className="rounded-xl border border-line bg-canvas/40 p-3">
                <span className="text-[11px] font-semibold text-teal/70">Estimated Turnaround</span>
                <p className="text-sm font-extrabold text-teal">
                  {item.processing_time_text || 'Subject to departmental verification'}
                </p>
              </div>
            </div>
          </Card>

          {/* Official Application Route */}
          <Card className="p-5">
            <SectionTitle
              title={
                <div className="flex items-center gap-2 text-teal">
                  <ExternalLink className="size-4" />
                  <span>Official Application Route</span>
                </div>
              }
            />

            <div className="mt-3 space-y-2.5">
              {(item.apply_url || item.official_url) && (
                <a
                  href={item.apply_url || item.official_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clay-press flex items-center justify-between rounded-xl bg-teal p-3.5 text-xs font-bold text-cream shadow-clay hover:bg-teal/90"
                >
                  <span>Open Official Application Portal</span>
                  <ExternalLink className="size-4" />
                </a>
              )}

              {item.official_url && item.apply_url && item.official_url !== item.apply_url && (
                <a
                  href={item.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-line bg-canvas/60 p-2.5 text-xs font-medium text-teal/80 hover:bg-canvas"
                >
                  <span>Department Website</span>
                  <ExternalLink className="size-3" />
                </a>
              )}

              <p className="text-[11px] text-teal/70 leading-normal pt-1">
                ApplyFields never charges intermediary fees for government services. Always verify that the portal URL ends with <code className="font-mono font-semibold">.gov.in</code> or <code className="font-mono font-semibold">.nic.in</code>.
              </p>
            </div>
          </Card>

          {/* Verified Nearby Assistance */}
          {item.assistance_available && (
            <Card className="p-5 border-teal/20 bg-celadon/20">
              <div className="flex items-start gap-2.5">
                <HandHelping className="mt-0.5 size-5 text-tea shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-teal">Need in-person assistance?</h4>
                  <p className="mt-1 text-[11px] text-teal/80 leading-normal">
                    This service can be filed through verified physical MeeSeva centres and Common Service Centres (CSC).
                  </p>
                  <Link
                    href="/assistance"
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-sea hover:underline"
                  >
                    Find verified centres nearby <ChevronRight className="size-3" />
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
