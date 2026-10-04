# packages/config — shared settings

**What is this?** Settings files that every TypeScript project in the repo reuses, so we don't
copy-paste the same config five times.

**Owner:** Likhith

**What goes here**
- `tsconfig.base.json` — strict TypeScript settings. Packages extend it:
  ```json
  { "extends": "../config/tsconfig.base.json" }
  ```
- Later: shared ESLint / Prettier presets if the apps start to drift.

**Rule:** changes here affect every app — open a PR and tell the team.
