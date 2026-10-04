/**
 * The Opportunity format — TypeScript version of docs/job-format.md.
 * Python mirror: apps/ingestion/app/schemas/opportunity.py
 * If you change this file, change both of those too (same PR).
 */

// ---------- Basic codes ----------

export type OpportunityType = 'govt_job' | 'exam' | 'scholarship' | 'admission';

export type OpportunityCategory =
  // government jobs
  | 'central_govt'
  | 'state_govt'
  | 'district'
  | 'panchayat'
  | 'municipal'
  | 'psu'
  | 'railways'
  | 'banking'
  | 'defence'
  | 'police'
  // exams
  | 'entrance'
  | 'competitive'
  | 'recruitment'
  // scholarships
  | 'central'
  | 'state'
  // admissions
  | 'college'
  | 'university'
  | 'course'
  | 'other';

export type OrganizationLevel = 'central' | 'state' | 'district' | 'local';

/** 2-letter state code, or 'ALL' for All India. */
export type StateCode = string;

export type CategoryCode = 'GEN' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'PWBD' | 'EXS';

export type Gender = 'any' | 'male' | 'female' | 'transgender';

export type QualificationLevel =
  | '10th'
  | '12th'
  | 'iti'
  | 'diploma'
  | 'graduate'
  | 'post_graduate'
  | 'phd';

export type DateKind =
  | 'notification_date'
  | 'application_start'
  | 'application_end'
  | 'fee_last_date'
  | 'correction_window'
  | 'admit_card'
  | 'exam_date'
  | 'answer_key'
  | 'result'
  | 'interview'
  | 'counselling'
  | 'other';

export type OpportunityStatus = 'draft' | 'published' | 'closed' | 'archived';

/** Why a field is (or isn't) filled. See docs/job-format.md §3. */
export type FieldStatus = 'available' | 'not_in_source' | 'pending' | 'not_applicable';

/** 'YYYY-MM-DD' */
export type DateString = string;
/** ISO 8601 with timezone */
export type DateTimeString = string;

// ---------- Building blocks ----------

export interface Organization {
  name: string;
  short_name: string | null;
  level: OrganizationLevel;
  state_code: StateCode | null;
}

export interface Location {
  state_code: StateCode;
  district: string | null;
}

export interface AgeRelaxation {
  category?: CategoryCode;
  gender?: Gender;
  /** free-text condition, e.g. 'widow', 'ex-serviceman with 3 years service' */
  condition?: string;
  years: number;
}

export interface Eligibility {
  age: {
    min: number | null;
    max: number | null;
    as_on_date: DateString | null;
    relaxations: AgeRelaxation[];
  };
  qualification: {
    level: QualificationLevel | null;
    streams: string[];
    min_percentage: number | null;
    final_year_allowed: boolean | null;
  };
  gender: Gender;
  /** empty = no domicile restriction */
  domicile_states: StateCode[];
  /** empty = all categories */
  categories_allowed: CategoryCode[];
  /** annual family income limit in ₹ */
  income_max: number | null;
  other_conditions: string[];
  /** the original eligibility wording from the notification */
  official_text: string;
}

export interface Post {
  name: string;
  vacancies_total: number | null;
  vacancies_by_category: Partial<Record<CategoryCode, number>> | null;
  pay_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_text: string | null;
  /** only when this post's rules differ from the main eligibility */
  eligibility: Eligibility | null;
}

export interface Fee {
  category: CategoryCode | 'ALL';
  gender: Gender;
  /** whole rupees */
  amount: number;
}

export interface ImportantDate {
  kind: DateKind;
  date: DateString;
  end_date: DateString | null;
  is_tentative: boolean;
}

export interface RequiredDocument {
  name: string;
  mandatory: boolean;
  spec: string | null;
}

export interface OfficialLinks {
  notification_pdf_url: string | null;
  official_page_url: string | null;
  apply_url: string | null;
  official_website: string | null;
}

export interface SourceInfo {
  source_key: string;
  url: string;
  fetched_at: DateTimeString;
  content_hash: string;
  extractor_version: string;
  ai_model: string | null;
  /** 0 to 1 */
  confidence: number;
}

// ---------- The main object ----------

export interface Opportunity {
  type: OpportunityType;
  category: OpportunityCategory;
  title: string;
  organization: Organization;
  notification_number: string | null;
  summary: string | null;
  locations: Location[];

  vacancies_total: number | null;
  posts: Post[];

  eligibility: Eligibility | null;

  fees: Fee[];
  fee_text: string | null;
  payment_modes: string[];

  dates: ImportantDate[];

  selection_process: string[];
  required_documents: RequiredDocument[];
  syllabus: { text: string | null; url: string | null } | null;
  previous_papers: { title: string; url: string }[];
  benefits_text: string | null;

  links: OfficialLinks;
  source: SourceInfo;

  status: OpportunityStatus;
  field_status: Record<string, FieldStatus>;
}

// ---------- Updates (results, admit cards …) ----------

export type UpdateKind =
  | 'admit_card'
  | 'answer_key'
  | 'result'
  | 'correction_window'
  | 'date_change'
  | 'extension'
  | 'counselling'
  | 'other';

export interface OpportunityUpdate {
  opportunity_source_url: string;
  kind: UpdateKind;
  title: string;
  date: DateString | null;
  url: string | null;
  summary: string | null;
  source: Pick<SourceInfo, 'source_key' | 'url' | 'fetched_at'>;
  status: OpportunityStatus;
}
