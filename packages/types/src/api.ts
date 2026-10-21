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
  /** only when the request came from a logged-in user */
  eligibility?: EligibilityStatus;
  /** only when the request came from a logged-in user */
  saved?: boolean;
}

// ---------- Eligibility (GET /opportunities/:slug/eligibility) ----------

export type EligibilityStatus = 'eligible' | 'likely_eligible' | 'not_eligible' | 'manual_check';

export type EligibilityRule =
  | 'rules'
  | 'age'
  | 'qualification'
  | 'stream'
  | 'final_year'
  | 'min_percentage'
  | 'gender'
  | 'domicile'
  | 'category'
  | 'income'
  | 'other';

export interface EligibilityRuleResult {
  rule: EligibilityRule;
  /** missing = the profile lacks this info · manual = too complex to decide, read the notification */
  status: 'pass' | 'fail' | 'missing' | 'manual';
  reason: string;
}

export interface EligibilityResult {
  status: EligibilityStatus;
  rules: EligibilityRuleResult[];
  /** set when the best match was a post with its own rules */
  post: string | null;
}

export type EligibilityResponse =
  | ({ slug: string } & EligibilityResult)
  | { slug: string; status: 'login_required' };

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
  /** null when logged out */
  personal: HomePersonal | null;
  sample: boolean;
}

export interface HomePersonal {
  /** false until the profile has date of birth and at least one qualification */
  profile_ready: boolean;
  /** eligible or likely eligible, closing soonest first */
  recommended: OpportunityCard[];
  saved: OpportunityCard[];
  recently_viewed: OpportunityCard[];
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

/** Complete detail for public view of an opportunity. */
export interface OpportunityDetail {
  id: string;
  slug: string;
  type: OpportunityType;
  category: OpportunityCategory;
  title: string;
  organization: {
    id: string;
    name: string;
    short_name: string | null;
    level: OrganizationLevel;
  };
  notification_number: string | null;
  summary: string | null;
  state_codes: string[];
  districts: string[];
  vacancies_total: number | null;
  fees: Fee[];
  fee_text: string | null;
  payment_modes: string[];
  selection_process: string[];
  required_documents: RequiredDocument[];
  syllabus: { text: string | null; url: string | null } | null;
  previous_papers: { title: string; url: string }[];
  benefits_text: string | null;
  application_start: string | null;
  application_end: string | null;
  days_left: number | null;
  links: {
    notification_pdf_url: string | null;
    official_page_url: string | null;
    apply_url: string | null;
    official_website: string | null;
  };
  posts: ReviewPost[];
  eligibility: ReviewEligibility[];
  dates: ReviewDate[];
  updates: UpdateItem[];
  last_verified_at: string | null;
  published_at: string | null;
  status: OpportunityStatus;
}

// ---------- Government Services ----------

export interface GovServiceCard {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  organization: string | null;
  authority_name: string | null;
  authority_level: OrganizationLevel | null;
  location: string;
  state_codes: string[];
  description: string | null;
  fee_text: string | null;
  processing_time_text: string | null;
  required_documents_count: number;
  official_url: string | null;
  apply_url: string | null;
  assistance_available: boolean;
  status: OpportunityStatus;
  published_at: string | null;
}

export interface GovServiceList {
  total: number;
  query: string;
  category: string;
  items: GovServiceCard[];
}

export interface GovServiceProcessStep {
  step: number;
  title: string;
  description: string;
  portal?: 'official' | 'assisted' | 'offline';
}

export interface GovServiceDetail {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  organization_id: string | null;
  organization: {
    id: string;
    name: string;
    short_name: string | null;
    level: OrganizationLevel;
  } | null;
  description: string | null;
  who_needs_it: string | null;
  eligibility_text: string | null;
  required_documents: RequiredDocument[];
  fees: Fee[];
  fee_text: string | null;
  process_steps: GovServiceProcessStep[];
  processing_time_text: string | null;
  authority_name: string | null;
  authority_level: OrganizationLevel | null;
  state_codes: string[];
  official_url: string | null;
  apply_url: string | null;
  assistance_available: boolean;
  status: OpportunityStatus;
  published_at: string | null;
  last_verified_at: string | null;
  updates: UpdateItem[];
}

export interface GovServiceInput {
  name: string;
  category: string | null;
  organization_id?: string | null;
  description: string | null;
  who_needs_it: string | null;
  eligibility_text: string | null;
  required_documents: RequiredDocument[];
  fees: Fee[];
  fee_text: string | null;
  process_steps: GovServiceProcessStep[];
  processing_time_text: string | null;
  authority_name: string | null;
  authority_level?: OrganizationLevel | null;
  state_codes: string[];
  official_url: string | null;
  apply_url: string | null;
  assistance_available: boolean;
}

export interface AdminGovServiceListItem {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  authority_name: string | null;
  status: OpportunityStatus;
  state_codes: string[];
  updated_at: string;
  published_at: string | null;
}

export interface AdminGovServiceList {
  total: number;
  counts: Record<OpportunityStatus, number>;
  items: AdminGovServiceListItem[];
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

// ---------- Saved items (GET /saved, PUT|DELETE /saved/:item_type/:slug) ----------

export type SavedItemType = 'opportunity' | 'service' | 'institution';

export interface SavedItem {
  item_type: SavedItemType;
  slug: string;
  saved_at: string;
  reminder_enabled: boolean;
  /** set for jobs, exams, scholarships and admissions */
  card: OpportunityCard | null;
  /** set for government services */
  service: { slug: string; name: string } | null;
  /** set for colleges and universities */
  institution?: InstitutionSummary | null;
}

export interface SavedList {
  total: number;
  items: SavedItem[];
}

export interface SaveResult {
  saved: boolean;
  reminder_enabled: boolean;
}

// ---------- Notifications (GET /notifications, /notifications/preferences) ----------

export type NotificationType =
  | 'new_job'
  | 'new_exam'
  | 'new_scholarship'
  | 'new_admission'
  | 'service_update'
  | 'closing_reminder'
  | 'saved_item_changed'
  | 'admit_card'
  | 'answer_key'
  | 'result'
  | 'correction_window'
  | 'date_change'
  | 'profile_match'
  | 'document_expiry'
  | 'request_update'
  | 'account_security'
  | 'system';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  /** a path on the website, e.g. /jobs/ssc-cgl-2026 */
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationList {
  unread: number;
  items: NotificationItem[];
}

/** The types a user can turn off. Account and system messages always arrive. */
export type MutableNotificationType =
  | 'closing_reminder'
  | 'admit_card'
  | 'answer_key'
  | 'result'
  | 'correction_window'
  | 'date_change'
  | 'saved_item_changed';

export interface NotificationPreferences {
  email_enabled: boolean;
  /** false when the account has no verified email, so email can't be sent */
  email_available: boolean;
  push_enabled: boolean;
  /** true when user has active premium/instant alert subscription */
  is_subscribed: boolean;
  muted_types: MutableNotificationType[];
  /** reminders go out this many days before a last date or exam date */
  reminder_days_before: number[];
}

export type NotificationPreferencesInput = {
  email_enabled?: boolean;
  push_enabled?: boolean;
  muted_types?: MutableNotificationType[];
  reminder_days_before?: number[];
};

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: PushSubscriptionKeys;
  user_agent?: string | null;
}

export interface PushPublicKeyResponse {
  publicKey: string;
}

export type BroadcastAudience =
  | { kind: 'all' }
  | { kind: 'subscribers' }
  | { kind: 'savers'; opportunity_slug: string }
  | { kind: 'user'; email: string };

export interface AdminBroadcastInput {
  title: string;
  body: string | null;
  link: string | null;
  audience: BroadcastAudience;
  channels?: ('in_app' | 'push' | 'email')[];
}

export interface AdminBroadcastResult {
  notified: number;
  push_sent: number;
  email_queued: number;
}

// ---------- Internal Portal → Notifications ----------

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface AdminDeliveryItem {
  id: string;
  channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'in_app';
  status: DeliveryStatus;
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
  type: NotificationType;
  title: string;
  user_email: string | null;
}

export interface AdminNotificationOverview {
  counts: Record<DeliveryStatus, number> & { in_app_total: number; in_app_unread: number; push_subscriptions_total: number };
  items: AdminDeliveryItem[];
}

export interface ManualAlertInput {
  title: string;
  body: string | null;
  /** a path on the website, e.g. /jobs/ssc-cgl-2026 */
  link: string | null;
  /** everyone who saved this job/exam, or one user by email */
  audience: { kind: 'savers'; opportunity_slug: string } | { kind: 'user'; email: string };
}

export interface ManualAlertResult {
  notified: number;
}

/* ------------------------------------------------------------------ universal search (Session 09) */

export type SearchResultType = OpportunityType | 'service' | 'career' | 'course' | 'institution' | 'roadmap';
export type SearchSort = 'relevance' | 'deadline';

/** GET /search — one result of any type. */
export interface SearchResult {
  type: SearchResultType;
  title: string;
  /** organisation / authority */
  subtitle: string | null;
  /** website path, e.g. /exams/ssc-cgl-2026 */
  url: string;
  location: string;
  last_date: string | null;   // YYYY-MM-DD
  days_left: number | null;
}

export interface SearchResponse {
  query: string;
  total: number;
  items: SearchResult[];
  related?: string[];
}

export interface SearchSuggestionItem {
  term: string;
  display: string;
  category: string;
}

export interface SearchSuggestResponse {
  query: string;
  suggestions: string[];
  related: string[];
  items: SearchResult[];
}

/* ------------------------------------------------------------------ Career Foundation (Session 11) */

export interface CareerCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  sort_order: number;
  careers_count?: number;
}

export interface LearningResource {
  type: 'platform' | 'book' | 'video' | 'course';
  title: string;
  provider_or_author?: string;
  url?: string;
  description?: string;
  is_free?: boolean;
}

export interface PathwayStep {
  step: number;
  title: string;
  description: string;
  duration?: string;
}

export interface LinkedOpportunity {
  type: string;
  title: string;
  url: string;
}

export interface CareerSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category_id: string;
  category_slug: string;
  category_name: string;
  category_icon: string;
  education_required: string;
  salary_text: string | null;
  outlook_text: string | null;
  skills: string[];
  resources_count: number;
}

export interface CareerDetail extends CareerSummary {
  what_it_involves: string | null;
  learning_areas: string[];
  pros: string[];
  cons: string[];
  pathway_steps: PathwayStep[];
  learning_resources: LearningResource[];
  linked_opportunities: LinkedOpportunity[];
  views_count: number;
}

export interface UserCareerProfile {
  user_id: string;
  education_stage: string;
  current_qualification: string | null;
  subjects: string[];
  interests: string[];
  skills: string[];
  career_interests: string[];
  goals: string | null;
  preferred_direction: string | null;
}

export interface AdminCareerListItem {
  id: string;
  slug: string;
  title: string;
  category_name: string;
  status: OpportunityStatus | string;
  views_count: number;
  resources_count: number;
  updated_at: string;
}

export interface AdminCareerList {
  total: number;
  counts: {
    all: number;
    published: number;
    draft: number;
    archived: number;
  };
  items: AdminCareerListItem[];
}

// ---------- Session 12: Roadmaps, Courses, Colleges & AI Guidance ----------

export type RoadmapStepKind = 'education' | 'course' | 'exam' | 'skill' | 'certification' | 'project' | 'internship' | 'job' | 'milestone';
export type ProgressStatus = 'todo' | 'in_progress' | 'done' | 'skipped';

export interface RoadmapStepResource {
  title: string;
  url?: string;
  type: string;
}

export interface RoadmapStepItem {
  id: string;
  stage: string;
  sort_order: number;
  kind: RoadmapStepKind;
  title: string;
  description: string | null;
  course_id: string | null;
  course_slug?: string | null;
  exam_id: string | null;
  resources: RoadmapStepResource[];
  estimated_duration_text: string | null;
  is_milestone: boolean;
  user_status?: ProgressStatus;
}

export interface RoadmapSummary {
  id: string;
  slug: string;
  career_id: string | null;
  career_slug?: string | null;
  career_title?: string | null;
  title: string;
  description: string | null;
  for_stage: string | null;
  estimated_duration_text: string | null;
  steps_count: number;
  milestones_count: number;
}

export interface RoadmapDetail extends RoadmapSummary {
  steps: RoadmapStepItem[];
  user_progress?: {
    is_saved: boolean;
    total_steps: number;
    completed_steps: number;
    completion_percentage: number;
  };
}

export type CourseLevel = 'certificate' | 'iti' | 'diploma' | 'ug' | 'pg' | 'phd';

export interface CourseSummary {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  level: CourseLevel;
  stream: string | null;
  duration_months: number | null;
  min_qualification: string | null;
  skills_developed: string[];
  careers_count?: number;
  colleges_count?: number;
}

export interface CourseDetail extends CourseSummary {
  description: string | null;
  eligibility_text: string | null;
  career_outcomes: string | null;
  careers: Array<{ id: string; slug: string; title: string }>;
  exams: Array<{ id: string; slug: string; title: string }>;
  institutions: Array<{
    id: string;
    slug: string;
    name: string;
    short_name: string | null;
    city: string | null;
    state_code: string | null;
    seats: number | null;
    fee_per_year: number | null;
    fees_text: string | null;
    admission_process: string | null;
  }>;
}

export interface PlacementStats {
  highest_package?: string;
  avg_package?: string;
  top_recruiters?: string[];
}

export interface InstitutionSummary {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  type: string;
  ownership: string | null;
  state_code: string | null;
  city: string | null;
  district: string | null;
  website: string | null;
  ranking_text: string | null;
  fees_text: string | null;
  accreditation: Record<string, any>;
  placement_stats: PlacementStats;
  courses_count?: number;
}

export interface InstitutionDetail extends InstitutionSummary {
  description: string | null;
  established_year: number | null;
  campus_facilities: string[];
  courses: Array<{
    id: string;
    slug: string;
    name: string;
    short_name: string | null;
    level: string;
    seats: number | null;
    fee_per_year: number | null;
    fees_text: string | null;
    admission_process: string | null;
  }>;
}

export interface InstitutionListResponse {
  items: InstitutionSummary[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AdminInstitutionInput {
  name: string;
  short_name?: string | null;
  slug?: string;
  type?: string;
  ownership?: string | null;
  state_code?: string | null;
  district?: string | null;
  city?: string | null;
  address?: string | null;
  pincode?: string | null;
  website?: string | null;
  ranking_text?: string | null;
  fees_text?: string | null;
  description?: string | null;
  established_year?: number | null;
  accreditation?: Record<string, any>;
  placement_stats?: PlacementStats;
  campus_facilities?: string[];
  status?: string;
}

export interface GuidanceSource {
  title: string;
  url: string;
  type: string;
}

export interface GuidanceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: GuidanceSource[];
  created_at: string;
}

export interface GuidanceConversation {
  id: string;
  title: string | null;
  messages: GuidanceMessage[];
  updated_at: string;
}

export interface AskGuidanceDto {
  question: string;
  conversation_id?: string;
  student_stage?: string;
}

export interface AskGuidanceResponse {
  conversation_id: string;
  answer: string;
  sources: GuidanceSource[];
  is_fallback?: boolean;
}

// ============================================================================
// PARTNER PORTAL & ASSISTANCE NETWORK (Session 13 — Module 1)
// ============================================================================

export type PartnerType =
  | 'meeseva'
  | 'csc'
  | 'xerox_printing'
  | 'browsing_centre'
  | 'typing_centre'
  | 'passport_studio'
  | 'application_assistance'
  | 'consultant'
  | 'college'
  | 'training_institution'
  | 'other';

export type PartnerVerificationStatus = 'pending' | 'verified' | 'rejected';

export type PartnerMemberRole = 'owner' | 'staff';

export interface PartnerWorkingHours {
  [day: string]: [string, string];
}

export interface PartnerServiceSummary {
  id: string;
  partner_id: string;
  service_id: string | null;
  name: string;
  description: string | null;
  charge_paise: number | null;
  charge_text: string | null;
  estimated_time_text: string | null;
  is_active: boolean;
}

export interface PartnerServiceDetail extends PartnerServiceSummary {
  created_at: string;
  updated_at: string;
}

export interface PartnerDocumentSummary {
  id: string;
  partner_id: string;
  document_kind: string;
  storage_path: string;
  status: PartnerVerificationStatus;
  reviewer_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface PartnerSummary {
  id: string;
  slug: string;
  type: PartnerType;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  owner_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  state_code: string | null;
  district: string | null;
  city: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  service_areas: string[];
  working_hours: Record<string, string[]>;
  is_available: boolean;
  verification_status: PartnerVerificationStatus;
  is_listed: boolean;
  rating_avg: number;
  rating_count: number;
  services: PartnerServiceSummary[];
}

export interface PartnerDetail extends PartnerSummary {
  institution_id: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  services: PartnerServiceDetail[];
  documents?: PartnerDocumentSummary[];
}

export interface PartnerDirectoryQuery {
  q?: string;
  type?: string;
  state?: string;
  district?: string;
  pincode?: string;
  service?: string;
  limit?: number;
  offset?: number;
}

export interface PartnerDirectoryResponse {
  total: number;
  items: PartnerSummary[];
}

export interface PartnerRegistrationInput {
  business_name: string;
  type: PartnerType;
  owner_name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address: string;
  state_code: string;
  district: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  service_areas?: string[];
  working_hours?: Record<string, string[]>;
  description?: string;
}

export interface PartnerUpdateInput {
  business_name?: string;
  description?: string;
  owner_name?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  state_code?: string;
  district?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  working_hours?: Record<string, string[]>;
  is_available?: boolean;
}

export interface PartnerServiceInput {
  name: string;
  description?: string;
  charge_paise?: number;
  charge_text?: string;
  estimated_time_text?: string;
  is_active?: boolean;
  service_id?: string;
}

export interface AdminPartnerItem extends PartnerSummary {
  owner_user_id?: string | null;
  owner_user_email?: string | null;
  documents_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminPartnerListResponse {
  total: number;
  items: AdminPartnerItem[];
}

export interface AdminPartnerVerifyInput {
  verification_status: PartnerVerificationStatus;
  is_listed: boolean;
  reviewer_note?: string;
}

// ============================================================================
// ASSISTANCE BOOKINGS & WORKFLOW (Session 13 — Module 2)
// ============================================================================

export type BookingRequestStatus =
  | 'new'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface BookingRequestEvent {
  id: string;
  request_id: string;
  from_status: BookingRequestStatus | null;
  to_status: BookingRequestStatus;
  note: string | null;
  actor_user_id: string | null;
  created_at: string;
}

export interface BookingReview {
  id: string;
  partner_id: string;
  user_id: string | null;
  request_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface BookingDetail {
  id: string;
  user_id: string | null;
  partner_id: string;
  partner_business_name: string;
  partner_slug: string;
  partner_phone: string | null;
  partner_address: string | null;
  partner_service_id: string | null;
  service_name: string | null;
  service_id: string | null;
  opportunity_id: string | null;
  status: BookingRequestStatus;
  appointment_at: string | null;
  user_note: string | null;
  partner_note: string | null;
  quoted_paise: number | null;
  final_paise: number | null;
  cancelled_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  events: BookingRequestEvent[];
  review: BookingReview | null;
}

export interface BookingListResponse {
  total: number;
  items: BookingDetail[];
}

export interface CreateBookingInput {
  partner_id: string;
  partner_service_id?: string;
  service_id?: string;
  opportunity_id?: string;
  appointment_at?: string;
  user_note?: string;
  contact_phone?: string;
}

export interface UpdateBookingStatusInput {
  status: BookingRequestStatus;
  partner_note?: string;
  cancelled_reason?: string;
  quoted_paise?: number;
  final_paise?: number;
}

export interface CreateReviewInput {
  rating: number;
  comment?: string;
}

// ============================================================================
// INSTITUTION PARTNERS & ADMISSION INQUIRIES (Session 13 — Module 3)
// ============================================================================

export type InstitutionEnquiryStatus = 'new' | 'responded' | 'closed';

export interface InstitutionEnquiry {
  id: string;
  institution_id: string;
  institution_name: string;
  institution_slug: string;
  user_id: string | null;
  course_id: string | null;
  course_name: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string;
  status: InstitutionEnquiryStatus;
  response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInstitutionEnquiryInput {
  name: string;
  phone: string;
  email?: string;
  course_id?: string;
  message: string;
}

export interface RespondInstitutionEnquiryInput {
  status: InstitutionEnquiryStatus;
  response: string;
}

export interface InstitutionPartnerProfile {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  type: string;
  ownership: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  fees_text: string | null;
  description: string | null;
  established_year: number | null;
  enquiries_count: number;
  courses_count: number;
}

export interface UpdateInstitutionProfileInput {
  name?: string;
  short_name?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  fees_text?: string;
  description?: string;
}

export interface InstitutionEnquiryListResponse {
  total: number;
  items: InstitutionEnquiry[];
}

// ============================================================================
// COMMUNITY DISCUSSIONS & Q&A (Session 14 — Module 1)
// ============================================================================

export type CommunityThreadCategory =
  | 'general'
  | 'admit_card'
  | 'exam_prep'
  | 'syllabus'
  | 'result'
  | 'counselling';

export interface CommunityComment {
  id: string;
  thread_id: string;
  user_id: string | null;
  author_name: string;
  parent_comment_id: string | null;
  content: string;
  upvotes_count: number;
  is_official_answer: boolean;
  is_hidden: boolean;
  user_has_upvoted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityThread {
  id: string;
  opportunity_id: string | null;
  opportunity_title?: string | null;
  opportunity_slug?: string | null;
  category: CommunityThreadCategory;
  user_id: string | null;
  author_name: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_hidden: boolean;
  view_count: number;
  upvotes_count: number;
  replies_count: number;
  user_has_upvoted?: boolean;
  comments?: CommunityComment[];
  created_at: string;
  updated_at: string;
}

export interface CreateThreadInput {
  opportunity_id?: string;
  category?: CommunityThreadCategory;
  author_name?: string;
  title: string;
  content: string;
}

export interface CreateCommentInput {
  author_name?: string;
  parent_comment_id?: string;
  content: string;
}

export interface ToggleUpvoteInput {
  thread_id?: string;
  comment_id?: string;
}

export interface ToggleUpvoteResponse {
  upvoted: boolean;
  upvotes_count: number;
}

export interface CommunityThreadListResponse {
  total: number;
  items: CommunityThread[];
}

export interface ReportContentInput {
  item_type: 'opportunity' | 'exam' | 'service' | 'institution' | 'course' | 'career' | 'roadmap' | 'partner' | 'update';
  item_id: string;
  reason: 'incorrect_info' | 'broken_link' | 'fake_or_scam' | 'partner_issue' | 'service_complaint' | 'other';
  details?: string;
}

export interface AdminReportDetail {
  id: string;
  reporter_id: string | null;
  reporter_email?: string | null;
  item_type: string;
  item_id: string;
  reason: string;
  details: string | null;
  status: string;
  assigned_to: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminReportListResponse {
  total: number;
  items: AdminReportDetail[];
}

export interface ResolveReportInput {
  status: 'resolved' | 'rejected' | 'closed';
  resolution_note: string;
  action?: 'hide' | 'lock' | 'dismiss';
}

// =============================================================================
// SESSION 10: DOCUMENTS, APPLICATION TRACKER, AUDIT & SUPPORT TYPES
// =============================================================================

export type StandardDocumentTypeCode =
  | 'marksheet_10th'
  | 'degree_certificate'
  | 'caste_certificate'
  | 'photo'
  | 'signature'
  | 'resume'
  | 'id_proof';

export interface ExtractedFieldItem {
  key: string;
  label: string;
  value: string;
  isSensitive?: boolean;
  category?: 'identity' | 'academic' | 'reservation' | 'personal' | 'general';
}

export interface UserDocumentSummary {
  id: string;
  user_id: string;
  document_type_code: string;
  document_type_name?: string;
  title: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  issued_on?: string | null;
  expires_on?: string | null;
  issuing_authority?: string | null;
  masked_identifier?: string | null;
  details: Record<string, any> & {
    extracted_fields?: ExtractedFieldItem[];
    raw_text?: string;
    verified_by_digilocker?: boolean;
    verification_source?: string;
  };
  source: 'upload' | 'digilocker';
  created_at: string;
  updated_at: string;
}

export interface UserDocumentListResponse {
  total: number;
  items: UserDocumentSummary[];
}

export interface UploadDocumentInput {
  documentTypeCode: string;
  title?: string;
  fileName: string;
  mimeType: string;
  fileBase64: string;
  issuedOn?: string;
  expiresOn?: string;
  issuingAuthority?: string;
  identifierNumber?: string;
  details?: Record<string, any>;
}

export interface UpdateDocumentDetailsInput {
  details: Record<string, any> & {
    extracted_fields?: ExtractedFieldItem[];
  };
  identifierNumber?: string;
  title?: string;
}

export interface DocumentReadinessCheck {
  opportunity_id?: string;
  opportunity_title?: string;
  required_count: number;
  ready_count: number;
  percentage: number;
  is_fully_ready: boolean;
  required_documents: Array<{
    name: string;
    mandatory: boolean;
    spec: string | null;
    matched: boolean;
    matched_document?: UserDocumentSummary | null;
  }>;
}

export type ApplicationTrackerStatus =
  | 'saved'
  | 'planning'
  | 'applied'
  | 'exam_interview'
  | 'selected'
  | 'rejected'
  | 'completed';

export interface ApplicationTrackerItem {
  id: string;
  user_id: string;
  opportunity_id?: string | null;
  service_id?: string | null;
  title: string;
  organization: string;
  type: string;
  slug: string;
  mode: 'official' | 'applyfields_assisted' | 'partner_assisted';
  status: ApplicationTrackerStatus;
  application_number?: string | null;
  roll_number?: string | null;
  exam_date?: string | null;
  exam_center?: string | null;
  applied_on?: string | null;
  deadline?: string | null;
  notes?: string | null;
  documents_ready: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApplicationTrackerListResponse {
  total: number;
  items: ApplicationTrackerItem[];
}

export interface CreateApplicationTrackerInput {
  opportunity_slug?: string;
  service_slug?: string;
  status?: ApplicationTrackerStatus;
  application_number?: string;
  roll_number?: string;
  exam_date?: string;
  exam_center?: string;
  applied_on?: string;
  notes?: string;
}

export interface UpdateApplicationTrackerInput {
  status?: ApplicationTrackerStatus;
  application_number?: string | null;
  roll_number?: string | null;
  exam_date?: string | null;
  exam_center?: string | null;
  applied_on?: string | null;
  notes?: string | null;
}

export interface AdminAuditLogItem {
  id: string;
  actor_id: string | null;
  actor_email?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_title?: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export interface AdminAuditListResponse {
  total: number;
  items: AdminAuditLogItem[];
}

export interface OpportunityVersionItem {
  id: string;
  opportunity_id: string;
  version_no: number;
  status: 'draft' | 'pending' | 'published' | 'superseded' | 'rejected';
  changed_fields: string[];
  change_note: string | null;
  created_by?: string | null;
  creator_name?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  snapshot: Record<string, any>;
}

export interface OpportunityVersionListResponse {
  opportunity_id: string;
  current_version: number;
  versions: OpportunityVersionItem[];
}

export interface SupportTicketInput {
  name: string;
  email: string;
  subject: string;
  category: 'account' | 'application' | 'eligibility' | 'documents' | 'bug' | 'other';
  message: string;
}

export interface SupportTicketResponse {
  success: boolean;
  ticket_id: string;
  message: string;
}

// ---------- Session 04: Scrapers, Sources & Link Health ----------

export type ScrapeRunStatus = 'running' | 'success' | 'partial' | 'failed';

export interface ScrapeRunItem {
  id: string;
  source_id: string;
  status: ScrapeRunStatus;
  started_at: string;
  finished_at: string | null;
  items_found: number;
  new_items: number;
  error: string | null;
}

export interface ScrapeSourceItem {
  id: string;
  key: string;
  name: string;
  organization_id: string | null;
  organization_name?: string | null;
  list_url: string;
  kind: string;
  is_active: boolean;
  interval_hours: number;
  last_run_at: string | null;
  last_success_at: string | null;
  consecutive_failures: number;
  health: 'healthy' | 'failing' | 'stale' | 'idle' | 'disabled';
  latest_run?: ScrapeRunItem | null;
  total_runs: number;
  total_documents: number;
}

export interface ScrapeSourcesListResponse {
  sources: ScrapeSourceItem[];
  summary: {
    total: number;
    active: number;
    healthy: number;
    failing: number;
    stale: number;
  };
}

export interface ScrapeSourceRunsResponse {
  source_id: string;
  key: string;
  name: string;
  runs: ScrapeRunItem[];
  total: number;
}

export interface ScrapeTriggerResponse {
  success: boolean;
  message: string;
  source_key: string;
  run_id?: string;
  status?: string;
  items_found?: number;
  new_items?: number;
  duplicates?: number;
  failed_items?: number;
}

export interface LinkHealthCheckItem {
  opportunity_id: string;
  title: string;
  slug: string;
  status: string;
  apply_url: string | null;
  apply_url_status: number | null;
  apply_url_ok: boolean;
  pdf_url: string | null;
  pdf_url_status: number | null;
  pdf_url_ok: boolean;
  last_checked_at: string;
  error?: string | null;
}

export interface LinkHealthReport {
  checked_count: number;
  broken_count: number;
  healthy_count: number;
  checked_at: string;
  broken_links: LinkHealthCheckItem[];
}

