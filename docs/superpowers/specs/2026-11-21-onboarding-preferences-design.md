# First-sign-in preferences + preference-based recommendations — design

Date: 2026-11-21 · Approved by Likhith in chat ("go") · App: `apps/web` + `apps/api`

## Why
New users see no recommendations: Home's "Recommended" only appears once the profile has date of birth
and education (`EligibilityService.ready`), and even then it knows nothing about what the person *wants*.
Like LinkedIn/Claude onboarding, ask a few questions on first sign-in so every recommendation is
something they want **and** qualify for, from the first visit.

## Goals
- A 4-step setup after first sign-in, "Skip for now" on every step, ApplyFields look (not the reference image's tech-job options).
- Answers saved on the server (work on every device, editable later).
- Home "Recommended" = eligible items ranked by preference match.

## Non-goals
- No AI/ML model; matching uses fields listings already have (type, category, organization, state).
- No private-sector jobs (ApplyFields has none).
- No email/push digests from preferences, no mobile-app version (later, if wanted).

## Anti-goals
- Must never block someone from using the site (skip always works, one click).
- Must not duplicate profile data: step 3 writes into the existing profile/education records.
- Must not show invented listings (see memory: college data own-only).

## Approaches considered
- **A. New `user_preferences` table + rank in Home API — picked.** Cross-device, server can rank, editable. Cost: one SQL file Likhith runs on Supabase.
- B. Reuse `career_profiles.interests` — rejected: belongs to the Career module, mixes meanings.
- C. Browser-only (localStorage) — rejected: server can't rank, lost on a new device.

## The flow (`/welcome`, full page, inside the auth-style card layout)
1. **What brings you here?** (multi) School student · College student · Job seeker · Preparing for exams
2. **What do you want?** (multi; options depend on step 1, union if several picked)
   - Job seeker / exams → Railways, Banking, SSC, UPSC, Defence, Police, Teaching, State PSC, PSU
   - College student → Scholarships, Entrance / PG exams, Govt jobs after graduation, Admissions
   - School student → Scholarships, Admissions, Entrance exams (JEE / NEET)
3. **About you:** highest education level (`10th | 12th | iti | diploma | graduate | post_graduate | phd`), state, date of birth.
   Saved via existing `PUT /me/profile` (date_of_birth, state_code, domicile_state_code if empty) and
   `POST /me/education` (only if they have no education row yet). Pre-filled when already known.
4. **Where?** My state only · My state + central · Anywhere in India.

Then → Home, where the welcome tour (already built) runs.

## When it shows (builder's call, stated)
- Home (`/`) for a signed-in user calls `GET /me/preferences`; if `onboarded_at` is null → `router.replace('/welcome')`.
  This catches email sign-up, Google sign-up and existing users (once) without touching each auth path.
- Finishing **or** skipping sets `onboarded_at` (skip also sets `skipped = true`), so it never auto-shows again.
- The welcome tour starts only after onboarding is done/skipped (no overlap).
- Settings gets a "Your preferences" link to `/welcome` to change answers.

## Data
New table `user_preferences` (SQL in `database/changes/2026-11-21_likhith_user_preferences.sql`, RLS locked like `user_passkeys`; Prisma model added):
`user_id uuid pk → users`, `personas text[]`, `interests text[]`, `location_scope text` (`state | state_central | all`),
`skipped boolean default false`, `onboarded_at timestamptz`, `updated_at timestamptz`.
API: `GET /me/preferences` (null when none), `PUT /me/preferences` (validated against the fixed option lists).

## Recommendations (Home `personal()`)
- Candidates: open listings (existing `opportunities.list({ take: 200 })`).
- If eligibility-ready → keep `eligible | likely_eligible` (as today). If not ready but preferences exist → use all open items (so skippers of step 3 still get something).
- Score each: interest match (category/type/organization) +3 · state fits `location_scope` +2 · closes within 14 days +1. Drop items outside `location_scope`. Sort by score, then deadline. Top 6.
- Interest → listing mapping (one table in code): Railways→category `railways`; Banking→`banking`; Defence→`defence`; Police→`police`; PSU→`psu`; State PSC→category `state_govt`/`state` with org level `state`; SSC/UPSC→organization short_name; Scholarships→type `scholarship`; Admissions→type `admission`; Entrance→type `exam` + category `entrance`; Govt jobs after graduation→type `govt_job`; Teaching→title keyword (teacher/TET/lecturer) — ponytail: keyword heuristic, replace with a proper tag when listings carry one.
- No preferences → today's behaviour unchanged.

## Look
ApplyFields palette (navy `#082046`, blue `#0e7bf4`, `#F0F4F8` background), rounded-2xl chips with icon + check when selected,
"Step N of 4" + progress bar, "Skip for now" top-right, Back/Next bottom-right, works at phone width (chips wrap, 1 column).

## Left to the builder
Exact icons, copy polish, loading/error states (toast on save failure; never trap the user), unit test for the scoring function.
