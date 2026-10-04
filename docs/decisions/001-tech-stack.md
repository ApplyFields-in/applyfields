# 001 — Tech stack

**Date:** 2026-10-03 · **Status:** Accepted · **Decided by:** Likhith

## Decision

| Layer | Choice |
|---|---|
| Citizen website + Internal Portal | Next.js (App Router), TypeScript, Tailwind |
| Core API (the only backend the apps call) | NestJS, TypeScript, Prisma |
| Scrapers / PDF / AI extraction | Python, FastAPI (internal only) |
| Database | Supabase PostgreSQL (dev + prod projects, Mumbai region) |
| File storage | Supabase Storage (private buckets) |
| Mobile (Month 3) | React Native + Expo |
| Repo | One monorepo — pnpm workspaces + Turborepo |
| Local setup | No Docker at the start |

## Why

- **Next.js** — job pages must rank on Google (server rendering + SEO).
- **NestJS** — clear modules for a big product; one front door for web, admin and mobile.
- **Python** — best language for scraping, PDF reading, OCR and AI.
- **Supabase** — managed Postgres, nothing to run ourselves; Postgres can grow with us.
- **No Docker** — fewer moving parts for a 3-person team; can be added before production.

## Rules that come with it

1. `web` and `admin` only call `api`. Nobody calls `ingestion` except `api`.
2. Database structure changes follow [decision 002](002-database-changes.md) (SQL change files). Python code never changes the structure.
3. Python writes **drafts** only; publishing happens through the API with an admin role.
4. Row Level Security is turned **on** for every table (no policies), so Supabase's automatic public API can't read our data. The API connects as the database owner and is unaffected.
