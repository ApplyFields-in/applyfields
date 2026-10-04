/**
 * Shapes of the Core API responses (apps/api) that the web and admin apps read.
 * Both sides import these, so a change here shows up as a type error on both sides.
 */
import type { OpportunityType, UpdateKind } from './opportunity';

export interface ApiHealth {
  status: 'ok';
  service: string;
  time: string;
}

/** A short opportunity, as shown in lists and cards. */
export interface OpportunityCard {
  slug: string;
  type: OpportunityType;
  title: string;
  organization: string;
  location: string;
  qualification: string;
  vacancies: number | null;
  last_date: string | null;   // YYYY-MM-DD
  days_left: number | null;
  tags: string[];
}

export interface OpportunityList {
  type: OpportunityType | 'all';
  query: string;
  total: number;
  items: OpportunityCard[];
  sample: boolean;            // true while the API returns sample data
}

export interface UpdateItem {
  id: string;
  kind: UpdateKind;
  title: string;
  organization: string;
  date: string;               // YYYY-MM-DD
  opportunity_slug: string | null;
}

export interface UpdateList {
  items: UpdateItem[];
  sample: boolean;
}

export interface HomeStat {
  key: 'open_jobs' | 'exams_this_month' | 'scholarships_open' | 'closing_this_week';
  label: string;
  value: number;
  hint: string;
}

export interface HomeSummary {
  generated_at: string;
  stats: HomeStat[];
  closing_soon: OpportunityCard[];
  popular: OpportunityCard[];
  updates: UpdateItem[];
  popular_searches: string[];
  sample: boolean;
}

/** Internal Portal dashboard. */
export interface ReviewQueueItem {
  id: string;
  title: string;
  source: string;
  confidence: number;          // 0–1
  found_at: string;            // ISO date-time
  kind: 'new' | 'change' | 'update';
}

export interface ScraperStatus {
  key: string;
  name: string;
  last_success_at: string | null;
  consecutive_failures: number;
}

export interface AdminSummary {
  stats: { key: string; label: string; value: number; hint: string }[];
  review_queue: ReviewQueueItem[];
  scrapers: ScraperStatus[];
  sample: boolean;
}
