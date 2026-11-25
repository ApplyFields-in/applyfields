'use client';

/**
 * First-sign-in setup (docs/superpowers/specs/2026-11-21-onboarding-preferences-design.md).
 * 4 steps, "Skip for now" everywhere. Step 3 writes into the existing profile/education records;
 * the rest goes to PUT /me/preferences. Home's OnboardingGate sends new users here.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Backpack,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Factory,
  FileText,
  Globe,
  GraduationCap,
  Landmark,
  Map as MapIcon,
  MapPin,
  NotebookPen,
  PenLine,
  Presentation,
  School,
  Shield,
  Siren,
  TrainFront,
  type LucideIcon,
} from 'lucide-react';
import type { EducationLevel, Interest, LocationScope, MeResponse, Persona, PreferencesResponse } from '@applyfields/types';
// Runtime values come from the leaf file (same as apps/partner): the package index re-exports './x.js' paths the web bundler can't resolve.
import { INTERESTS, INTERESTS_BY_PERSONA, PERSONAS } from '@applyfields/types/src/preferences';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { LABEL, Notice, PRIMARY, SIDE_BTN, TEXT_BTN } from '@/components/auth-ui';
import { ChoiceChip } from '@/components/onboarding/choice-chip';
import { flashAppToast } from '@/components/toast-notification-provider';
import { INDIAN_STATES } from '@/app/(main)/profile/page';
import { markOnboarded, safeNext } from '@/components/onboarding/onboarded';

const PERSONA_INFO: Record<Persona, { label: string; hint: string; icon: LucideIcon }> = {
  school_student: { label: 'School student', hint: 'Class 6–12', icon: Backpack },
  college_student: { label: 'College student', hint: 'Diploma, degree or PG', icon: GraduationCap },
  job_seeker: { label: 'Job seeker', hint: 'Looking for a government job', icon: Briefcase },
  exam_prep: { label: 'Preparing for exams', hint: 'SSC, UPSC, banking, state exams…', icon: NotebookPen },
};

const INTEREST_INFO: Record<Interest, { label: string; icon: LucideIcon }> = {
  railways: { label: 'Railways', icon: TrainFront },
  banking: { label: 'Banking', icon: Landmark },
  ssc: { label: 'SSC', icon: FileText },
  upsc: { label: 'UPSC / Civil services', icon: Building2 },
  defence: { label: 'Defence', icon: Shield },
  police: { label: 'Police', icon: Siren },
  teaching: { label: 'Teaching', icon: Presentation },
  state_psc: { label: 'State PSC / state jobs', icon: MapPin },
  psu: { label: 'PSU', icon: Factory },
  scholarships: { label: 'Scholarships', icon: Award },
  entrance: { label: 'Entrance exams (JEE, NEET, PG)', icon: PenLine },
  jobs_after_graduation: { label: 'Govt jobs after graduation', icon: BriefcaseBusiness },
  admissions: { label: 'Admissions', icon: School },
};

const EDUCATION: { value: EducationLevel; label: string }[] = [
  { value: '10th', label: '10th / SSC' },
  { value: '12th', label: '12th / Intermediate' },
  { value: 'iti', label: 'ITI' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'graduate', label: 'Graduation (degree)' },
  { value: 'post_graduate', label: 'Post-graduation' },
  { value: 'phd', label: 'PhD' },
];

const SCOPES: { value: LocationScope; label: string; hint: string; icon: LucideIcon }[] = [
  { value: 'state', label: 'My state only', hint: 'Jobs and seats in your state', icon: MapPin },
  { value: 'state_central', label: 'My state + central', hint: 'Your state plus all-India openings', icon: MapIcon },
  { value: 'all', label: 'Anywhere in India', hint: 'Show me everything', icon: Globe },
];

const STEPS = ['What brings you here?', 'What are you looking for?', 'A little about you', 'Where do you want to work or study?'];
const SUBTITLES = [
  'Choose one or more. We use this to pick what to show you first.',
  'Choose one or more.',
  'Used to show only what you are eligible for. You can change it later in your profile.',
  'We will prioritise openings in this area.',
];

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const INPUT = 'h-12 w-full rounded-xl border border-line bg-cream px-3 text-sm text-teal focus:border-sea focus:outline-none';

function WelcomeSetup() {
  const router = useRouter();
  const rawNext = useSearchParams().get('next');

  const [step, setStep] = useState(0);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [scope, setScope] = useState<LocationScope | null>(null);
  const [education, setEducation] = useState<EducationLevel | ''>('');
  const [stateCode, setStateCode] = useState('');
  const [dob, setDob] = useState('');
  const [me, setMe] = useState<MeResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Earlier answers (null = none saved, undefined result = request failed); Skip must never wipe them.
  const savedPrefs = useRef<Promise<PreferencesResponse | null> | null>(null);
  // An education row this page already added (so a retried Finish doesn't add a second one).
  const educationSaved = useRef(false);

  // Signed-in only; pre-fill from the profile and any earlier answers.
  useEffect(() => {
    try {
      if (!localStorage.getItem('currentUser')) {
        router.replace('/login?redirect=/welcome');
        return;
      }
    } catch {
      // storage blocked: let the API calls decide
    }
    void apiGet<MeResponse>('/me', undefined, { cache: 'no-store' }).then((m) => {
      if (!m) return;
      setMe(m);
      setDob(m.profile?.date_of_birth ?? '');
      setStateCode(m.profile?.state_code ?? m.profile?.domicile_state_code ?? '');
    });
    savedPrefs.current = apiGet<PreferencesResponse>('/me/preferences', undefined, { cache: 'no-store' });
    void savedPrefs.current.then((r) => {
      const p = r?.preferences;
      if (!p) return;
      setPersonas(p.personas);
      setInterests(p.interests);
      setScope(p.location_scope);
    });
  }, [router]);

  // Step 2 shows the union of options for the chosen personas, in one fixed order.
  const interestOptions = useMemo(
    () => INTERESTS.filter((i) => personas.some((p) => INTERESTS_BY_PERSONA[p].includes(i))),
    [personas],
  );
  const hasEducation = (me?.education?.length ?? 0) > 0;
  const today = new Date().toISOString().slice(0, 10);

  function finishLocally(message?: string) {
    markOnboarded();
    if (message) flashAppToast(message);
    router.replace(safeNext(rawNext));
  }

  async function skip() {
    setSaving(true);
    // Save a "skipped" record only when we know there is none yet; otherwise (answers already
    // saved, or we couldn't check) leave the server untouched. Never block leaving.
    const existing = await savedPrefs.current;
    if (existing && existing.preferences === null) await apiPut('/me/preferences', {
      personas,
      interests: interests.filter((i) => interestOptions.includes(i)),
      location_scope: scope ?? undefined,
      skipped: true,
    });
    finishLocally();
  }

  async function finish() {
    setError(null);
    if (dob && (dob < '1940-01-01' || dob > today)) {
      setStep(2);
      setError('Please check your date of birth.');
      return;
    }
    setSaving(true);
    const profile: Record<string, string> = {};
    if (dob && dob !== me?.profile?.date_of_birth) profile.date_of_birth = dob;
    if (stateCode && stateCode !== me?.profile?.state_code) profile.state_code = stateCode;
    // Only fill domicile/education when we could read the profile (never overwrite blind).
    if (me && stateCode && !me.profile?.domicile_state_code) profile.domicile_state_code = stateCode;

    const steps = [
      Object.keys(profile).length ? () => apiPut('/me/profile', profile) : null,
      me && education && !hasEducation && !educationSaved.current
        ? async () => {
            const res = await apiPost('/me/education', { level: education, status: 'completed' });
            if (!res.error) educationSaved.current = true;
            return res;
          }
        : null,
      () =>
        apiPut('/me/preferences', {
          personas,
          interests: interests.filter((i) => interestOptions.includes(i)),
          location_scope: scope ?? undefined,
          skipped: false,
        }),
    ];
    for (const run of steps) {
      if (!run) continue;
      const res = await run();
      if (res.error) {
        setSaving(false);
        setError(`${res.error} You can try again, or continue and finish this later in Settings.`);
        return;
      }
    }
    finishLocally("You're all set! Your recommendations are ready.");
  }

  const canNext = step === 0 ? personas.length > 0 : step === 1 ? interests.some((i) => interestOptions.includes(i)) : true;
  const last = step === STEPS.length - 1;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-teal/70">
          Step {step + 1} of {STEPS.length}
        </p>
        <button type="button" onClick={() => void skip()} disabled={saving} className={TEXT_BTN}>
          Skip for now
        </button>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-tea"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={step + 1}
        aria-label="Setup progress"
      >
        <div className="h-full rounded-full bg-sea transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <h1 className="mt-8 text-2xl font-black tracking-tight text-teal sm:text-3xl">{STEPS[step]}</h1>
      <p className="mt-1.5 text-sm text-teal/60">{SUBTITLES[step]}</p>

      <div className="mt-6 space-y-3">
        {step === 0 &&
          PERSONAS.map((p) => (
            <ChoiceChip
              key={p}
              icon={PERSONA_INFO[p].icon}
              label={PERSONA_INFO[p].label}
              hint={PERSONA_INFO[p].hint}
              selected={personas.includes(p)}
              onToggle={() => setPersonas(toggle(personas, p))}
            />
          ))}

        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {interestOptions.map((i) => (
              <ChoiceChip
                key={i}
                icon={INTEREST_INFO[i].icon}
                label={INTEREST_INFO[i].label}
                selected={interests.includes(i)}
                onToggle={() => setInterests(toggle(interests, i))}
              />
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="setup-education" className={LABEL}>
                Highest education
              </label>
              {hasEducation ? (
                <p className="rounded-xl bg-tea/60 px-3 py-3 text-sm text-teal/70">Already in your profile ✓</p>
              ) : (
                <select
                  id="setup-education"
                  value={education}
                  onChange={(e) => setEducation(e.target.value as EducationLevel | '')}
                  className={INPUT}
                >
                  <option value="">Choose…</option>
                  {EDUCATION.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label htmlFor="setup-state" className={LABEL}>
                Your state
              </label>
              <select id="setup-state" value={stateCode} onChange={(e) => setStateCode(e.target.value)} className={INPUT}>
                <option value="">Choose…</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="setup-dob" className={LABEL}>
                Date of birth
              </label>
              <input
                id="setup-dob"
                type="date"
                min="1940-01-01"
                max={today}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={INPUT}
              />
              <p className="mt-1 text-xs text-teal/50">Age limits decide most government jobs.</p>
            </div>
          </div>
        )}

        {step === 3 &&
          SCOPES.map((s) => (
            <ChoiceChip
              key={s.value}
              icon={s.icon}
              label={s.label}
              hint={s.hint}
              selected={scope === s.value}
              onToggle={() => setScope(scope === s.value ? null : s.value)}
            />
          ))}
      </div>

      <Notice error={error} success={null} />
      {error && (
        <button type="button" onClick={() => finishLocally()} className={`mt-3 ${TEXT_BTN}`}>
          Continue to home
        </button>
      )}

      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} disabled={saving} className={`${SIDE_BTN} inline-flex items-center gap-1.5`}>
            <ArrowLeft className="size-4" aria-hidden="true" /> Back
          </button>
        )}
        <button
          type="button"
          disabled={!canNext || saving}
          onClick={() => (last ? void finish() : setStep(step + 1))}
          className={PRIMARY}
        >
          {saving ? 'Saving…' : last ? 'Finish' : 'Next'}
          {!saving && <ArrowRight className="size-4" aria-hidden="true" />}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-teal/45">
        You can change these any time in <Link href="/settings" className="font-semibold text-sea hover:underline">Settings</Link>.
      </p>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense>
      <WelcomeSetup />
    </Suspense>
  );
}
