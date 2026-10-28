'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  GitCompare,
  GraduationCap,
  HelpCircle,
  IndianRupee,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { OpportunityCard, OpportunityDetail, OpportunityList } from '@applyfields/types';
import { Badge, buttonClass, Card, SectionTitle } from '@applyfields/ui';
import { useCompare } from '@/components/opportunity-compare/compare-context';
import { apiGet } from '@/lib/api';
import {
  DATE_KIND_LABEL,
  daysLeftLabel,
  estimateSalary,
  formatCurrency,
  formatDate,
  STATE_NAMES,
  TYPE_META,
  urgencyTone,
} from '@/lib/format';

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items: compareTrayItems, removeItem, clear } = useCompare();

  const slugA = searchParams.get('a') || compareTrayItems[0]?.slug || null;
  const slugB = searchParams.get('b') || compareTrayItems[1]?.slug || null;

  const [itemA, setItemA] = useState<OpportunityDetail | null>(null);
  const [itemB, setItemB] = useState<OpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Search picker for empty slots
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OpportunityCard[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadDetails() {
      setLoading(true);
      try {
        const [resA, resB] = await Promise.all([
          slugA ? apiGet<OpportunityDetail>(`/opportunities/${slugA}`) : Promise.resolve(null),
          slugB ? apiGet<OpportunityDetail>(`/opportunities/${slugB}`) : Promise.resolve(null),
        ]);
        if (!active) return;
        setItemA(resA);
        setItemB(resB);
      } catch (err) {
        // Fallback gracefully
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDetails();
    return () => {
      active = false;
    };
  }, [slugA, slugB]);

  // Search opportunities when query changes
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiGet<OpportunityList>(`/opportunities?q=${encodeURIComponent(searchQuery)}`);
        if (res?.items) setSearchResults(res.items.slice(0, 5));
      } catch {
        // Ignore
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectOpp = (targetSlot: 'a' | 'b', slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(targetSlot, slug);
    router.push(`/compare?${params.toString()}`);
    setSearchQuery('');
  };

  const removeOpp = (targetSlot: 'a' | 'b') => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(targetSlot);
    const removedSlug = targetSlot === 'a' ? slugA : slugB;
    if (removedSlug) removeItem(removedSlug);
    router.push(`/compare?${params.toString()}`);
  };

  if (!slugA && !slugB && compareTrayItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-teal/10 text-teal">
          <GitCompare className="size-8" />
        </div>
        <h1 className="mt-4 text-2xl font-black text-teal">Opportunity Comparison</h1>
        <p className="mt-2 text-sm text-teal/70">
          You haven’t selected any opportunities to compare yet. Add opportunities from any listing or detail page to inspect vacancies, salaries, age limits, and selection processes side-by-side.
        </p>
        <Link href="/apply" className={buttonClass({ className: 'mt-6 inline-flex' })}>
          Browse Opportunities <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <Link
            href="/apply"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal/70 hover:text-teal mb-2"
          >
            <ArrowLeft className="size-3.5" /> Back to opportunities
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-teal flex items-center gap-2.5">
              <GitCompare className="size-7 text-sea" /> Side-by-Side Comparison
            </h1>
            <Badge tone="celadon">2 Items</Badge>
          </div>
          <p className="mt-1 text-xs text-teal/70">
            Compare eligibility criteria, pay scale, timeline deadlines, and exam stages side by side.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-teal/80 hover:bg-cream"
          >
            <Trash2 className="size-3.5" /> Clear Both
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[720px] grid grid-cols-2 gap-4 sm:gap-6">
          {/* Column A */}
          <div className="space-y-4">
            {itemA ? (
              <OpportunityCompareCard
                item={itemA}
                slot="a"
                onRemove={() => removeOpp('a')}
                otherItem={itemB}
              />
            ) : (
              <EmptySlotCard
                slot="a"
                query={searchQuery}
                onQueryChange={setSearchQuery}
                results={searchResults}
                searching={searching}
                onSelect={(slug) => selectOpp('a', slug)}
              />
            )}
          </div>

          {/* Column B */}
          <div className="space-y-4">
            {itemB ? (
              <OpportunityCompareCard
                item={itemB}
                slot="b"
                onRemove={() => removeOpp('b')}
                otherItem={itemA}
              />
            ) : (
              <EmptySlotCard
                slot="b"
                query={searchQuery}
                onQueryChange={setSearchQuery}
                results={searchResults}
                searching={searching}
                onSelect={(slug) => selectOpp('b', slug)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OpportunityCompareCard({
  item,
  slot,
  onRemove,
  otherItem,
}: {
  item: OpportunityDetail;
  slot: 'a' | 'b';
  onRemove: () => void;
  otherItem: OpportunityDetail | null;
}) {
  const meta = TYPE_META[item.type];
  const generalEligibility = item.eligibility.find((e) => e.post_id === null) ?? item.eligibility[0];
  const salaryEst = estimateSalary(item.posts[0]?.pay_level || item.posts[0]?.salary_text);

  const otherVacancies = otherItem?.vacancies_total;
  const isHigherVacancies =
    item.vacancies_total !== null &&
    otherVacancies !== null &&
    otherVacancies !== undefined &&
    item.vacancies_total > otherVacancies;

  const states = item.state_codes.filter((s) => s !== 'ALL');
  const locationText =
    states.length === 0
      ? 'All India'
      : states.map((s) => STATE_NAMES[s] ?? s).join(', ');

  const detailUrl =
    item.type === 'govt_job' ? `/jobs/${item.slug}` :
    item.type === 'exam' ? `/exams/${item.slug}` :
    item.type === 'scholarship' ? `/scholarships/${item.slug}` :
    item.type === 'admission' ? `/admissions/${item.slug}` :
    `/services/${item.slug}`;

  return (
    <Card className="p-5 sm:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Badge tone={meta.tone === 'sea' ? 'teal' : meta.tone} className="text-[10px]">
              {meta.label}
            </Badge>
            <span className="text-[11px] font-semibold text-teal/70 uppercase">
              {item.organization.short_name || item.organization.name}
            </span>
          </div>
          <Link href={detailUrl} className="text-lg font-black text-teal hover:text-sea hover:underline line-clamp-2">
            {item.title}
          </Link>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-1 text-teal/40 hover:bg-cream hover:text-teal shrink-0"
          title="Remove from comparison"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Row: Vacancies */}
      <div className="rounded-xl border border-line bg-canvas/60 p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-teal/70 flex items-center gap-1.5 uppercase tracking-wider">
            <Users className="size-3.5 text-teal" /> Vacancies
          </span>
          {isHigherVacancies && (
            <span className="rounded bg-celadon/50 px-1.5 py-0.5 text-[10px] font-extrabold text-teal">
              More Seats
            </span>
          )}
        </div>
        <p className="mt-1 text-xl font-extrabold text-teal">
          {item.vacancies_total !== null ? item.vacancies_total.toLocaleString('en-IN') : 'Check notice'}
        </p>
        {item.posts.length > 1 && (
          <p className="text-[11px] text-teal/60 mt-0.5">Across {item.posts.length} posts</p>
        )}
      </div>

      {/* Row: Salary / In-hand */}
      <div className="rounded-xl border border-line bg-canvas/60 p-3.5">
        <span className="text-xs font-bold text-teal/70 flex items-center gap-1.5 uppercase tracking-wider">
          <IndianRupee className="size-3.5 text-teal" /> In-Hand Salary
        </span>
        <p className="mt-1 text-base font-extrabold text-teal">
          {salaryEst ? salaryEst.formatted : (item.posts[0]?.salary_text || 'As per commission norms')}
        </p>
        {item.posts[0]?.pay_level && (
          <p className="text-[11px] text-sea font-semibold mt-0.5">
            7th CPC Pay Level {item.posts[0].pay_level}
          </p>
        )}
      </div>

      {/* Row: Deadline */}
      <div className="rounded-xl border border-line bg-canvas/60 p-3.5">
        <span className="text-xs font-bold text-teal/70 flex items-center gap-1.5 uppercase tracking-wider">
          <Clock className="size-3.5 text-teal" /> Application Deadline
        </span>
        <p className="mt-1 text-sm font-extrabold text-teal">
          {item.application_end ? formatDate(item.application_end) : 'Dates to be announced'}
        </p>
        <div className="mt-1">
          <Badge tone={urgencyTone(item.days_left)} className="text-[10px]">
            {daysLeftLabel(item.days_left)}
          </Badge>
        </div>
      </div>

      {/* Row: Age Limits */}
      <div className="rounded-xl border border-line bg-canvas/60 p-3.5">
        <span className="text-xs font-bold text-teal/70 flex items-center gap-1.5 uppercase tracking-wider">
          <Calendar className="size-3.5 text-teal" /> Age Limits
        </span>
        <p className="mt-1 text-sm font-bold text-teal">
          {generalEligibility?.age_min ? `${generalEligibility.age_min} to ` : 'Up to '}
          {generalEligibility?.age_max ? `${generalEligibility.age_max} years` : 'No upper age limit'}
        </p>
        {generalEligibility?.age_relaxations && (
          <p className="text-[11px] text-teal/65 mt-0.5">
            OBC: +3 yrs | SC/ST: +5 yrs standard relaxations
          </p>
        )}
      </div>

      {/* Row: Qualification */}
      <div className="rounded-xl border border-line bg-canvas/60 p-3.5">
        <span className="text-xs font-bold text-teal/70 flex items-center gap-1.5 uppercase tracking-wider">
          <GraduationCap className="size-3.5 text-teal" /> Qualification
        </span>
        <p className="mt-1 text-xs font-bold text-teal leading-relaxed">
          {generalEligibility?.qualification_streams?.join(', ') ||
            generalEligibility?.qualification_level ||
            'Check official recruitment notification'}
        </p>
      </div>

      {/* Row: Application Fee */}
      <div className="rounded-xl border border-line bg-canvas/60 p-3.5">
        <span className="text-xs font-bold text-teal/70 flex items-center gap-1.5 uppercase tracking-wider">
          <IndianRupee className="size-3.5 text-teal" /> Application Fee
        </span>
        {item.fees.length > 0 ? (
          <div className="mt-1.5 space-y-1 text-xs">
            {item.fees.slice(0, 3).map((f, i) => (
              <div key={i} className="flex justify-between text-teal/80">
                <span>{f.category}:</span>
                <span className="font-bold">{f.amount === 0 ? 'NIL (Free)' : formatCurrency(f.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-xs text-teal/70">{item.fee_text || 'See notification'}</p>
        )}
      </div>

      {/* Row: Selection Stages */}
      <div className="rounded-xl border border-line bg-canvas/60 p-3.5">
        <span className="text-xs font-bold text-teal/70 flex items-center gap-1.5 uppercase tracking-wider">
          <CheckCircle2 className="size-3.5 text-teal" /> Selection Process
        </span>
        {item.selection_process && item.selection_process.length > 0 ? (
          <ol className="mt-1.5 space-y-1 text-xs text-teal/80 list-decimal pl-4">
            {item.selection_process.map((stage, idx) => (
              <li key={idx} className="font-medium">{stage}</li>
            ))}
          </ol>
        ) : (
          <p className="mt-1 text-xs text-teal/65">Written exam / interview as per commission norms</p>
        )}
      </div>

      {/* Row: Location */}
      <div className="rounded-xl border border-line bg-canvas/60 p-3.5">
        <span className="text-xs font-bold text-teal/70 flex items-center gap-1.5 uppercase tracking-wider">
          <MapPin className="size-3.5 text-teal" /> Job Location / Domicile
        </span>
        <p className="mt-1 text-xs font-bold text-teal">{locationText}</p>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2">
        {item.links.apply_url && (
          <a
            href={item.links.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="clay-press flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal py-2.5 px-3 text-xs font-extrabold text-cream shadow-clay hover:bg-teal/90"
          >
            <span>Apply Official</span>
            <ExternalLink className="size-3.5" />
          </a>
        )}
        <Link
          href={detailUrl}
          className="clay-press flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-cream py-2.5 px-3 text-xs font-bold text-teal shadow-clay hover:bg-tea"
        >
          <span>Full Details</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Card>
  );
}

function EmptySlotCard({
  slot,
  query,
  onQueryChange,
  results,
  searching,
  onSelect,
}: {
  slot: 'a' | 'b';
  query: string;
  onQueryChange: (q: string) => void;
  results: OpportunityCard[];
  searching: boolean;
  onSelect: (slug: string) => void;
}) {
  return (
    <Card className="p-6 border-dashed border-2 border-line bg-canvas/40 flex flex-col justify-center items-center min-h-[480px] text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-teal/10 text-teal mb-3">
        <Plus className="size-6" />
      </div>
      <h3 className="text-base font-bold text-teal">Select Opportunity #{slot === 'a' ? '1' : '2'}</h3>
      <p className="mt-1 text-xs text-teal/70 max-w-xs">
        Search and pick another opportunity to compare side-by-side.
      </p>

      {/* Search Input */}
      <div className="mt-4 w-full max-w-sm relative">
        <Search className="size-4 absolute left-3 top-3 text-teal/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by job title or organization..."
          className="w-full rounded-xl border border-line bg-canvas pl-9 pr-3 py-2 text-xs text-teal outline-none focus:border-teal"
        />

        {/* Results dropdown */}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-xl border border-line bg-canvas p-1 shadow-lg text-left divide-y divide-line/60">
            {results.map((r) => (
              <button
                key={r.slug}
                type="button"
                onClick={() => onSelect(r.slug)}
                className="w-full text-left p-2.5 hover:bg-cream rounded-lg transition-colors"
              >
                <p className="text-xs font-bold text-teal truncate">{r.title}</p>
                <p className="text-[10px] text-teal/60">{r.organization}</p>
              </button>
            ))}
          </div>
        )}

        {searching && (
          <p className="text-[11px] text-teal/50 mt-1 italic">Searching opportunities...</p>
        )}
      </div>
    </Card>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-teal/70">Loading comparison...</div>}>
      <CompareContent />
    </Suspense>
  );
}
