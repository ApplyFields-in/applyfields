# ApplyFields

**Every opportunity. One place.**
Government jobs, exams, scholarships, services, admissions and career guidance — discover,
understand, check eligibility, apply through the official route, track and get reminders.

---

## What's in this repo

```
applyfields/
├── apps/                  ← the programs that run
│   ├── web/               Citizen/Student website            (Next.js · Karthik)
│   ├── admin/             ApplyFields Internal Portal         (Next.js · Likhith)
│   ├── api/               Core API — the only backend         (NestJS  · Likhith + Karthik)
│   └── ingestion/         Scrapers + PDF + AI extraction      (Python FastAPI · Harsha)
│
├── packages/              ← code shared between apps (nothing here runs alone)
│   ├── types/             Shared TypeScript types (the job format)
│   ├── ui/                Shared React components (web + admin)
│   └── config/            Shared TypeScript settings
│
├── database/              ← Supabase schema: 66 tables + RLS (run in the SQL Editor)
│   ├── 01_create_tables.sql
│   ├── 02_team_roles.sql  Team logins: devs edit rows + columns, no new tables
│   └── changes/           One SQL file per structure change
│
├── docs/                  ← read these first
│   ├── setup.md           How to run the project on your laptop
│   ├── conventions.md     Branches, PRs, naming, ownership
│   ├── job-format.md      ⭐ The data contract between scrapers and the app
│   └── decisions/         Why we chose our tech stack
│
└── .github/               PR template + code owners
```

Every folder has its own `README.md` explaining what goes inside.

## How the pieces connect

```
  Citizen website (web) ──┐
                          ├──►  Core API (api)  ──►  Supabase Postgres
  Internal Portal (admin) ┘                              ▲
                                                         │ saves DRAFT jobs
                              Scrapers (ingestion) ──────┘
                              reads official govt websites

  Draft job → reviewer checks it in the Internal Portal → Publish → visible on the website
```

## Quick start

```bash
pnpm install          # first time
pnpm dev              # web :3000 · admin :3001 · api :4000
```

Full instructions (env files, Python, Supabase): [`docs/setup.md`](docs/setup.md)

## Team

| Person | Role | Owns |
|---|---|---|
| Likhith | Team Lead | Architecture, database, `api` core, `admin`, deployments, reviews |
| YGS Karthik | Full Stack | `web`, `packages/ui`, auth + profile in `api` |
| Harshavardhan | Backend / Python | `ingestion` (scrapers, AI extraction), eligibility rules, search |

## Three rules everyone follows

1. **Never invent data.** Missing information is shown as "Not mentioned in the official notification" — see [`docs/job-format.md`](docs/job-format.md).
2. **Never commit secrets.** `.env` files stay on your laptop.
3. **Never push to `main`.** Branch → Pull Request → review → merge. See [`docs/conventions.md`](docs/conventions.md).
