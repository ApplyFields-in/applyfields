# Team conventions

Simple rules so three people can work on one codebase without stepping on each other.

## Branches

- `main` is protected — **nobody pushes to it directly**. Everything goes through a Pull Request.
- Branch name: `<type>/<area>-<short-description>`

| Type | Use for | Example |
|---|---|---|
| `feature/` | new functionality | `feature/web-job-detail-page` |
| `fix/` | bug fix | `fix/api-login-refresh-token` |
| `chore/` | setup, config, deps | `chore/root-ci-workflow` |
| `docs/` | documentation only | `docs/job-format-v0.2` |

Areas: `web`, `admin`, `api`, `ingestion`, `types`, `ui`, `root`.

## Commits

Short and clear, present tense: `add SSC scraper`, `fix age calculation for OBC relaxation`.

## Pull Requests

- Small PRs (one feature / one fix). Big PRs don't get reviewed properly.
- Fill in the PR template.
- **Only Likhith (@EmptyEch0) approves and merges** into `main` (see `.github/CODEOWNERS`). For Likhith's own PRs, Karthik or Harsha read them, then Likhith merges as admin.
- Review within the same working day.
- **Squash and merge**, then delete the branch.

## Naming

| Thing | Style | Example |
|---|---|---|
| TypeScript variables / functions | camelCase | `getOpportunityBySlug` |
| React components / classes | PascalCase | `JobCard`, `OpportunitiesService` |
| File names (TS) | kebab-case | `job-card.tsx`, `opportunities.service.ts` |
| Python variables / functions / files | snake_case | `find_notices`, `ssc.py` |
| Database tables / columns | snake_case | `opportunity_dates`, `application_end` |
| Job-format fields | snake_case | `vacancies_total` (same in TS and Python) |
| Env variables | UPPER_SNAKE | `DATABASE_URL` |

## Ownership (who decides)

| Area | Owner |
|---|---|
| Database: new tables, indexes, prod changes | Likhith only |
| Database: columns on dev | Anyone, with their own login + a file in `database/changes/` ([decision 002](decisions/002-database-changes.md)) |
| Job format (`docs/job-format.md`) | Likhith — changes need all 3 to approve |
| `apps/web`, `packages/ui` | Karthik |
| `apps/admin`, `apps/api` core | Likhith |
| `apps/ingestion` | Harsha |

## Secrets

- Never commit `.env` files, keys or passwords. `.gitignore` already blocks `.env`.
- If a secret is committed by mistake: tell Likhith immediately — we rotate the key (deleting the commit is not enough).

## Daily rhythm

- **10:00 standup (15 min):** yesterday · today · blocked by?
- **Monday:** plan the week, agree API shapes before coding.
- **Friday:** demo what works.
