"""Give existing opportunities the clean display title (notices extracted before groq-v2).

Run from apps/ingestion:
  .venv/Scripts/python -m scripts.backfill_titles                      # preview only
  .venv/Scripts/python -m scripts.backfill_titles --apply              # drafts
  .venv/Scripts/python -m scripts.backfill_titles --apply --published  # also live ones

Uses the notice text already saved in scraped_documents (no PDF download). The website's
title stays on scraped_documents.title, so nothing is lost. Hand-made rows (no scraped
document) are never touched.
"""

import argparse
import time

from sqlalchemy import text

from app.db import get_engine
from app.extract.extractor import ExtractionError, suggest_title

ROWS = """
SELECT DISTINCT ON (o.id) o.id, o.status, o.title, d.title AS website_title, d.extracted_text
FROM opportunities o
JOIN scraped_documents d ON d.opportunity_id = o.id AND d.extracted_text IS NOT NULL
WHERE o.status = ANY(:statuses)
ORDER BY o.id, d.fetched_at ASC  -- the original notice, not a later corrigendum/extension
"""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="write the titles")
    parser.add_argument("--published", action="store_true", help="include live listings")
    args = parser.parse_args()
    statuses = ["draft", "published", "closed"] if args.published else ["draft"]

    with get_engine().connect() as connection:
        rows = connection.execute(text(ROWS), {"statuses": statuses}).all()

    changed = 0
    for row in rows:
        time.sleep(8)  # Groq free tier: ~8k tokens/minute
        try:
            title = suggest_title(row.extracted_text, row.website_title or row.title)
        except ExtractionError as exc:
            print(f"SKIP  {row.id}  {exc}")
            continue
        if not title or title == row.title:
            print(f"KEEP  [{row.status}] {row.title}")
            continue
        changed += 1
        print(f"NEW   [{row.status}] {row.title}\n   -> {title}")
        if args.apply:
            with get_engine().begin() as connection:
                connection.execute(
                    text("UPDATE opportunities SET title = :t, updated_at = now() "
                         "WHERE id = :id AND title = :old"),
                    {"t": title, "id": row.id, "old": row.title},
                )
    print(f"\n{changed} of {len(rows)} would change" + ("" if args.apply else " (preview only)"))


if __name__ == "__main__":
    main()
