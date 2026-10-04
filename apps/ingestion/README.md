# apps/ingestion — Scrapers + AI extraction (Python)

**What is this?** The robot that collects government notifications. It visits official websites
(SSC, UPSC, APPSC…), finds new notices, reads the PDFs, extracts the details into the
[job format](../../docs/job-format.md), and saves them to the database as **drafts**.
A human then reviews and publishes them in the Internal Portal.

**Owner:** Harsha · **Tech:** Python 3.11+ · FastAPI · uv · **Port:** 8000 · **Internal only**

## Run it
```bash
cd apps/ingestion
cp .env.example .env            # first time only
uv sync                         # install dependencies
uv run uvicorn app.main:app --reload --port 8000
uv run pytest                   # tests
uv run ruff check . && uv run ruff format .   # lint + format
```

## Folder guide
```
app/
├── main.py         # FastAPI app — internal endpoints (protected by INTERNAL_SERVICE_TOKEN)
├── config.py       # settings from .env
├── schemas/        # the job format as Pydantic models (mirror of packages/types)
├── scrapers/       # ONE file per website: ssc.py, upsc.py, appsc.py… (extend base.py)
├── extract/        # PDF text, OCR, AI extraction → Opportunity object
└── db/             # saving drafts to Supabase
tests/              # pytest tests
```

## How one notification flows
```
scrapers/ssc.py  → finds "CGL 2026 notice.pdf" on ssc.gov.in
extract/         → downloads PDF, reads text (OCR if scanned), fills the job format
schemas/         → validates it (wrong shape = rejected, never saved)
db/              → saves as status='draft' with field_status for missing info
Internal Portal  → reviewer checks + publishes  (not this app)
```

## Rules
- **Never invent data** — missing = `null` + `field_status` (`not_in_source` / `pending`).
- **Only drafts.** This app never publishes anything.
- **Structure changes are never made by the scraper code.** Need a new column? Add it on dev with your `harsha_dev` login and save the SQL in `database/changes/`. New tables: ask Likhith.
- The scraper runs with the `ingestion_writer` login, which can only write **drafts**.
- **Be polite to government sites:** respect robots.txt, wait `CRAWL_DELAY_SECONDS` between requests, identify with `USER_AGENT`.
- Never bypass CAPTCHAs or logins — add those notices manually instead.
- Only government / official sources. Don't scrape private job portals.
