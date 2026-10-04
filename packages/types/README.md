# packages/types — shared TypeScript types

**What is this?** The "dictionary" of the project. Types that more than one app needs live here,
so `web`, `admin` and `api` all agree on what a job, user or update looks like.

**Owner:** Likhith (everyone can propose changes by PR)

**What goes here**
- `src/opportunity.ts` — the job format (mirror of [`docs/job-format.md`](../../docs/job-format.md))
- Later: user/profile types, API request/response shapes

**How to use it**
```ts
import type { Opportunity } from '@applyfields/types';
```
Add `"@applyfields/types": "workspace:*"` to the app's `package.json` dependencies first.

**Rules**
- Types only — no business logic, no React, no database code.
- If you change `opportunity.ts`, update `docs/job-format.md` and the Python schema in the same PR.
