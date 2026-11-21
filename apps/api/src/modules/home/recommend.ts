import type { Interest, LocationScope, OpportunityCard } from '@applyfields/types';

/** How each setup interest is recognised on a listing card. */
const MATCH: Record<Interest, (c: OpportunityCard) => boolean> = {
  railways: (c) => c.category === 'railways',
  banking: (c) => c.category === 'banking',
  defence: (c) => c.category === 'defence',
  police: (c) => c.category === 'police',
  psu: (c) => c.category === 'psu',
  state_psc: (c) => c.category === 'state_govt' || c.category === 'state',
  ssc: (c) => c.tags.includes('SSC'),
  upsc: (c) => c.tags.includes('UPSC'),
  // ponytail: title keywords until listings carry a "teaching" tag; add one to the category enum then.
  teaching: (c) => /teacher|\bTET\b|lecturer/i.test(c.title),
  scholarships: (c) => c.type === 'scholarship',
  admissions: (c) => c.type === 'admission',
  entrance: (c) => c.type === 'exam' && c.category === 'entrance',
  jobs_after_graduation: (c) => c.type === 'govt_job',
};

// Empty or missing state_codes = all India, same as the card's location label.
const isCentral = (c: OpportunityCard) => !c.state_codes?.length || c.state_codes.includes('ALL');

/** The state to rank by: the one picked in setup ("Your state"), else the domicile state. */
export function rankingState(
  p: { state_code: string | null; domicile_state_code: string | null } | null,
): string | null {
  return p?.state_code ?? p?.domicile_state_code ?? null;
}

/**
 * Home "Recommended" from the setup answers: +3 matches an interest, +2 is for the person's own
 * state, +1 closes within 14 days. Listings outside the chosen area are dropped (only when the
 * person's state is known). Highest score first, then nearest deadline; top 6.
 */
export function rankByPreferences(
  cards: OpportunityCard[],
  prefs: { interests: Interest[]; location_scope: LocationScope | null },
  userState: string | null,
): OpportunityCard[] {
  const ownState = (c: OpportunityCard) => !!userState && (c.state_codes ?? []).includes(userState);
  const inScope = (c: OpportunityCard) => {
    if (!userState || !prefs.location_scope || prefs.location_scope === 'all') return true;
    if (prefs.location_scope === 'state') return ownState(c);
    return ownState(c) || isCentral(c);
  };
  const score = (c: OpportunityCard) =>
    (prefs.interests.some((i) => MATCH[i]?.(c)) ? 3 : 0) +
    (ownState(c) ? 2 : 0) +
    (c.days_left !== null && c.days_left <= 14 ? 1 : 0);
  const deadline = (c: OpportunityCard) => c.days_left ?? Number.POSITIVE_INFINITY;

  return cards
    .filter(inScope)
    .map((c) => ({ c, s: score(c) }))
    .sort((a, b) => b.s - a.s || deadline(a.c) - deadline(b.c))
    .slice(0, 6)
    .map(({ c }) => c);
}
