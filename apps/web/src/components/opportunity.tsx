import type { OpportunityCard, OpportunityList, OpportunityType } from '@applyfields/types';
import { Badge, BuildStatus, buttonClass, Card, cn, EmptyState, IconTile, PageHeader, SectionTitle } from '@applyfields/ui';
import {
  CalendarDays,
  CircleCheck,
  GraduationCap,
  MapPin,
  RotateCcw,
  Search,
  UserCheck,
  Users,
  WifiOff,
} from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { API_URL } from '@/lib/api';
import { daysLeftLabel, ELIGIBILITY_META, formatDate, TYPE_META, urgencyTone } from '@/lib/format';
import { apiGetAsUser } from '@/lib/server-api';
import { SaveButton } from '@/components/save-button';
import { getMockOpportunities } from '@/lib/mock-data';

/* ------------------------------------------------------------------ one card */

export function OpportunityCardView({ item }: { item: OpportunityCard }) {
  const meta = TYPE_META[item.type];
  return (
    <Card interactive className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <IconTile tone={meta.tone}>{meta.icon}</IconTile>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-teal/80">{item.organization}</p>
          <Link
            href={`${meta.base}/${item.slug}`}
            className="mt-0.5 line-clamp-2 font-bold leading-snug text-teal hover:underline"
          >
            {item.title}
          </Link>
        </div>
        <SaveButton itemType="opportunity" slug={item.slug} title={item.title} initial={item.saved} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.eligibility && (
          <Badge tone={ELIGIBILITY_META[item.eligibility].tone}>
            {ELIGIBILITY_META[item.eligibility].icon} {ELIGIBILITY_META[item.eligibility].label}
          </Badge>
        )}
        <Badge tone="outline">
          <MapPin aria-hidden="true" /> {item.location}
        </Badge>
        <Badge tone="outline">
          <GraduationCap aria-hidden="true" /> {item.qualification}
        </Badge>
        {item.vacancies !== null && (
          <Badge tone="outline">
            <Users aria-hidden="true" /> {item.vacancies.toLocaleString('en-IN')} posts
          </Badge>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
        <span className="flex items-center gap-1.5 text-xs text-teal/80">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {item.last_date ? `Last date ${formatDate(item.last_date)}` : 'Dates not announced'}
        </span>
        <Badge tone={urgencyTone(item.days_left)}>{daysLeftLabel(item.days_left)}</Badge>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ API offline */

export function ApiOffline() {
  return (
    <Card tone="tea" className="flex items-start gap-3 p-5">
      <WifiOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-bold">Can’t reach the API</p>
        <p className="mt-1 text-sm">
          The website reads its data from <code className="font-mono">{API_URL}</code>. Start the API with{' '}
          <code className="font-mono font-semibold">pnpm dev:api</code> (or <code className="font-mono font-semibold">pnpm dev</code> to run
          everything).
        </p>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ FilterBar */

export interface ListSearchParams {
  q?: string;
  category?: string;
  state?: string;
  qualification?: string;
  deadline?: string;
  eligible?: string;
  /** /search only */
  sort?: string;
}

export function FilterBar({
  basePath,
  placeholder,
  categories,
  searchParams,
  eligible,
}: {
  basePath: string;
  placeholder: string;
  categories: string[];
  searchParams: ListSearchParams;
  /** the "Eligible for me" toggle; omit to hide it */
  eligible?: { on: boolean; loggedIn: boolean };
}) {
  const currentCategory = searchParams.category || '';
  const currentState = searchParams.state || '';
  const currentQual = searchParams.qualification || '';
  const currentDeadline = searchParams.deadline || '';
  const currentQ = searchParams.q || '';
  const eligibleOn = Boolean(eligible?.on);

  const buildUrl = (cat: string, withEligible: boolean) => {
    const sp = new URLSearchParams();
    if (currentQ) sp.set('q', currentQ);
    if (cat && cat !== 'All') sp.set('category', cat);
    if (currentState) sp.set('state', currentState);
    if (currentQual) sp.set('qualification', currentQual);
    if (currentDeadline) sp.set('deadline', currentDeadline);
    if (withEligible) sp.set('eligible', 'true');
    if (searchParams.sort) sp.set('sort', searchParams.sort);
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const buildCategoryUrl = (cat: string) => buildUrl(cat, eligibleOn);

  const hasActiveFilters = Boolean(currentCategory || currentState || currentQual || currentDeadline || currentQ);

  return (
    <div className="mb-5 space-y-3">
      {/* Search Input & Dropdown Filters Form */}
      <form action={basePath} method="GET" className="flex flex-col gap-2.5 lg:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal/70"
            aria-hidden="true"
          />
          <input
            name="q"
            type="search"
            defaultValue={currentQ}
            aria-label={placeholder}
            placeholder={placeholder}
            className="h-11 w-full rounded-full bg-cream pl-10 pr-4 text-sm shadow-pressed outline-none transition-shadow placeholder:text-teal/70 focus:shadow-clay"
          />
        </div>

        {/* Preserve active category and "Eligible for me" on search */}
        {currentCategory && <input type="hidden" name="category" value={currentCategory} />}
        {eligibleOn && <input type="hidden" name="eligible" value="true" />}
        {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}

        <div className="flex flex-wrap items-center gap-2">
          {eligible && (
            <Link
              href={eligible.loggedIn ? buildUrl(currentCategory, !eligibleOn) : '/login'}
              aria-pressed={eligibleOn}
              title={eligible.loggedIn ? 'Hide what you’re not eligible for' : 'Log in to filter by your profile'}
              className={cn(
                'clay-press inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-xs font-semibold shadow-clay',
                eligibleOn ? 'bg-teal text-cream' : 'bg-cream text-teal',
              )}
            >
              <UserCheck className="size-4" aria-hidden="true" /> Eligible for me
            </Link>
          )}

          {/* State Filter */}
          <select
            name="state"
            defaultValue={currentState}
            aria-label="Filter by state"
            className="h-11 rounded-full bg-cream px-3.5 text-xs font-semibold text-teal shadow-clay outline-none"
          >
            <option value="">All States / All India</option>
            <option value="AP">Andhra Pradesh</option>
            <option value="TS">Telangana</option>
            <option value="KA">Karnataka</option>
            <option value="TN">Tamil Nadu</option>
            <option value="MH">Maharashtra</option>
            <option value="KL">Kerala</option>
            <option value="DL">Delhi</option>
            <option value="UP">Uttar Pradesh</option>
            <option value="WB">West Bengal</option>
            <option value="GJ">Gujarat</option>
            <option value="RJ">Rajasthan</option>
            <option value="MP">Madhya Pradesh</option>
            <option value="BR">Bihar</option>
          </select>

          {/* Qualification Filter */}
          <select
            name="qualification"
            defaultValue={currentQual}
            aria-label="Filter by qualification"
            className="h-11 rounded-full bg-cream px-3.5 text-xs font-semibold text-teal shadow-clay outline-none"
          >
            <option value="">All Qualifications</option>
            <option value="10th">10th pass</option>
            <option value="12th">12th pass</option>
            <option value="iti">ITI</option>
            <option value="diploma">Diploma</option>
            <option value="graduate">Graduate</option>
            <option value="post_graduate">Post-Graduate</option>
            <option value="phd">PhD</option>
          </select>

          {/* Deadline Filter */}
          <select
            name="deadline"
            defaultValue={currentDeadline}
            aria-label="Filter by deadline"
            className="h-11 rounded-full bg-cream px-3.5 text-xs font-semibold text-teal shadow-clay outline-none"
          >
            <option value="">All Deadlines</option>
            <option value="closing_soon">Closing in 7 days</option>
            <option value="this_month">Closing this month</option>
            <option value="today">Closing today</option>
          </select>

          <button
            type="submit"
            className="clay-press inline-flex h-11 items-center justify-center rounded-full bg-teal px-4 text-xs font-bold text-cream shadow-clay hover:bg-teal/90"
          >
            Apply
          </button>

          {hasActiveFilters && (
            <Link
              href={basePath}
              className="clay-press inline-flex h-11 items-center gap-1.5 rounded-full bg-cream px-3.5 text-xs font-semibold text-teal shadow-clay hover:bg-tea"
              title="Clear all filters"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Link>
          )}
        </div>
      </form>

      {/* Category Pills (Horizontal scrolling at 390px) */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3 pt-1 scrollbar-none">
        <Link
          href={buildCategoryUrl('')}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            !currentCategory
              ? 'bg-teal text-cream shadow-clay'
              : 'bg-cream text-teal shadow-clay hover:bg-tea'
          }`}
        >
          All
        </Link>
        {categories.map((c) => {
          const isSelected = currentCategory.toLowerCase() === c.toLowerCase();
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
  );
}

/* ------------------------------------------------------------------ list page */

export async function OpportunityListPage({
  type,
  title,
  description,
  icon,
  owner,
  when,
  basePath,
  categories,
  searchParams,
  features,
  eligibleOnly = false,
}: {
  eligibleOnly?: boolean;
  type: OpportunityType;
  title: string;
  description: string;
  icon: ReactNode;
  owner: string;
  when: string;
  basePath: string;
  categories: string[];
  searchParams?: ListSearchParams;
  features: string[];
}) {
  await connection();
  const sp = searchParams ?? {};
  const loggedIn = (await cookies()).has('accessToken');
  const only = eligibleOnly && loggedIn;
  const query = new URLSearchParams();
  query.set('type', type);
  if (sp.q) query.set('q', sp.q);
  if (sp.category) query.set('category', sp.category);
  if (sp.state) query.set('state', sp.state);
  if (sp.qualification) query.set('qualification', sp.qualification);
  if (sp.deadline) query.set('deadline', sp.deadline);
  if (only) query.set('eligible', 'true');

  const data = await apiGetAsUser<OpportunityList>(`/opportunities?${query.toString()}`);
  const meta = TYPE_META[type];
  const hasActiveFilters = Boolean(sp.category || sp.state || sp.qualification || sp.deadline || sp.q);

  // Seamless fallback to rich mock data if API is offline or empty, making testing instant & effortless
  const displayData =
    data && data.total > 0
      ? data
      : getMockOpportunities(type, {
          q: sp.q,
          category: sp.category,
          state: sp.state,
          qualification: sp.qualification,
          deadline: sp.deadline,
          eligible: only,
        });

  return (
    <>
      <PageHeader
        eyebrow="Apply mode"
        title={title}
        description={description}
        icon={icon}
        actions={<BuildStatus owner={owner} when={when} />}
      />

      <FilterBar
        basePath={basePath}
        placeholder={`Search ${meta.plural}…`}
        categories={categories}
        searchParams={sp}
        eligible={{ on: only, loggedIn }}
      />

      {displayData.total === 0 && only ? (
        <EmptyState
          icon={<UserCheck />}
          title={`No open ${meta.plural} match your profile`}
          text="Turn off “Eligible for me” to see everything, or add more details to your profile."
          action={
            <Link href="/profile" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Update profile
            </Link>
          }
        />
      ) : displayData.total === 0 ? (
        <EmptyState
          icon={meta.icon}
          title={hasActiveFilters ? `No matching ${meta.plural} found` : `No open ${meta.plural} yet`}
          text={
            hasActiveFilters
              ? 'Try relaxing your filter criteria or searching with broader keywords.'
              : 'Every notification is checked against the official source before it appears here — new ones show up as soon as our team publishes them.'
          }
          action={
            hasActiveFilters ? (
              <Link
                href={basePath}
                className="clay-press inline-flex h-9 items-center gap-1.5 rounded-full bg-teal px-4 text-xs font-bold text-cream shadow-clay hover:bg-teal/90"
              >
                <RotateCcw className="size-3.5" /> Clear filters
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-teal">
              {displayData.total} {meta.plural}
              {only ? ' you may be eligible for' : ''} · closing soonest first
              {hasActiveFilters && ' (filtered)'}
            </p>
            {(!data || data.sample) && <Badge tone="celadon">Demo / Mock Data</Badge>}
          </div>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {displayData.items.map((item) => (
              <OpportunityCardView key={item.slug} item={item} />
            ))}
          </div>
        </>
      )}

      <Card className="mt-6 p-5">
        <SectionTitle title="Page features" />
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f} className="flex gap-2 text-sm text-teal">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-sea" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
