# ApplyFields

<div align="center">

**Every opportunity. One place.**

_A unified, trusted, and verified guidance platform for Indian citizens and students._  
_Discover, understand, verify eligibility, prepare, apply via official channels, track milestones, and receive real-time alerts._

[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-000000?style=flat-square&logo=turborepo)](https://turbo.build/)
[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![NestJS 11](https://img.shields.io/badge/Backend-NestJS%2011-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![FastAPI](https://img.shields.io/badge/Ingestion-FastAPI%20%7C%20Python%203.11+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20Postgres-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/Package%20Manager-pnpm%2010-F69220?style=flat-square&logo=pnpm)](https://pnpm.io/)
[![Milestone](https://img.shields.io/badge/Release-v3%20Complete-1A936F?style=flat-square)](claude-sessions/12_roadmaps-courses-colleges-v3.md)

</div>

---

## 📖 Table of Contents

- [Overview & Mission](#-overview--mission)
- [Core User Modes & Features](#-core-user-modes--features)
  - [1. Apply Mode](#1-apply-mode)
  - [2. Career Mode (v3)](#2-career-mode-v3)
  - [3. Citizen Workspace & Document Vault](#3-citizen-workspace--document-vault)
- [System Architecture & Data Flow](#-system-architecture--data-flow)
- [Portals & Applications](#-portals--applications)
- [Repository Structure](#-repository-structure)
- [Tech Stack](#-tech-stack)
- [Design System & UI Theme](#-design-system--ui-theme)
- [Quick Start & Local Development](#-quick-start--local-development)
- [Environment Configuration](#-environment-configuration)
- [Database Architecture & Migrations](#-database-architecture--migrations)
- [Data Contract & "Truth-in-Data" Principle](#-data-contract--truth-in-data-principle)
- [Code Quality & Testing](#-code-quality--testing)
- [Milestones & Roadmap](#-milestones--roadmap)
- [Core Engineering Rules](#-core-engineering-rules)
- [Team & Ownership](#-team--ownership)

---

## 🎯 Overview & Mission

Millions of Indian students and citizens struggle with a fragmented ecosystem of government job notifications, competitive exam announcements, scholarships, and citizen services. Official portals are scattered, PDF circulars are complex and unsearchable, and commercial sites are filled with misleading information, spam, and non-official links.

**ApplyFields** solves this by acting as a clean, reliable **guidance and verification layer**:

- **Official Route Always**: Every opportunity links directly to the verified official government portal. ApplyFields never acts as a middleman or takes over official applications.
- **Truth in Data**: If an official notification does not state a fee, age relaxation, or deadline, ApplyFields displays _"Not mentioned in official notification"_ rather than guessing or hallucinating.
- **Zero Ambiguity**: Clear eligibility checks, automated deadline tracking, admit card and result alerts, step-by-step career roadmaps, and grounded AI guidance.

---

## ✨ Core User Modes & Features

### 1. Apply Mode

- **Government Jobs**: Central, State, District, Panchayat, Municipal, PSU, Railways, Banking, Defence, Police, SSC, UPSC, and State PSCs.
- **Exams**: National & State competitive and entrance examinations (JEE, NEET, CUET, CAT, GATE, Civil Services, SSC CGL/CHSL, etc.).
- **Scholarships**: National Scholarship Portal (NSP), State welfare scholarships, and verified educational trusts with eligibility criteria and document checklists.
- **Admissions**: Central and State university admissions, polytechnic, ITI, and professional courses.
- **Government Citizen Services**: Direct assistance and guidelines for essential certificates, PAN, Passport, Aadhaar, MeeSeva, and CSC services.
- **Real-Time Updates & Results**: Instant alerts for Admit Cards, Answer Keys, Results, Cut-offs, and Postponement notices.

### 2. Career Mode (v3)

- **Interactive Career Roadmaps**: Step-by-step career trajectories with stages, milestones, recommended learning, required certifications, and linked real-world entrance exams and jobs.
- **Live Progress Tracking**: Personalized checklist tracking with real-time percentage completion stored in the user profile.
- **Degree & Course Explorer**: Comprehensive degree catalogue (B.Tech, MBBS, B.Com, Law, Design, etc.) covering duration, eligibility, entrance exams, career outcomes, and skills.
- **Colleges & Universities Directory**: Detailed profiles for premier Indian institutions (IITs, IIMs, AIIMS, NLSIUs, Central Universities) with fee ranges, programmes, eligibility, and a **side-by-side college comparison matrix**.
- **Grounded AI Career Guidance**: Conversational advisor powered by Claude API, strictly grounded in official ApplyFields data with source citations and zero hallucinations.

### 3. Citizen Workspace & Document Vault

- **Eligibility Engine**: Profile matching against age, education, category, domicile, and quota criteria.
- **Application Tracker**: Save opportunities, log official application submission IDs, set deadline reminders, and track stages.
- **Resume Upload & AI Parsing**: Multi-format resume parsing (PDF, DOCX, TXT, OCR) extracting education, skills, and experience into structured profile data.

---

## 🏗️ System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OFFICIAL GOVT WEBSITES                         │
│                  (UPSC · SSC · APPSC · TSPSC · NTA)                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                       Scrapes notices & PDFs
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 INGESTION ENGINE (apps/ingestion)                      │
│        Python 3.11 · FastAPI · PDF Text & OCR · Schema Validation       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Writes DRAFT records only
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  SUPABASE POSTGRES (66+ Tables)                        │
│             Strict RLS · Role-based Database Privileges                │
└───────────────────────▲───────────────────────▲────────────────────────┘
                        │                       │
           Direct Query │                       │ Admin actions / Audits
                        ▼                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      CORE API (apps/api)                               │
│        NestJS 11 · TypeScript · Prisma 7 · Zod Validation · JWT Auth   │
└───────────────────────▲───────────────────────▲────────────────────────┘
                        │                       │
             Public API │                       │ Protected Staff API
                        ▼                       ▼
┌───────────────────────────────┐       ┌────────────────────────────────┐
│   CITIZEN WEBSITE (apps/web)  │       │   INTERNAL PORTAL (apps/admin) │
│ Next.js 16 (App Router)       │       │ Next.js 16 (App Router)        │
│ Port 3000                     │       │ Port 3001                      │
│                               │       │                                │
│ • Apply Mode (Jobs/Exams)     │       │ • Draft Review Queue           │
│ • Career Mode & Roadmaps      │       │ • Side-by-Side PDF Inspector   │
│ • College Comparison          │       │ • Scraper Health & Telemetry   │
│ • AI Career Guidance          │       │ • Opportunity Publishing Gate  │
│ • Citizen Workspace & Tracker │       │ • Staff RBAC & Audit Trail     │
└───────────────────────────────┘       └────────────────────────────────┘
```

### The Ingestion-to-Publish Lifecycle

1. **Scrape**: The Python crawler visits official portals, downloads notification PDFs, and runs OCR where necessary.
2. **Normalize**: Data is mapped to the standard [Job Format](docs/job-format.md) and validated via Pydantic.
3. **Draft**: Records are written to Supabase with `status = 'draft'` via the restricted `ingestion_writer` role.
4. **Review**: Team reviewers inspect the original PDF alongside extracted fields in the Internal Portal (`apps/admin`).
5. **Publish**: Admin approves and publishes; the Core API (`apps/api`) exposes it to the public citizen website (`apps/web`).

---

## 🖥️ Portals & Applications

| App                  | Directory                          | Tech Stack                          |  Port  | Purpose                                                                                           |
| -------------------- | ---------------------------------- | ----------------------------------- | :----: | ------------------------------------------------------------------------------------------------- |
| **Citizen Website**  | [`apps/web`](apps/web)             | Next.js 16, React 19, Tailwind v4   | `3000` | Public portal for citizens & students (Apply Mode, Career Mode, Search, Profile).                 |
| **Internal Portal**  | [`apps/admin`](apps/admin)         | Next.js 16, React 19, Tailwind v4   | `3001` | Private operations portal for ApplyFields staff (Review queue, publishing, audit logs, scrapers). |
| **Core API**         | [`apps/api`](apps/api)             | NestJS 11, TypeScript ESM, Prisma 7 | `4000` | Single unified backend providing REST endpoints under `/api/v1` with validation and auth.         |
| **Ingestion Engine** | [`apps/ingestion`](apps/ingestion) | Python 3.11+, FastAPI, uv, Pydantic | `8000` | Scrapers, PDF OCR, AI extraction, and draft notification pipeline.                                |

---

## 📁 Repository Structure

```
applyfields/
├── apps/
│   ├── web/                    # Citizen website (Next.js 16 App Router)
│   ├── admin/                  # Internal operations portal (Next.js 16 App Router)
│   ├── api/                    # Core REST API (NestJS 11)
│   │   ├── src/modules/        # Feature modules (opportunities, career, roadmaps, admin, guidance...)
│   │   └── prisma/             # Schema & Prisma client configuration
│   └── ingestion/              # Scrapers & extraction pipeline (Python FastAPI)
│       └── app/scrapers/       # Scraper definitions per official portal
│
├── packages/
│   ├── ui/                     # ApplyFields Design System (tokens, buttons, cards, claymorphism)
│   ├── types/                  # Shared TypeScript types & API data contracts
│   └── config/                 # Shared TypeScript & linter configs
│
├── database/
│   ├── 01_create_tables.sql    # Complete Supabase schema (66 tables, enums, triggers, RLS)
│   ├── 02_team_roles.sql       # Role-based database permissions & developer accounts
│   └── changes/                # Versioned SQL migration files (one file per structure change)
│
├── docs/
│   ├── conventions.md          # Branching model, PR guidelines, and naming conventions
│   ├── job-format.md           # ⭐ Canonical data contract between scrapers, DB, and apps
│   ├── decisions/              # Architecture Decision Records (ADRs)
│   └── README.md               # Documentation guide
│
├── .github/                    # Pull request templates and codeowners
├── HOW_TO_RUN.md               # Detailed developer setup and troubleshooting handbook
├── package.json                # Turborepo root workspace scripts
├── pnpm-workspace.yaml         # pnpm workspace configuration
└── turbo.json                  # Turborepo task pipeline definitions
```

---

## 🛠️ Tech Stack

| Domain                 | Technology                                                                  | Version        | Purpose & Rationale                                             |
| ---------------------- | --------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------- |
| **Monorepo**           | [Turborepo](https://turbo.build/)                                           | `^2.0`         | High-performance build system with intelligent caching.         |
| **Package Manager**    | [pnpm](https://pnpm.io/)                                                    | `10.x`         | Fast, disk space efficient dependency management.               |
| **Runtime**            | [Node.js](https://nodejs.org/)                                              | `>=22 LTS`     | Modern JavaScript runtime supporting native ESM.                |
| **Frontend Framework** | [Next.js](https://nextjs.org/)                                              | `16`           | App Router, Server Components, and optimized rendering.         |
| **Styling**            | [Tailwind CSS](https://tailwindcss.com/)                                    | `v4`           | Design-token-constrained utility CSS with claymorphism.         |
| **Backend Framework**  | [NestJS](https://nestjs.com/)                                               | `11`           | Enterprise-grade modular architecture and dependency injection. |
| **Database & Auth**    | [Supabase Postgres](https://supabase.com/)                                  | Latest         | PostgreSQL with Row Level Security (RLS) and Auth.              |
| **ORM**                | [Prisma](https://www.prisma.io/)                                            | `7.x`          | Type-safe database client (`db pull` + `generate` workflow).    |
| **Validation**         | [Zod](https://zod.dev/)                                                     | `^3.24`        | Strict schema validation with shared types.                     |
| **Scraping & OCR**     | [FastAPI](https://fastapi.tiangolo.com/) + [uv](https://docs.astral.sh/uv/) | `Python 3.11+` | Asynchronous crawlers, PDF processing, and Pydantic validation. |
| **AI Guidance**        | [Anthropic Claude API](https://www.anthropic.com/)                          | Claude 3.5     | Grounded career advisor with source citation verification.      |

---

## 🎨 Design System & UI Theme

ApplyFields uses an intentional, accessible 5-color palette defined in [`packages/ui`](packages/ui/src/theme.css). Standard Tailwind generic colors (`bg-white`, `text-gray-500`, etc.) are disabled to maintain strict visual brand consistency:

|     Token     |     Hex      | Usage                                                                  |
| :-----------: | :----------: | ---------------------------------------------------------------------- |
|  **`teal`**   |  `#114B5F`   | Deep primary text, sidebar headers, prominent buttons, brand contrast. |
|   **`sea`**   |  `#1A936F`   | Progress indicators, active tab states, verified badges, key metrics.  |
| **`celadon`** |  `#88D498`   | Success badges, highlights, secondary accents.                         |
|   **`tea`**   |  `#C6DABF`   | Subtle borders, soft chip backgrounds, muted tags.                     |
|  **`cream`**  |  `#F3E9D2`   | Card backgrounds, warm surface elevation, text on teal surfaces.       |
| **`canvas`**  |   _blend_    | Warm, organic page background (tea + cream blend).                     |
|  **`line`**   | `teal @ 14%` | Clean, subtle borders and dividers.                                    |

### Claymorphism Elevation System

Custom clay elevation utility classes provide tactile warmth:

- `shadow-card`: Standard card elevation with soft clay depth.
- `shadow-clay`: Interactive hover lift effect.
- `shadow-pressed`: Inset press feel on active click states.
- `clay-press`: Combined active micro-interaction transform.

---

## 🚀 Quick Start & Local Development

### 1. Prerequisites

Ensure the following tools are installed on your machine:

- **Node.js**: `v22+ LTS` (`node -v`)
- **pnpm**: `v10+` (`pnpm -v` or install via `npm install -g pnpm`)
- **Git**: Recent version (`git --version`)
- **Python**: `3.11+` (for `apps/ingestion`)
- **uv**: Latest (`uv --version` or install via `curl -LsSf https://astral.sh/uv/install.sh`)

### 2. Initial Setup

```bash
# Clone the repository
git clone https://github.com/ApplyFields-in/applyfields.git
cd applyfields

# Install all monorepo dependencies
pnpm install
```

### 3. Configure Environment Variables

Copy the example environment files in each app:

```bash
# Core API (Required for running apps)
cp apps/api/.env.example apps/api/.env

# Citizen Web & Admin Portal (Optional defaults available)
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local

# Ingestion Engine (For running scrapers)
cp apps/ingestion/.env.example apps/ingestion/.env
```

> _Fill in your developer database credentials provided by the Team Lead._

### 4. Run Development Servers

From the repository root:

```bash
# Run ALL apps simultaneously (Web :3000, Admin :3001, API :4000)
pnpm dev

# Or run individual applications
pnpm dev:web     # Website only (http://localhost:3000)
pnpm dev:admin   # Internal Portal only (http://localhost:3001)
pnpm dev:api     # Core API only (http://localhost:4000/api/v1)
```

To run the Python Ingestion Service (in a separate terminal):

```bash
cd apps/ingestion
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

### 5. Verified Endpoints & Ports

- **Citizen Website**: [http://localhost:3000](http://localhost:3000)
- **Internal Portal**: [http://localhost:3001](http://localhost:3001)
- **Core API Health**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health) _(returns `{"status":"ok"}`)_
- **Ingestion API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

_For comprehensive troubleshooting, port conflicts, and page directories, see [`HOW_TO_RUN.md`](HOW_TO_RUN.md)._

---

## 🔐 Database Architecture & Migrations

The database is built on **Supabase PostgreSQL** containing **66+ tables** with comprehensive Row Level Security (RLS) enabled on every single table.

### Permission Hierarchy

- `postgres` (Superadmin): Production infrastructure & full DDL (Team Lead only).
- `karthik_dev` / `harsha_dev` (`app_developer` role): Can insert/update rows and alter existing columns on the **dev** database. Cannot create or drop tables.
- `ingestion_writer`: Scraper role restricted to creating `draft` records only.
- `anon` / `publishable`: Locked down. The web and admin clients communicate strictly via the NestJS API.

### Migration Workflow (Never use `prisma migrate`!)

To protect database integrity:

1. Write the migration as a pure SQL statement (e.g., `alter table ... add column ...;`).
2. Test it on the **DEV** database using your developer credentials.
3. Save the SQL file in [`database/changes/`](database/changes/) following the naming standard:  
   `YYYY-MM-DD_<author>_<feature_name>.sql`.
4. Refresh Prisma schemas in the API:
   ```bash
   cd apps/api
   pnpm db:pull       # Introspects DB changes into prisma/schema.prisma
   pnpm db:generate   # Rebuilds the typed Prisma Client
   ```
5. Submit a PR containing the SQL file and updated `schema.prisma`.

---

## 📜 Data Contract & "Truth-in-Data" Principle

The ApplyFields data model follows the strict contract documented in [`docs/job-format.md`](docs/job-format.md).

```
"Never invent data. Never guess. Official notification is the single source of truth."
```

1. **Explicit Missing Status (`field_status`)**:
   When an official notification does not specify an application fee, syllabus, or deadline, the field is stored as `null` with a reason:
   - `not_in_source`: The official body did not mention it.
   - `pending`: To be announced in a future circular.
2. **Publish Blockers**:
   The Internal Portal prevents publishing any opportunity unless all mandatory fields pass automated validation checks:
   - Official application URL is present and verified.
   - Official notification PDF is attached.
   - Valid application deadline date format.
   - Title, conducting authority, and category are specified.
3. **Draft Quarantine**:
   Scrapers never publish directly. All ingested opportunities enter the review queue for human verification.

---

## 🧪 Code Quality & Testing

Run verification commands across the monorepo before opening any pull request:

```bash
# Lint all TypeScript apps and packages
pnpm lint

# TypeScript typecheck across all workspaces
pnpm typecheck

# Run unit and integration tests
pnpm test

# Format code using Prettier
pnpm format
```

For the Python Ingestion service:

```bash
cd apps/ingestion
uv run ruff check .
uv run ruff format .
uv run pytest
```

---

## 🗺️ Milestones & Roadmap

| Version |     Status     | Milestone Highlights                                                                                                                                                                    |
| :-----: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v1**  |  ✅ Complete   | Monorepo scaffolding, design system (`@applyfields/ui`), 66 Supabase tables + RLS, NestJS Core API, basic citizen web & admin skeletons.                                                |
| **v2**  |  ✅ Complete   | Ingestion scrapers & PDF extraction pipeline, Internal Portal review queue, Apply Mode (Jobs, Exams, Scholarships, Admissions), search & eligibility filter, user auth & saved tracker. |
| **v3**  |  ✅ Complete   | **Career Mode**: Career explorer, step-by-step roadmaps with progress tracking, Course catalog, College directory with comparison matrix, and Grounded AI Career Guidance (Claude API). |
| **v4**  | 🚀 In Progress | Partner Portal (MeeSeva / CSC network), payment integrations, multi-language localization (Hindi, Telugu, etc.), mobile apps (React Native / Expo).                                     |

---

## ⚖️ Core Engineering Rules

1. **Truth in Data**: Never fabricate, estimate, or hallucinate missing information.
2. **Zero Secrets in Git**: Never commit `.env` files, production keys, or private database passwords.
3. **Protected Main Branch**: Always branch from `main` (`feat/<feature-name>`), test locally, run CI checks, and open a PR. Only the Team Lead merges to `main`.
4. **Thin Controllers, Thick Services**: In `apps/api`, keep controllers focused on route binding and DTO validation. Encapsulate business logic in reusable services.
5. **Palette Strictness**: In `apps/web` and `apps/admin`, strictly use the design system palette tokens (`teal`, `sea`, `celadon`, `tea`, `cream`). Generic CSS colors are rejected.

---

## 👥 Team & Ownership

| Contributor       | Role                       | Core Ownership                                                                         |
| ----------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| **Likhith**       | Team Lead / Lead Architect | Architecture, Database schemas, `apps/api` core, `apps/admin`, deployments, PR reviews |
| **YGS Karthik**   | Full Stack Engineer        | `apps/web` (Citizen portal), `packages/ui` design system, Auth & User profiles         |
| **Harshavardhan** | Backend & Data Engineer    | `apps/ingestion` (Python crawlers, OCR, AI extraction), Search indexing                |
| **Samyutha**      | Product & Operations (CEO) | Product requirements, partner relationships, milestone sign-offs                       |

---

<div align="center">

**ApplyFields** — Built with precision for the citizens and students of India.  
_Need help getting started? Read [`HOW_TO_RUN.md`](HOW_TO_RUN.md)._

</div>
