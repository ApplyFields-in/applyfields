import type { Metadata } from 'next';
import type { GovServiceList } from '@applyfields/types';
import { Badge, Card, EmptyState, IconTile, PageHeader, SectionTitle } from '@applyfields/ui';
import {
  Baby,
  BadgeCheck,
  Building,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  HandHelping,
  IdCard,
  IndianRupee,
  Landmark,
  MapPin,
  Plane,
  RotateCcw,
  ScrollText,
  Search,
  ShieldCheck,
  Store,
} from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/opportunity';
import { apiGet } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Government Citizen Services in India — PAN, Passport, Certificates',
  description:
    'Find authoritative information and step-by-step guides for Indian citizen services: PAN card, passport, caste & income certificates, driving licenses, and Aadhaar updates with official application links.',
  alternates: {
    canonical: 'https://applyfields.in/services',
  },
};

const CATEGORIES = [
  'Identity & Certificates',
  'Revenue & Land',
  'Transport & Vehicles',
  'Social Welfare & Pensions',
  'Business & Licenses',
  'Utility & Municipal',
];

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; state?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const category = sp.category?.trim() || '';
  const state = sp.state?.trim() || '';

  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (category) query.set('category', category);
  if (state) query.set('state', state);

  const data = await apiGet<GovServiceList>(`/services${query.size ? `?${query}` : ''}`);

  const buildCategoryUrl = (cat: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (state) params.set('state', state);
    if (cat && cat !== 'All') params.set('category', cat);
    const qs = params.toString();
    return qs ? `/services?${qs}` : '/services';
  };

  const hasActiveFilters = Boolean(q || category || state);

  return (
    <>
      <PageHeader
        eyebrow="Apply mode"
        title="Government services"
        description="PAN, passport, certificates and other citizen services — explained simply, with the official route and verified help nearby."
        icon={<Landmark />}
      />

      {/* Filter and Search Bar */}
      <div className="mb-6 space-y-3">
        <form action="/services" method="GET" className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal/70"
              aria-hidden="true"
            />
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search services (e.g. PAN card, caste certificate, passport)..."
              className="h-11 w-full rounded-full bg-cream pl-10 pr-4 text-sm shadow-pressed outline-none transition-shadow placeholder:text-teal/70 focus:shadow-clay"
            />
          </div>

          {category && <input type="hidden" name="category" value={category} />}

          <div className="flex flex-wrap items-center gap-2">
            <select
              name="state"
              defaultValue={state}
              className="h-11 rounded-full bg-cream px-3.5 text-xs font-semibold text-teal shadow-clay outline-none"
            >
              <option value="">All States</option>
              <option value="AP">Andhra Pradesh</option>
              <option value="TS">Telangana</option>
              <option value="KA">Karnataka</option>
              <option value="TN">Tamil Nadu</option>
              <option value="MH">Maharashtra</option>
              <option value="KL">Kerala</option>
              <option value="DL">Delhi</option>
              <option value="UP">Uttar Pradesh</option>
            </select>

            <button
              type="submit"
              className="clay-press inline-flex h-11 items-center justify-center rounded-full bg-teal px-4 text-xs font-bold text-cream shadow-clay hover:bg-teal/90"
            >
              Search
            </button>

            {hasActiveFilters && (
              <Link
                href="/services"
                className="clay-press inline-flex h-11 items-center gap-1.5 rounded-full bg-cream px-3.5 text-xs font-semibold text-teal shadow-clay hover:bg-tea"
                title="Clear all filters"
              >
                <RotateCcw className="size-3.5" /> Reset
              </Link>
            )}
          </div>
        </form>

        {/* Category Pills (Horizontal scroll at 390px) */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3 pt-1 scrollbar-none">
          <Link
            href={buildCategoryUrl('')}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              !category
                ? 'bg-teal text-cream shadow-clay'
                : 'bg-cream text-teal shadow-clay hover:bg-tea'
            }`}
          >
            All Services
          </Link>
          {CATEGORIES.map((c) => {
            const isSelected = category.toLowerCase() === c.toLowerCase();
            return (
              <Link
                key={c}
                href={buildCategoryUrl(c)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-teal text-cream shadow-clay'
                    : 'bg-cream text-teal shadow-clay hover:bg-tea'
                }`}
              >
                {c}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Services Content */}
      {data === null ? (
        <ApiOffline />
      ) : data.total === 0 ? (
        <EmptyState
          icon={<Landmark />}
          title={hasActiveFilters ? 'No services match your search' : 'No citizen services published yet'}
          text={
            hasActiveFilters
              ? 'Try searching with simpler terms or resetting the selected filters.'
              : 'Our editorial team is reviewing and publishing authoritative citizen service procedures.'
          }
          action={
            hasActiveFilters ? (
              <Link
                href="/services"
                className="clay-press inline-flex h-9 items-center gap-1.5 rounded-full bg-teal px-4 text-xs font-bold text-cream shadow-clay hover:bg-teal/90"
              >
                <RotateCcw className="size-3.5" /> Clear filters
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-teal">
              {data.total} citizen service{data.total === 1 ? '' : 's'} available
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {data.items.map((srv) => (
              <Card key={srv.slug} interactive className="flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <IconTile tone="tea" className="size-11 rounded-2xl shrink-0">
                    <Landmark className="size-5" />
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-teal/80 truncate">
                        {srv.authority_name || 'Government Authority'}
                      </span>
                    </div>
                    <Link
                      href={`/services/${srv.slug}`}
                      className="mt-0.5 line-clamp-2 font-bold leading-snug text-teal hover:underline"
                    >
                      {srv.name}
                    </Link>
                  </div>
                </div>

                {srv.description && (
                  <p className="mt-2.5 line-clamp-2 text-xs text-teal/80 leading-relaxed">
                    {srv.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone="outline" className="text-[11px]">
                    <MapPin className="size-3" aria-hidden="true" />
                    {srv.location}
                  </Badge>

                  {srv.category && (
                    <Badge tone="tea" className="text-[11px]">
                      {srv.category}
                    </Badge>
                  )}

                  {srv.required_documents_count > 0 && (
                    <Badge tone="outline" className="text-[11px]">
                      <FileText className="size-3" aria-hidden="true" />
                      {srv.required_documents_count} document{srv.required_documents_count === 1 ? '' : 's'}
                    </Badge>
                  )}

                  {srv.fee_text && (
                    <Badge tone="celadon" className="text-[11px]">
                      <IndianRupee className="size-3" aria-hidden="true" />
                      {srv.fee_text}
                    </Badge>
                  )}

                  {srv.processing_time_text && (
                    <Badge tone="tea" className="text-[11px]">
                      <Clock className="size-3" aria-hidden="true" />
                      {srv.processing_time_text}
                    </Badge>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-teal/80">
                  <span className="flex items-center gap-1 text-teal font-medium">
                    <ShieldCheck className="size-3.5 text-sea" /> Official route
                  </span>
                  {srv.assistance_available && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-teal/80">
                      <HandHelping className="size-3" /> MeeSeva / CSC help
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Verified Partners & Service Assistance Note */}
      <Card className="mt-8 p-5">
        <SectionTitle title="About Government Services on ApplyFields" />
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <li className="flex gap-2 text-sm text-teal">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sea" aria-hidden="true" />
            Direct links only to official portals — never intermediaries
          </li>
          <li className="flex gap-2 text-sm text-teal">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sea" aria-hidden="true" />
            Clear document checklists so your application isn't rejected
          </li>
          <li className="flex gap-2 text-sm text-teal">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sea" aria-hidden="true" />
            Official government fees and standard processing turnaround
          </li>
          <li className="flex gap-2 text-sm text-teal">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sea" aria-hidden="true" />
            Step-by-step guides for both online and offline routes
          </li>
          <li className="flex gap-2 text-sm text-teal">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sea" aria-hidden="true" />
            Optional verified physical assistance from MeeSeva / CSC centres
          </li>
        </ul>
      </Card>
    </>
  );
}
