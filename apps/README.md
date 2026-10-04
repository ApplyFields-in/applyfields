# apps/ — the programs that actually run

Each folder here is a separate app that runs and gets deployed on its own.

| Folder | What it is | Who uses it | Tech | Runs on | Owner |
|---|---|---|---|---|---|
| [`web/`](web/) | **Citizen/Student website** — jobs, exams, scholarships, career mode | Public users | Next.js | http://localhost:3000 | Karthik |
| [`admin/`](admin/) | **ApplyFields Internal Portal** — review & publish jobs, manage content/users | ApplyFields team only | Next.js | http://localhost:3001 | Likhith |
| [`api/`](api/) | **Core API** — the ONE backend that web + admin + mobile talk to | The apps above | NestJS | http://localhost:4000/api/v1 | Likhith + Karthik |
| [`ingestion/`](ingestion/) | **Scrapers + AI extraction** — collects government notifications | Internal only (no public URL) | Python FastAPI | http://localhost:8000 | Harsha |

## How they connect

```
 web (3000) ──┐
              ├──►  api (4000)  ──►  Supabase Postgres  ◄──  ingestion (8000)
 admin (3001) ┘        │                                     writes DRAFT jobs only
                       └──► calls ingestion with the internal token (e.g. "re-run SSC scraper")
```

**Golden rule:** `web` and `admin` only ever call `api`. Nobody calls `ingestion` except `api`.

## Coming later (don't create yet)
- `mobile/` — Android + iOS app (Expo) — Month 3
- `partner/` — Partner Portal — Month 4
