# apps/api — Core API (NestJS)

**What is this?** The single backend ("front door"). The website, the Internal Portal and later
the mobile app all talk to this — nothing else. It holds all business rules: login, profiles,
jobs, eligibility, saved items, reminders, notifications, publishing.

**Owner:** Likhith (core, database) + Karthik (auth, tracker) · **Tech:** NestJS + TypeScript + Prisma · **Port:** 4000

## Run it
```bash
cp .env.example .env            # first time only (inside apps/api), then fill in Supabase values
pnpm dev:api                    # from the repo root
# → http://localhost:4000/api/v1
```

## Folder guide
```
src/
├── main.ts          # starts the server (port, /api/v1 prefix, CORS)
├── app.module.ts    # root module — every feature module is registered here
├── prisma/          # PrismaService — one shared DB client, injectable everywhere (global module)
├── generated/       # Prisma client — NOT in git, rebuilt by `pnpm install` / `pnpm db:generate`
└── modules/         # one folder per feature — see modules/README.md
prisma/schema.prisma # models read from the database by `pnpm db:pull` — never edit by hand
prisma.config.ts     # tells the Prisma CLI where the schema and database are (reads .env)
test/                # end-to-end tests
```

## Endpoints today (read from the Supabase database)
| Endpoint | Used by | Module |
|---|---|---|
| `GET /api/v1/health` | footer “API connected” (also pings the database) | `modules/home` |
| `GET /api/v1/home` | home dashboard | `modules/home` |
| `GET /api/v1/opportunities?type=&q=` | jobs, exams, scholarships, admissions, search | `modules/opportunities` |
| `GET /api/v1/opportunities/:slug` | detail pages | `modules/opportunities` |
| `GET /api/v1/updates` | results & updates | `modules/opportunities` |
| `POST /api/v1/auth/register` | citizen sign-up | `modules/auth` |
| `POST /api/v1/auth/login` | citizen login → JWT + refresh cookie | `modules/auth` |
| `POST /api/v1/auth/refresh` | refresh access token | `modules/auth` |
| `POST /api/v1/auth/logout` | revoke refresh token | `modules/auth` |
| `GET /api/v1/me` | citizen profile + education + resume | `modules/users` |
| `PUT /api/v1/me/profile` | update personal & eligibility details | `modules/users` |
| `POST /api/v1/me/education` | add qualification | `modules/users` |
| `PUT /api/v1/me/education/:id` | edit qualification | `modules/users` |
| `DELETE /api/v1/me/education/:id` | remove qualification | `modules/users` |
| `POST /api/v1/me/resume` | upload resume (PDF/DOCX/TXT/image, 5 MB max) — OCR + AI extraction | `modules/users` |
| `GET /api/v1/me/resume` | get saved resume metadata | `modules/users` |
| `GET /api/v1/me/resume/download` | download saved resume file (forced attachment) | `modules/users` |
| `DELETE /api/v1/me/resume` | remove saved resume | `modules/users` |
| `GET /api/v1/admin/me` | staff user info | `modules/admin` |
| `GET /api/v1/admin/summary` | dashboard stats (real DB counts) | `modules/admin` |
| `GET /api/v1/admin/review?source=&careful=1` | drafts waiting for review (reviewer+) | `modules/admin` |
| `GET /api/v1/admin/review/:id` | draft detail + signed PDF link (reviewer+) | `modules/admin` |
| `GET /api/v1/admin/opportunities` | all opportunities with search + status filter (reviewer+) | `modules/admin` |
| `POST /api/v1/admin/opportunities` | create opportunity manually (content_editor+) | `modules/admin` |
| `GET /api/v1/admin/opportunities/:id` | opportunity detail (reviewer+) | `modules/admin` |
| `PUT /api/v1/admin/opportunities/:id` | edit opportunity (content_editor+) | `modules/admin` |
| `POST /api/v1/admin/opportunities/:id/publish` | publish a draft (admin+) | `modules/admin` |
| `POST /api/v1/admin/opportunities/:id/status` | change status (admin+) | `modules/admin` |
| `POST /api/v1/admin/opportunities/close-expired` | close past-deadline jobs now (admin+) | `modules/admin` |
| `GET /api/v1/admin/updates` | updates list (reviewer+) | `modules/admin` |
| `POST /api/v1/admin/updates` | create update (content_editor+) | `modules/admin` |
| `GET /api/v1/admin/updates/:id` | update detail (reviewer+) | `modules/admin` |
| `PUT /api/v1/admin/updates/:id` | edit update (content_editor+) | `modules/admin` |
| `POST /api/v1/admin/updates/:id/publish` | publish update (admin+) | `modules/admin` |
| `POST /api/v1/admin/updates/:id/status` | change update status (admin+) | `modules/admin` |
| `GET /api/v1/admin/users?q=&page=` | citizen + staff accounts with masked PII (admin+) | `modules/admin` |
| `GET /api/v1/admin/users/:id` | user detail with masked PII (admin+) | `modules/admin` |
| `POST /api/v1/admin/users/:id/block` | suspend account (admin+) | `modules/admin` |
| `POST /api/v1/admin/users/:id/unblock` | reactivate account (admin+) | `modules/admin` |
| `POST /api/v1/admin/users/:id/roles` | grant staff role (super_admin only) | `modules/admin` |
| `DELETE /api/v1/admin/users/:id/roles/:role` | revoke staff role (super_admin only) | `modules/admin` |

Response shapes live in [`packages/types/src/api.ts`](../../packages/types/src/api.ts) — the website imports
the same types, so a change shows up as a type error on both sides.

Citizens only ever see rows with `status = 'published'`. Lists also hide anything whose last date has passed
and sort by last date (soonest first). Queries live in `modules/opportunities/opportunities.service.ts`;
`CARD_SELECT` + `toCard()` turn a database row into the `OpportunityCard` the website shows.
Empty lists are normal until reviewers publish the first scraped jobs — the website shows an empty state.

## Internal Portal (`/admin/*`)
- Every `/admin` route goes through `common/staff.guard.ts`. Staff login is live: Bearer JWT or httpOnly cookie, verified against `user_roles`. Five levels: super_admin(50) > admin(40) > reviewer(30) > content_editor(20) > support(10). Returns 401/403 if not authenticated or insufficient role.
- `publishBlockers()` in `modules/admin/review.service.ts` is the job-format §5 check. The Publish API must reuse it.
- PDFs: the scraper stores files in the private Storage bucket `STORAGE_BUCKET` (default `notifications`).
  The API signs a 10-minute link with `SUPABASE_SERVICE_ROLE_KEY`; without the key it falls back to the official PDF URL.

## Database commands
```bash
pnpm db:pull       # after a change in database/changes/ — refresh prisma/schema.prisma from the database
pnpm db:generate   # rebuild the typed client in src/generated (also runs on pnpm install)
```

## Rules
- **Database structure:** version 1 is [`database/01_create_tables.sql`](../../database/01_create_tables.sql); every change is a SQL file in `database/changes/` ([decision 002](../../docs/decisions/002-database-changes.md)). Prisma is for `db pull` + `generate` only — never `prisma migrate` or `db push`.
- Controllers stay thin: validate input → call a service → return. Logic lives in services.
- Every input is validated with a DTO.
- Scraped jobs arrive as `status = 'draft'`; only the publish endpoint (admin role) makes them public.
