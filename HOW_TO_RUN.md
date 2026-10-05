# How to run ApplyFields

Everything you need to run the project on your laptop and find your way around the code.
Commands work in **PowerShell**, **Command Prompt** and **Git Bash**.

---

## 1. Install once

| Tool | Version | Check it | Install |
|---|---|---|---|
| Git | any recent | `git --version` | git-scm.com |
| Node.js | 22 | `node -v` | nodejs.org (LTS) |
| pnpm | 10 | `pnpm -v` | `npm install -g pnpm` |
| Python | 3.11+ | `python --version` | python.org — only for the scraper |
| uv | latest | `uv --version` | docs.astral.sh/uv — only for the scraper |

---

## 2. First time only

```powershell
git clone https://github.com/ApplyFields-in/applyfields.git
cd applyfields
pnpm install
```

**Environment files** — copy each example and fill in the values Likhith sends you privately:

| Copy | To | Needed now? |
|---|---|---|
| `apps/web/.env.example` | `apps/web/.env.local` | Optional — defaults to `http://localhost:4000/api/v1` |
| `apps/admin/.env.example` | `apps/admin/.env.local` | Optional — same default |
| `apps/api/.env.example` | `apps/api/.env` | Once the database is connected (Prisma) |
| `apps/ingestion/.env.example` | `apps/ingestion/.env` | For the scraper |

> Never commit `.env` files. Use your **own** database login (`karthik_dev`, `harsha_dev`, `ingestion_writer`) — never the `postgres` password.

---

## 3. Run it

From the `applyfields` folder:

| Command | What starts |
|---|---|
| `pnpm dev` | **Everything**: website + Internal Portal + API |
| `pnpm dev:web` | Website only |
| `pnpm dev:admin` | Internal Portal only |
| `pnpm dev:api` | API only |

The website and the portal read their data from the API, so when you run one of them on its own, also
run `pnpm dev:api` in a second terminal.

**Python scraper** (separate terminal):
```powershell
cd apps/ingestion
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Stop anything with **Ctrl + C**.

---

## 4. Open it in the browser

| App | Address | What you see |
|---|---|---|
| Website | http://localhost:3000 | Citizen & student portal |
| Internal Portal | http://localhost:3001 | Team dashboard, review queue, scrapers |
| API | http://localhost:4000/api/v1/health | `{"status":"ok"}` = API is running |
| Scraper (Python) | http://localhost:8000/docs | Internal endpoints (try `/health`) |

The website footer shows **API connected** when everything is linked up.

### Website pages
| Address | Page |
|---|---|
| `/` | Home dashboard |
| `/jobs` · `/exams` · `/scholarships` · `/admissions` | Apply Mode lists (data from the API) |
| `/services` · `/updates` · `/eligibility` · `/search?q=ssc` | Services, results & updates, eligibility, search |
| `/career` · `/career/roadmaps` · `/career/skills` · `/career/courses` · `/career/colleges` · `/career/guidance` | Career Mode |
| `/saved` · `/applications` · `/notifications` · `/documents` · `/assistance` | My space |
| `/profile` · `/account` · `/help` · `/partner` | Account, help, partner portal preview |
| `/login` · `/register` | Not built yet (Week 1) |

### Internal Portal pages
| Address | Page |
|---|---|
| `/` | Dashboard |
| `/review` · `/scrapers` | Review queue, scraper health (data from the API) |
| `/opportunities` · `/updates` · `/services` · `/careers` | Content |
| `/users` · `/partners` · `/assistance` | People |
| `/notifications` · `/reports` · `/payments` · `/audit` · `/settings` | Operations |

### API endpoints (sample data until the database is connected)
| Endpoint | Returns |
|---|---|
| `/api/v1/health` | API status |
| `/api/v1/home` | Home dashboard data |
| `/api/v1/opportunities?type=govt_job` | Jobs (also `exam`, `scholarship`, `admission`; add `&q=ssc` to search) |
| `/api/v1/updates` | Results, admit cards, answer keys |
| `/api/v1/admin/summary` | Internal Portal dashboard |

---

## 5. Where the files are

```
applyfields/
├── apps/
│   ├── web/                 Citizen website (Next.js)
│   │   └── src/app/(main)/  one folder per page — e.g. jobs/page.tsx, profile/page.tsx
│   ├── admin/               Internal Portal (Next.js)
│   │   └── src/app/(main)/  one folder per page
│   ├── api/                 Core API (NestJS)
│   │   └── src/modules/     one folder per feature — home, opportunities, admin…
│   └── ingestion/           Scrapers (Python FastAPI)
│       └── app/scrapers/    one file per website
├── packages/
│   ├── ui/                  Shared design system — colours (theme.css) and components
│   └── types/               Shared TypeScript types (job format, API responses)
├── database/                SQL for Supabase + changes/ (one file per structure change)
├── docs/                    job-format.md, conventions.md, decisions/
└── HOW_TO_RUN.md            this file
```

Every folder has its own `README.md` explaining what goes inside.
**To build a page:** open its `page.tsx` and replace `<SectionPage … />` with the real UI (see `apps/web/README.md`).

---

## 6. Before you open a pull request

```powershell
pnpm lint
pnpm typecheck
pnpm test
```
Python (inside `apps/ingestion`): `uv run ruff check .` and `uv run pytest`

Production build (optional): `pnpm build`

---

## 7. Problems?

| Problem | Fix |
|---|---|
| **Footer says "API offline"** / “Can’t reach the API” | Start the API: `pnpm dev:api` (or `pnpm dev` for everything) |
| **`EADDRINUSE` / port already in use** | The app is already running in another terminal — close it, or in PowerShell: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess` (change 3000 to the busy port) |
| **`pnpm` is not recognised** | `npm install -g pnpm`, then open a new terminal |
| **Errors after pulling new code** | Run `pnpm install` again |
| **Page shows “This page isn’t built yet”** | Normal — that page is planned but not built yet |
| **`git push` fails with HTTP 408** | Slow network. Run `git config --global http.version HTTP/1.1` and push again, or use a phone hotspot |
