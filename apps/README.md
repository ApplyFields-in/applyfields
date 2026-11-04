# apps/ — the programs that actually run

Each folder here is a separate app that runs and gets deployed on its own.

| Folder | What it is | Who uses it | Tech | Runs on | Owner |
|---|---|---|---|---|---|
| [`web/`](web/) | **Citizen/Student website** — jobs, exams, scholarships, career mode | Public users | Next.js | http://localhost:3000 | Karthik |
| [`admin/`](admin/) | **ApplyFields Internal Portal** — review & publish jobs, manage content/users | ApplyFields team only | Next.js | http://localhost:3001 | Likhith |
| [`api/`](api/) | **Core API** — the ONE backend that web + admin + mobile talk to | The apps above | NestJS | http://localhost:4000/api/v1 | Likhith + Karthik |
| [`ingestion/`](ingestion/) | **Scrapers + AI extraction** — collects government notifications | Internal only (no public URL) | Python FastAPI | http://localhost:8000 | Harsha |
| [`partner/`](partner/) | **Partner Portal** — centres, consultants and colleges take requests | Verified partners | Next.js | http://localhost:3002 | Likhith |
| [`service/`](service/) | **Citizen Services Portal** — government services, intake forms, slot booking | Public users | Next.js | http://localhost:3003 | Likhith |
| [`mobile/`](mobile/) | **Citizen app** — the citizen portal on Android + iOS | Public users | Expo / React Native | Expo Go or a dev build | Likhith |
| [`partner-mobile/`](partner-mobile/) | **Partner app** — centres and colleges on Android + iOS | Verified partners | Expo / React Native | Expo Go or a dev build | Likhith |

## How they connect

```
 web (3000) ─────┐
 admin (3001) ───┤
 partner (3002) ─┼──►  api (4000)  ──►  Supabase Postgres  ◄──  ingestion (8000)
 service (3003) ─┤        │                                     writes DRAFT jobs only
 mobile (Expo) ──┤
 partner-mobile ─┘        └──► calls ingestion with the internal token (e.g. "re-run SSC scraper")
```

**Golden rule:** every front end only ever calls `api`. Nobody calls `ingestion` except `api`.
