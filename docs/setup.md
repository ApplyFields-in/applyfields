# Setup — run ApplyFields on your laptop

No Docker needed. The database is Supabase (cloud).

## 1. Install once

| Tool | Version | Check |
|---|---|---|
| Git | any recent | `git --version` |
| Node.js | 22 LTS | `node -v` |
| pnpm | 10 | `pnpm -v` (install: `npm i -g pnpm`) |
| Python | 3.11+ | `python --version` (only needed for `apps/ingestion`) |
| uv | latest | `uv --version` (install: https://docs.astral.sh/uv/) |
| VS Code | — | Install the recommended extensions when VS Code asks |

## 2. Get the code

```bash
git clone <repo-url> applyfields
cd applyfields
pnpm install                    # installs web + admin + api + packages
```

## 3. Environment files (secrets)

Ask **Likhith** for the dev values (shared privately — never on WhatsApp groups or GitHub).

| App | Copy | To |
|---|---|---|
| api | `apps/api/.env.example` | `apps/api/.env` |
| web | `apps/web/.env.example` | `apps/web/.env.local` |
| admin | `apps/admin/.env.example` | `apps/admin/.env.local` |
| ingestion | `apps/ingestion/.env.example` | `apps/ingestion/.env` |

Where the Supabase values are: **Supabase dashboard → Project Settings → Database** (connection strings) and **→ API** (URL + keys).

> ⚠️ Always use the **dev** Supabase project locally. Never the prod one.
> In `DATABASE_URL`, use **your own database login** (`karthik_dev.<project-ref>` / `harsha_dev.<project-ref>`) — never the `postgres` password. See [`database/README.md`](../database/README.md).

## 4. Run

```bash
pnpm dev            # web + admin + api together
# or one at a time:
pnpm dev:web        # http://localhost:3000
pnpm dev:admin      # http://localhost:3001
pnpm dev:api        # http://localhost:4000/api/v1

# Python ingestion (separate terminal)
cd apps/ingestion
uv sync
uv run uvicorn app.main:app --reload --port 8000   # http://localhost:8000/health
```

## 5. Before you open a PR

```bash
pnpm lint
pnpm typecheck
pnpm test
# Python:
cd apps/ingestion && uv run ruff check . && uv run pytest
```

## Ports

| App | Port |
|---|---|
| web | 3000 |
| admin | 3001 |
| api | 4000 |
| ingestion | 8000 |
