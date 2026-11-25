/** First-sign-in setup answers (GET/PUT /me/preferences). The API keeps a copy of these lists
 *  in apps/api/src/modules/users/preferences.options.ts, checked equal by a test. */
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

const JOB_INTERESTS = ['railways', 'banking', 'ssc', 'upsc', 'defence', 'police', 'teaching', 'state_psc', 'psu'] as const;

/** Step 2 options for each step-1 answer (the setup shows the union of the chosen personas). */
export const INTERESTS_BY_PERSONA: Record<Persona, readonly Interest[]> = {
  job_seeker: JOB_INTERESTS,
  exam_prep: JOB_INTERESTS,
  college_student: ['scholarships', 'entrance', 'jobs_after_graduation', 'admissions'],
  school_student: ['scholarships', 'admissions', 'entrance'],
};

export interface UserPreferences {
  personas: Persona[];
  interests: Interest[];
  location_scope: LocationScope | null;
  skipped: boolean;
  /** ISO time setup was finished or skipped; null = not done yet */
  onboarded_at: string | null;
}

/** GET /me/preferences */
export interface PreferencesResponse {
  preferences: UserPreferences | null;
}
