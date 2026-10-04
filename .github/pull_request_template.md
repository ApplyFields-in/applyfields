## What does this PR do?
<!-- One or two sentences. -->

## Area
- [ ] web
- [ ] admin
- [ ] api
- [ ] ingestion
- [ ] packages (types / ui / config)
- [ ] docs / root config

## How did you test it?
<!-- e.g. "Opened /jobs locally, filtered by state", "ran uv run pytest" -->

## Screenshots (for UI changes)

## Checklist
- [ ] Runs locally without errors
- [ ] `pnpm lint` and `pnpm typecheck` pass (Python: `ruff check` + `pytest`)
- [ ] No secrets, keys or `.env` files committed
- [ ] If the job format changed: `docs/job-format.md` + `packages/types` + Python schema all updated
- [ ] If the database changed: Likhith made/approved the migration
- [ ] Missing data shows the right `field_status` message (no blanks, nothing invented)
