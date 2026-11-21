# Onboarding Preferences + Recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A skippable 4-step setup on first sign-in whose answers rank Home's "Recommended" list.

**Architecture:** New `user_preferences` table behind `GET/PUT /me/preferences` (users module, same in-memory/Prisma store pattern as passkeys). A pure `rankByPreferences()` in the home module scores open listings; `HomeController.personal()` uses it. Web gets `/welcome` (auth card layout) plus a Home gate that sends un-onboarded users there; the existing welcome tour waits until onboarding is done.

**Tech Stack:** NestJS + Prisma 7 + vitest (`apps/api`), Next.js 16 app router + Tailwind (`apps/web`), shared `@applyfields/types`.

**Spec:** `docs/superpowers/specs/2026-11-21-onboarding-preferences-design.md`

## Global Constraints
- Option values (exact): personas `school_student | college_student | job_seeker | exam_prep`; interests `railways | banking | ssc | upsc | defence | police | teaching | state_psc | psu | scholarships | entrance | jobs_after_graduation | admissions`; location_scope `state | state_central | all`.
- Interests per persona: job_seeker & exam_prep → railways, banking, ssc, upsc, defence, police, teaching, state_psc, psu · college_student → scholarships, entrance, jobs_after_graduation, admissions · school_student → scholarships, admissions, entrance.
- Education levels (existing DTO): `10th | 12th | iti | diploma | graduate | post_graduate | phd`.
- Score: interest match +3 · state fits scope +2 · `days_left` ≤ 14 → +1. Drop out-of-scope items. Sort score desc, then `days_left` asc (nulls last). Top 6.
- "Skip for now" on every step; skip and finish both set `onboarded_at`; skip also sets `skipped = true`.
- Palette: navy `#082046`, blue `#0e7bf4`, bg `#F0F4F8`. Works at 390px width.
- New SQL goes in `database/changes/2026-11-21_likhith_user_preferences.sql`; Likhith runs it (do not run against Supabase).
- Never write `applyfields.in`; no Claude co-author lines in commits.

## Review Focus
- User with no state saved but scope `state` → treat every item as in-scope for the +2 check? No: with no state, scope filtering is skipped and no +2 is given (test in Task 3).
- Listing with `state_codes = ['ALL']` → counts as central: in scope for `state_central` and `all`, NOT for `state` (test in Task 3).
- PUT with an interest not in the list, or a scope typo → 400, nothing saved (test in Task 2).
- Preferences API down/erroring on Home → user is NOT redirected and Home renders normally (Task 5 step).
- Step 3 for a user who already has an education row → no second row is created (Task 4 step).

---

### Task 1: Table, Prisma model, shared types

**Files:**
- Create: `database/changes/2026-11-21_likhith_user_preferences.sql`
- Modify: `apps/api/prisma/schema.prisma` (add model after `user_passkeys`, add back-relation on `users`)
- Create: `packages/types/src/preferences.ts`; Modify: `packages/types/src/index.ts`

**Interfaces — Produces:**
- `packages/types`: `PERSONAS`, `INTERESTS`, `LOCATION_SCOPES` (readonly tuples of the Global Constraints values), `INTERESTS_BY_PERSONA: Record<Persona, readonly Interest[]>`, types `Persona`, `Interest`, `LocationScope`, and
  `interface UserPreferences { personas: Persona[]; interests: Interest[]; location_scope: LocationScope | null; skipped: boolean; onboarded_at: string | null }`
- Prisma model `user_preferences { user_id String @id @db.Uuid, personas String[] @default([]), interests String[] @default([]), location_scope String?, skipped Boolean @default(false), onboarded_at DateTime? @db.Timestamptz(6), updated_at DateTime @default(now()) @db.Timestamptz(6), users relation onDelete Cascade }`

- [ ] **Step 1:** Write the SQL: `create table if not exists user_preferences (...)` matching the model, `check (location_scope in ('state','state_central','all'))`, RLS enabled + `revoke all ... from anon, authenticated, service_role` (copy the header-comment style of `2026-11-05_likhith_user_passkeys.sql`, "Why:" first line).
- [ ] **Step 2:** Add the Prisma model; run `pnpm --filter @applyfields/api db:generate` → expect "Generated Prisma Client".
- [ ] **Step 3:** Add `preferences.ts` + export; run `pnpm --filter @applyfields/types typecheck` (or `npx tsc --noEmit -p packages/types`) → no errors.
- [ ] **Step 4:** Commit `feat(prefs): user_preferences table, prisma model, shared option lists`.

### Task 2: `GET/PUT /me/preferences`

**Files:**
- Create: `apps/api/src/modules/users/preferences.options.ts` (API copy of the option lists, like `partners/partner-documents.ts`)
- Create: `apps/api/src/modules/users/dto/preferences.dto.ts`
- Modify: `users.store.ts` (in-memory Map + Prisma branch, same shape as passkey methods), `users.service.ts`, `users.controller.ts`
- Test: `apps/api/src/modules/users/preferences.spec.ts`

**Interfaces:**
- Consumes: Task 1 Prisma model; shared lists for the equality test.
- Produces: `UsersStore.getPreferences(userId): Promise<UserPreferences | null>`, `UsersStore.savePreferences(userId, input: SavePreferencesInput): Promise<UserPreferences>`; `GET /me/preferences` → `UserPreferences | null`; `PUT /me/preferences` body `SavePreferencesDto { personas: Persona[]; interests: Interest[]; location_scope?: LocationScope; skipped?: boolean }` → `UserPreferences` (server sets `onboarded_at = now()` on every PUT).

- [ ] **Step 1: Failing tests** in `preferences.spec.ts`:
  - `expect(PERSONAS).toEqual(shared.PERSONAS)` and same for `INTERESTS`, `LOCATION_SCOPES`.
  - store round-trip (in-memory): `getPreferences('u1')` → `null`; after `savePreferences('u1', { personas:['job_seeker'], interests:['railways'], location_scope:'state', skipped:false })` → returns those values with `onboarded_at` a non-null ISO string.
  - DTO validation (class-validator `validate(plainToInstance(SavePreferencesDto, body))`): `{ personas:['job_seeker'], interests:['cricket'] }` → errors length > 0; `{ personas:['job_seeker'], interests:[], location_scope:'india' }` → errors > 0; valid body → 0 errors.
- [ ] **Step 2:** `cd apps/api && npx vitest run src/modules/users/preferences.spec.ts` → FAIL (modules missing).
- [ ] **Step 3:** Implement options file, DTO (`@IsArray() @IsIn(PERSONAS, { each: true })`, same for interests, `@IsOptional() @IsIn(LOCATION_SCOPES)`, `@IsOptional() @IsBoolean() skipped`), store methods (Prisma `upsert`), service passthroughs, controller routes `@Get('preferences')` / `@Put('preferences')`.
- [ ] **Step 4:** Re-run the spec → PASS; `npx tsc --noEmit -p .` → no errors.
- [ ] **Step 5:** Commit `feat(prefs): GET/PUT /me/preferences`.

### Task 3: Preference ranking on Home

**Files:**
- Create: `apps/api/src/modules/home/recommend.ts`; Test: `apps/api/src/modules/home/recommend.spec.ts`
- Modify: `opportunities.service.ts` `toCard()` (add `category: row.category`, `state_codes: row.state_codes`), `packages/types/src/api.ts` `OpportunityCard` (add `category?: string; state_codes?: string[]`)
- Modify: `home.controller.ts` `personal()`

**Interfaces:**
- Consumes: `UserPreferences` (Task 1), `OpportunityCard`.
- Produces: `rankByPreferences(cards: OpportunityCard[], prefs: Pick<UserPreferences,'interests'|'location_scope'>, userState: string | null): OpportunityCard[]` (already sliced to 6).

- [ ] **Step 1: Failing tests** (`recommend.spec.ts`, cards built with a small `card({...})` helper):
  - railways interest: card `{category:'railways'}` ranks above `{category:'banking'}`.
  - `ssc`/`upsc` match on `tags` containing `'SSC'`/`'UPSC'`; `teaching` matches title `/teacher|\bTET\b|lecturer/i`; `scholarships` → `type:'scholarship'`; `admissions` → `type:'admission'`; `entrance` → `type:'exam'` + category `entrance`; `jobs_after_graduation` → `type:'govt_job'`; `state_psc` → category `state_govt` or `state`.
  - scope `state`, user `'AP'`: `['AP']` kept, `['TS']` dropped, `['ALL']` dropped.
  - scope `state_central`: `['ALL']` kept, `['TS']` dropped. scope `all`: everything kept.
  - user state `null`: nothing dropped, no +2.
  - tie on score → smaller `days_left` first, `null` last; `days_left: 10` gets +1, `20` doesn't.
  - returns at most 6.
- [ ] **Step 2:** `npx vitest run src/modules/home/recommend.spec.ts` → FAIL.
- [ ] **Step 3:** Implement with one `MATCH: Record<Interest, (c) => boolean>` table (ponytail comment on the teaching keyword heuristic). In `personal()`: load prefs via `this.prisma.user_preferences.findUnique` wrapped in `.catch(() => null)` (table may not exist yet if the API deploys before the SQL is run — Home must keep working); base = eligibility-ready ? eligible|likely_eligible cards : (prefs ? all open cards : []); if prefs with any interest or a scope → `rankByPreferences(base, prefs, profile.state_code ?? profile.domicile_state_code ?? null)`, else today's `.slice(0, 6)`.
- [ ] **Step 4:** Spec PASS; full `npx vitest run src/modules/home src/modules/eligibility src/modules/opportunities` → PASS; `npx tsc --noEmit -p .` clean.
- [ ] **Step 5:** Commit `feat(prefs): rank Home recommendations by preferences`.

### Task 4: `/welcome` wizard (web)

**Files:**
- Create: `apps/web/src/app/(auth)/welcome/page.tsx` (client), `apps/web/src/components/onboarding/choice-chip.tsx`
- Uses: `apiGet`, `apiPut`, `apiPost` from `@/lib/api`; `INTERESTS_BY_PERSONA` etc. from `@applyfields/types`; existing state list from the profile page (extract to `apps/web/src/lib/states.ts` if it is inline; reuse, don't retype).

**Interfaces:**
- Consumes: Task 2 endpoints; existing `PUT /me/profile` (`date_of_birth` YYYY-MM-DD, `state_code`, `domicile_state_code`) and `GET/POST /me/education` (`{ level, status: 'completed' }`).
- Produces: after finish/skip sets `localStorage['applyfields-onboarded']='1'`, then `router.replace(next || '/')` where `next` is the `?next=` param (same-site paths only).

- [ ] **Step 1:** Build the page: header (Logo + "Skip for now"), "Step N of 4" + progress bar, steps 1–4 per spec copy, multi-select chips (icon + check, `aria-pressed`), step 2 shows the union of interests for chosen personas (Next disabled until ≥1 pick on steps 1–2; steps 3–4 optional), step 3 inputs `<select>` education, `<select>` state, `<input type="date">` DOB, pre-filled from `GET /me` / `GET /me/education`.
- [ ] **Step 2:** Save on Finish: `PUT /me/profile` with only filled fields (+ `domicile_state_code` when empty); `POST /me/education` only when GET returned none and a level was chosen; then `PUT /me/preferences`. Skip at any step: `PUT /me/preferences` with whatever is chosen so far + `skipped: true`. Errors → inline message, and still offer "Continue to home" (never trap).
- [ ] **Step 3:** `cd apps/web && npx tsc --noEmit -p .` clean; eslint on new files has no errors.
- [ ] **Step 4:** Commit `feat(prefs): first-sign-in setup wizard`.

### Task 5: Home gate, tour ordering, Settings link

**Files:**
- Create: `apps/web/src/components/onboarding/onboarding-gate.tsx`
- Modify: `apps/web/src/app/(main)/page.tsx` (render `<OnboardingGate />`), `apps/web/src/components/welcome-tour.tsx`, `apps/web/src/app/(main)/settings/page.tsx`

**Interfaces:**
- Consumes: `GET /me/preferences`; localStorage key `applyfields-onboarded`.
- Produces: event `applyfields-onboarded` (window) when the gate confirms onboarding.

- [ ] **Step 1:** Gate: if `localStorage.currentUser` and no `applyfields-onboarded` flag → `apiGet('/me/preferences')`; result with `onboarded_at` → set flag + dispatch event; result `null` → `router.replace('/welcome')`; request failed (network/500) → do nothing (Review Focus).
- [ ] **Step 2:** Tour: start only when `applyfields-onboarded` is set; otherwise wait for the `applyfields-onboarded` event (same pattern as the cookie-consent wait).
- [ ] **Step 3:** Settings: a "Your preferences" row linking to `/welcome?next=/settings`.
- [ ] **Step 4:** Browser check (dev server + headless Chromium script in scratchpad, API on localhost with SQL applied locally if available, otherwise mock the two endpoints with `page.route`): new user → `/welcome`; Skip → Home → tour shows; second visit → no redirect; 390px screenshots of steps 1–4 readable.
- [ ] **Step 5:** Commit `feat(prefs): send new users to setup, tour after setup, settings link`.

### Task 6: Hand-off
- [ ] Run `graphify update .`; update `claude-sessions` progress note if a session file covers this; tell Likhith to run `database/changes/2026-11-21_likhith_user_preferences.sql` on Supabase **before** deploying the API (Home's Prisma query fails without the table), then redeploy Render and merge to `main`. Give git commands; don't push.
