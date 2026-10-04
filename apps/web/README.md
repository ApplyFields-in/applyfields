# apps/web — Citizen/Student website

**What is this?** The website the public uses. Right now it is the **complete skeleton**: every page from
the founder document exists with its final layout, but most pages show sample content and a
“Being built · Week N · Owner” label. Login, details and other unbuilt pages open a “Not built yet” page.

**Owner:** Karthik · **Tech:** Next.js 16 (App Router) + TypeScript + Tailwind v4 · **Port:** 3000

## Run it
```bash
pnpm dev            # from the repo root: web :3000 + admin :3001 + api :4000
```
Pages that show live data (home, jobs, exams, scholarships, admissions, updates, search) read from the
API. If the API isn't running they show “Can't reach the API”. The footer shows **API connected / offline**.

## How it is organised
```
src/
├── app/
│   ├── (main)/              pages WITH sidebar + top bar (layout.tsx)
│   │   ├── page.tsx         Home dashboard          ← GET /home
│   │   ├── jobs/            list ← GET /opportunities?type=govt_job · [slug] = detail (not built)
│   │   ├── exams/ scholarships/ admissions/   same pattern
│   │   ├── services/ updates/ eligibility/ search/
│   │   ├── career/          explore · roadmaps · skills · courses · colleges · guidance
│   │   ├── saved/ applications/ notifications/ documents/ assistance/
│   │   ├── profile/ account/ help/ partner/
│   ├── (auth)/              login, register — no sidebar
│   └── not-found.tsx        any link to a page that doesn't exist yet
├── components/              site-shell (sidebar/top bar/footer), opportunity cards, home blocks
└── lib/
    ├── api.ts               the ONLY place that calls the backend
    ├── nav.tsx              the sidebar menu
    ├── sections.tsx         content of every not-yet-built page (features, owner, week, preview)
    └── format.tsx           dates, labels, icons per opportunity type
```

## How to build your page
1. Open the page file, e.g. `src/app/(main)/profile/page.tsx`.
2. Replace `<SectionPage info={SECTIONS.profile} />` with the real UI (keep the file and URL).
3. Get data only through `apiGet()` from `src/lib/api.ts` (add the API endpoint first).
4. Use the shared components from `@applyfields/ui` (Card, Badge, Button styles, PageHeader…).
5. Delete that page's entry from `lib/sections.tsx` when it is no longer used.

## Rules
- **Colours:** only the 5 palette colours (`teal`, `sea`, `celadon`, `tea`, `cream` + `canvas`/`line`). Other colours don't exist — `bg-white` simply won't work. See `packages/ui/src/theme.css`.
- Only call the **NestJS API**. Never Supabase or the scraper directly.
- No business logic in components (eligibility is calculated by the API).
- Missing data: follow `field_status` in [`docs/job-format.md`](../../docs/job-format.md) §3 — never show a blank.
- Every opportunity page shows the official source + “ApplyFields is not a government website”.
- Mobile first: check every page at 390 px wide.
