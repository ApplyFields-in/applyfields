/** API copy of the setup option lists in @applyfields/types (preferences.ts); preferences.spec.ts checks they match. */
export const PERSONAS = ['school_student', 'college_student', 'job_seeker', 'exam_prep'] as const;
export const INTERESTS = [
  'railways',
  'banking',
  'ssc',
  'upsc',
  'defence',
  'police',
  'teaching',
  'state_psc',
  'psu',
  'scholarships',
  'entrance',
  'jobs_after_graduation',
  'admissions',
] as const;
export const LOCATION_SCOPES = ['state', 'state_central', 'all'] as const;

export type Persona = (typeof PERSONAS)[number];
export type Interest = (typeof INTERESTS)[number];
export type LocationScope = (typeof LOCATION_SCOPES)[number];

export interface PreferencesEntity {
  personas: Persona[];
  interests: Interest[];
  location_scope: LocationScope | null;
  skipped: boolean;
  onboarded_at: string | null;
}

export interface SavePreferencesInput {
  personas: Persona[];
  interests: Interest[];
  location_scope?: LocationScope;
  skipped?: boolean;
}
