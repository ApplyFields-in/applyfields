# apps/partner-mobile — ApplyFields Partner app (Android + iOS)

The partner portal (`apps/partner`, partners.applyfields.com) as a phone app, for
**service centres** (MeeSeva, CSC, xerox, browsing, typing, consultants) and
**institutions** (colleges, universities, training institutes). Expo SDK 58 +
Expo Router, same theme and UI kit as the citizen app (`apps/mobile`).

```bash
cp .env.example .env.local        # EXPO_PUBLIC_API_URL → the API (emulator: http://10.0.2.2:4000/api/v1)
pnpm dev:partner-mobile           # from the repo root, then press a / i, or open in Expo Go
pnpm --filter @applyfields/partner-mobile typecheck
pnpm --filter @applyfields/partner-mobile check   # schedule validation self-check
```

## Who sees what

The session (`src/lib/session.tsx`) reads `GET /me` + `GET /partners/me` and the
root layout shows only the screens that status allows (`Stack.Protected`):

| Status | Screens |
|---|---|
| signed out | `login` (password or one-time code) |
| account, no partner | `onboard` — centre or college form → `POST /partners/register` |
| pending / rejected | `under-review` (pull to re-check) |
| verified centre | tabs **Home · Bookings · Chat · Services**, plus `booking/[id]`, `chat/[id]`, `service-form`, `schedule`, `centre-profile` |
| verified college / training institution | tabs **Desk · Enquiries · Campus**, plus `enquiry/[id]` |
| both workspaces | `account` (header avatar): online switch, links, sign-out |

## API used (all existing, no backend changes)

| Screen | Endpoints |
|---|---|
| Online switch, centre details | `PATCH /partners/me` |
| Home, Bookings, booking detail | `GET /bookings/partner/inbox`, `PATCH /bookings/partner/:id` |
| Chat | `GET /partners/me/conversations`, `GET·POST /bookings/:id/messages`, `PATCH …/messages/read` (5 s polling) |
| Services | `GET·POST·PATCH·DELETE /partners/me/services` |
| Schedule | `GET·PUT /partners/me/schedule`, `POST·DELETE /partners/me/overrides` |
| Desk, Campus | `GET·PATCH /career/colleges/partner/desk` |
| Enquiries | `GET /career/colleges/partner/enquiries[?status]`, `PATCH …/:id` |

## Deliberately web-only

Walk-in counter, document scanner, orders pipeline, cash settlement and the
institution programs/seat matrix. On the website those run on sample data
(`apps/partner/src/lib/*-data.ts`), not on the API, so the app does not copy them.
KYC document upload is also web-only: there is no storage upload endpoint yet.

## Store

Bundle id / package `in.applyfields.partner`, scheme `applyfields-partner`. Same
EAS steps as `apps/mobile/README.md`: `eas init` (push needs the projectId), FCM +
APNs credentials, real icon/splash art, `ascAppId`/`appleTeamId` in `eas.json`.
