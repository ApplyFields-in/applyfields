# apps/admin — ApplyFields Internal Portal

**What is this?** The private website for the ApplyFields team (founder document §22). Right now it is
the **complete skeleton**: the dashboard, review queue and scrapers pages read sample data from the API;
the other pages show their final layout with a “Being built · Week N” label.

**Owner:** Likhith · **Tech:** Next.js 16 + TypeScript + Tailwind v4 · **Port:** 3001

## Run it
```bash
pnpm dev:admin      # or `pnpm dev` from the repo root for everything
```

## Pages
| URL | Page | Data |
|---|---|---|
| `/` | Dashboard — stats, review queue, scraper health | `GET /admin/summary` |
| `/review` | Review queue (official PDF ↔ editable fields, publish) | `GET /admin/summary` |
| `/opportunities`, `/updates`, `/services`, `/careers` | Content management | sample |
| `/users`, `/partners`, `/assistance` | People | sample |
| `/notifications`, `/reports`, `/payments`, `/scrapers`, `/audit`, `/settings` | Operations | `/scrapers` reads the API |
| `/login` | Staff log in | not built (Week 2) |

## How to build a page
Same as the website: open `src/app/(main)/<page>/page.tsx`, replace `<SectionPage …/>` with the real UI,
read data only through `apiGet()` in `src/lib/api.ts`. Content for unbuilt pages is in `src/lib/sections.tsx`.

## Rules
- Only staff with an admin role can log in (enforced by the API, not just the UI).
- Publish is blocked unless the required fields exist (see [`docs/job-format.md`](../../docs/job-format.md) §5).
- Every important action writes to the audit log.
- Same palette rules as the website.
