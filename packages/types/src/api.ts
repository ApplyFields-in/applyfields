/**
 * Shapes of the Core API responses (apps/api) that the web and admin apps read.
 * Both sides import these, so a change here shows up as a type error on both sides.
 */
import type {
  AgeRelaxation,
  DateKind,
  Fee,
  FieldStatus,
  Gender,
  OpportunityCategory,
  OpportunityStatus,
  OpportunityType,
  OrganizationLevel,
  RequiredDocument,
  UpdateKind,
} from './opportunity';

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

// ---------- Internal Portal: review queue (GET /admin/review, GET /admin/review/:id) ----------

/** One draft in the review queue. */
export interface ReviewListItem {
  id: string;
  title: string;
  type: OpportunityType;
  organization: string;
  source_key: string | null;
  source_url: string | null;
  /** 0–1, null when the extractor gave none */
  confidence: number | null;
  /** when the scraper found it (source_fetched_at, else created_at) */
  found_at: string;
  /** confidence is missing or below 0.6 — "check carefully" (job-format §4.8) */
  needs_care: boolean;
  /** publish blockers (job-format §5) — empty = ready to publish */
  missing: string[];
}

export interface ReviewList {
  total: number;
  needs_care: number;
  /** downloaded notices the extractor hasn't turned into drafts yet */
  waiting_extraction: number;
  sources: string[];
  items: ReviewListItem[];
}

export interface ReviewPost {
  id: string;
  name: string;
  vacancies_total: number | null;
  vacancies_by_category: Record<string, number> | null;
  pay_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_text: string | null;
}

export interface ReviewEligibility {
  id: string;
  /** null = applies to the whole notification */
  post_id: string | null;
  age_min: number | null;
  age_max: number | null;
  age_as_on_date: string | null;
  age_relaxations: AgeRelaxation[];
  qualification_level: string | null;
  qualification_streams: string[];
  min_percentage: number | null;
  final_year_allowed: boolean | null;
  gender: Gender;
  domicile_states: string[];
  categories_allowed: string[];
  income_max: number | null;
  other_conditions: string[];
  official_text: string | null;
}

export interface ReviewDate {
  id: string;
  kind: DateKind;
  date: string;
  end_date: string | null;
  is_tentative: boolean;
  note: string | null;
}

/** Everything a reviewer needs to check one draft against its official PDF. */
export interface ReviewDetail {
  id: string;
  slug: string;
  status: OpportunityStatus;
  version: number;
  type: OpportunityType;
  category: OpportunityCategory;
  title: string;
  notification_number: string | null;
  summary: string | null;
  organization: { id: string; name: string; short_name: string | null; level: OrganizationLevel };
  state_codes: string[];
  districts: string[];
  vacancies_total: number | null;
  fees: Fee[];
  fee_text: string | null;
  payment_modes: string[];
  selection_process: string[];
  required_documents: RequiredDocument[];
  benefits_text: string | null;
  application_start: string | null;
  application_end: string | null;
  links: {
    notification_pdf_url: string | null;
    official_page_url: string | null;
    apply_url: string | null;
    official_website: string | null;
  };
  field_status: Record<string, FieldStatus>;
  source: {
    key: string | null;
    url: string | null;
    fetched_at: string | null;
    content_hash: string | null;
    extractor_version: string | null;
    ai_model: string | null;
    confidence: number | null;
  };
  posts: ReviewPost[];
  eligibility: ReviewEligibility[];
  dates: ReviewDate[];
  /**
   * The PDF to show beside the form.
   * signed = our stored copy (link expires) · official = the organisation's own URL · none = nothing to show
   */
  pdf: { url: string | null; kind: 'signed' | 'official' | 'none'; expires_at: string | null };
  /** publish blockers (job-format §5) — empty = ready to publish */
  missing: string[];
  needs_care: boolean;
  created_at: string;
  updated_at: string;
}

// ---------- Internal Portal: opportunities (create, edit, publish, unpublish, close) ----------

/** What the editor sends to create or save an opportunity. Dates are YYYY-MM-DD, empty = null. */
export interface OpportunityInput {
  title: string;
  type: OpportunityType;
  category: OpportunityCategory;
  organization_id: string;
  notification_number: string | null;
  summary: string | null;
  state_codes: string[];
  districts: string[];
  vacancies_total: number | null;
  fee_text: string | null;
  application_start: string | null;
  application_end: string | null;
  notification_pdf_url: string | null;
  official_page_url: string | null;
  apply_url: string | null;
  official_website: string | null;
  source_url: string | null;
  field_status: Record<string, FieldStatus>;
  /** the rules for the whole notification (null = none extracted yet) */
  eligibility: Omit<ReviewEligibility, 'id' | 'post_id'> | null;
  /** full list — posts missing from it are deleted; no id = new post */
  posts: (Omit<ReviewPost, 'id' | 'vacancies_by_category' | 'salary_min' | 'salary_max'> & { id?: string })[];
  /** full list — dates missing from it are deleted; no id = new date */
  dates: (Omit<ReviewDate, 'id'> & { id?: string })[];
}

/** Status changes other than publish. A reason is required to archive (= reject). */
export interface StatusChange {
  status: 'draft' | 'closed' | 'archived';
  reason?: string;
}

export interface AdminOpportunityListItem {
  id: string;
  slug: string;
  title: string;
  type: OpportunityType;
  status: OpportunityStatus;
  organization: string;
  source_key: string | null;
  application_end: string | null;
  version: number;
  updated_at: string;
  published_at: string | null;
}

export interface AdminOpportunityList {
  total: number;
  page: number;
  page_size: number;
  counts: Record<OpportunityStatus, number>;
  items: AdminOpportunityListItem[];
}

export interface OrganizationOption {
  id: string;
  name: string;
  short_name: string | null;
  level: OrganizationLevel;
}

/** Returned by every write: the fresh record, or why it was refused. */
export interface WriteResult {
  id: string;
  status: OpportunityStatus;
  version?: number;
}

// ---------- Internal Portal: results & updates ----------

export interface AdminUpdateListItem {
  id: string;
  kind: UpdateKind;
  title: string;
  date: string | null;
  status: OpportunityStatus;
  /** the job or service it belongs to */
  parent: { kind: 'opportunity' | 'service'; id: string; title: string; status: OpportunityStatus | null } | null;
  source_url: string | null;
  created_at: string;
}

export interface AdminUpdateList {
  total: number;
  counts: Record<OpportunityStatus, number>;
  items: AdminUpdateListItem[];
}

export interface AdminUpdateDetail extends AdminUpdateListItem {
  url: string | null;
  summary: string | null;
  published_at: string | null;
  updated_at: string;
  /** publish blockers — empty = ready */
  missing: string[];
}

export interface UpdateInput {
  kind: UpdateKind;
  title: string;
  date: string | null;
  url: string | null;
  summary: string | null;
  opportunity_id: string | null;
  source_url: string | null;
}

// ---------- Internal Portal: Staff, Roles & Users ----------

export type StaffRole = 'super_admin' | 'admin' | 'reviewer' | 'content_editor' | 'support';

export interface StaffProfile {
  id: string;
  email: string | null;
  name: string | null;
  roles: StaffRole[];
}

export interface AdminMeResponse {
  id: string;
  email: string | null;
  name: string | null;
  roles: StaffRole[];
}

export interface AdminUserItem {
  id: string;
  email: string | null;
  phone: string | null;
  status: string;
  full_name: string | null;
  gender: string | null;
  category: string | null;
  state_code: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  roles?: StaffRole[];
}

export interface AdminUserList {
  users: AdminUserItem[];
  total: number;
  page?: number;
  limit?: number;
  staff_count?: number;
  citizen_count?: number;
}
