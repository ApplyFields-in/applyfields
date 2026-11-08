# @applyfields/mobile — the citizen app (Android + iOS)

The citizen portal as a native app. Expo SDK 58, Expo Router, TypeScript. It talks
to the same `@applyfields/api` as the website and shares `@applyfields/types`, so
there is one definition of an opportunity across web, admin and mobile.

**Citizen only.** Partners use `apps/partner` (`partners.applyfields.com`); staff
use `apps/admin`. Nothing partner- or staff-facing belongs in here.

## Navigation

```
┌──────────────────────────────────────┐
│ ApplyFields              (avatar) ──┼─→ Profile
│ Every opportunity. One place.        │   AppHeader, on every tab
├──────────────────────────────────────┤
│  Apply    │   Career   │  Services   │   TopNav — the three modes
├──────────────────────────────────────┤
│                                      │
│              the feed                │
│                                      │
├──────────────────────────────────────┤
│  Home   Saved   Documents   Alerts   │   bottom Tabs
└──────────────────────────────────────┘
```

- **Top navbar** (`src/components/top-nav.tsx`): Apply · Career · Services. These
  switch *what you are looking at*, so they sit at the top where they read first.
- **Bottom bar** (`src/app/(tabs)/_layout.tsx`): Home · Saved · Documents · Alerts.
  These switch *where you are*.
- **Profile**: the avatar in the header, reachable from every screen, so it never
  takes a slot in the bottom bar.

## Routes

| File | Route | What it is |
|---|---|---|
| `(tabs)/(browse)/index.tsx` | `/` | The feed: jobs, exams, scholarships, admissions |
| `(tabs)/(browse)/career.tsx` | `/career` | Explore careers by category |
| `(tabs)/(browse)/services.tsx` | `/services` | Government services |
| `(tabs)/saved.tsx` | `/saved` | Saved items and reminders |
| `(tabs)/documents.tsx` | `/documents` | The user's certificates (read-only) |
| `(tabs)/alerts.tsx` | `/alerts` | Notification centre |
| `opportunity/[slug].tsx` | `/opportunity/:slug` | Eligibility, dates, fees, syllabus, documents |
| `career/[slug].tsx` | `/career/:slug` | One career: pathway, skills, resources |
| `apply.tsx` | `/apply?url=&title=` | In-app browser + profile copier |
| `profile.tsx` | `/profile` | Profile, alert switches, sign out |
| `login.tsx` | `/login` | Sign in |

## Running it

```bash
cp .env.example .env.local      # point EXPO_PUBLIC_API_URL at your API
pnpm dev:api                    # from the repo root, in another terminal
pnpm --filter @applyfields/mobile start
```

Then press `a` for Android or `i` for iOS, or scan the QR code with Expo Go.
The Android emulator reaches your laptop at `10.0.2.2`, not `localhost`.

Metro is configured for the pnpm workspace in `metro.config.js` (it watches the
repo root so `@applyfields/types` resolves). If a module ever fails to resolve
after a dependency change, `rm -rf node_modules && pnpm install` from the root,
then `npx expo start -c`.

## Push notifications

The app registers its Expo push token with the existing engine:

```
registerForPush()  →  POST /notifications/device-token  { token, platform, device_name }
```

The token is stored in the same `push_subscriptions` table as browser
subscriptions (the token goes in `endpoint`), and
`NotificationsService.dispatchWebPush()` routes it to Expo instead of web-push
when `isExpoPushToken()` matches. One engine, one preferences screen, no second
pipeline and no migration.

Needs an EAS project (`eas init`) so the token can be issued, plus
`EXPO_ACCESS_TOKEN` on the API for authenticated sends. Credentials:

- **Android**: upload the FCM v1 service-account JSON to EAS
  (`eas credentials` → Android → FCM V1).
- **iOS**: `eas credentials` → iOS → Push Notification key (EAS creates the
  APNs key for you).

Device tokens are never issued on a simulator — test push on real hardware.

## Dynamic mascot app icon

The launcher icon changes with what the user is doing (six mascot states, `expo-awesome-app-icon`).
Rules, platform limits, artwork spec and test checklist: [`docs/mascot-app-icon.md`](docs/mascot-app-icon.md).
Needs a dev/preview build; not in Expo Go.

## Shipping to the stores

```bash
npx eas-cli@latest login
npx eas-cli@latest init             # writes extra.eas.projectId into app.json
npx eas-cli@latest build  --platform all --profile production
npx eas-cli@latest submit --platform all --profile production
```

Before the first submission:

- Fill `ascAppId` and `appleTeamId` in `eas.json`.
- Replace the placeholder art in `assets/images/` (icon, adaptive icon, splash)
  with the ApplyFields mark.
- Point the production profile's `EXPO_PUBLIC_API_URL` at the live API.
- Store listings: both stores need a privacy-policy URL and a data-collection
  declaration. The app collects profile and education data under DPDP Act 2023
  consent, stores documents encrypted, and submits nothing on the user's behalf
  — say exactly that, and link `https://applyfields.in/privacy`.
- `android.permissions` is `POST_NOTIFICATIONS` only. Keep it that way unless a
  feature genuinely needs more; every extra permission is a review question.

## What is deliberately not here

- **Uploading documents** — the encrypted vault and DigiLocker flow stay on the
  website; the app lists what is already there.
- **Editing the profile** — the app shows it and says what is missing, and opens
  `applyfields.in/profile` to change it.
- **Registration and password reset** — handled on the website, so there is one
  place where consent is recorded.
- **Community, payments, partner booking, the AI chatbot** — web only for v1 of
  the app.
