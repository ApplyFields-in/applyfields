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
| `GET /api/v1/opportunities/:slug` | detail pages — returns **501 Not Implemented** until Week 3 | `modules/opportunities` |
| `GET /api/v1/updates` | results & updates | `modules/opportunities` |
| `GET /api/v1/admin/summary` | Internal Portal dashboard, review queue, scrapers — **still sample data** | `modules/admin` |

Response shapes live in [`packages/types/src/api.ts`](../../packages/types/src/api.ts) — the website imports
the same types, so a change shows up as a type error on both sides.

Citizens only ever see rows with `status = 'published'`. Lists also hide anything whose last date has passed
and sort by last date (soonest first). Queries live in `modules/opportunities/opportunities.service.ts`;
`CARD_SELECT` + `toCard()` turn a database row into the `OpportunityCard` the website shows.
Empty lists are normal until reviewers publish the first scraped jobs — the website shows an empty state.

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
