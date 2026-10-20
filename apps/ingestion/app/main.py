
"""
ApplyFields ingestion service (INTERNAL ONLY).

Run locally:
    uv run uvicorn app.main:app --reload --port 8000
"""

import secrets
from urllib.parse import urlsplit

from fastapi import Depends, FastAPI, Header, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.db.repository import (
    finish_scrape_run,
    get_active_source,
    start_scrape_run,
)
from app.fetcher import fetch
from app.pipeline import process_pdf_notice
from app.scrapers.ssc import SSCScraper

app = FastAPI(title="ApplyFields Ingestion (internal)", version="0.1.0")

# Only sources with implemented scrapers belong here.
SCRAPERS = {
    "ssc": SSCScraper,
}


def require_internal_token(
    x_internal_token: str | None = Header(default=None),
) -> None:
    """Reject requests without the configured internal service token."""
    expected = settings.internal_service_token

    if (
        not expected
        or not x_internal_token
        or not secrets.compare_digest(x_internal_token, expected)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal token",
        )


@app.get("/health")
def health() -> dict[str, str]:
    """Basic service health check."""
    return {"status": "ok"}


@app.post(
    "/scrape/{source_key}",
    dependencies=[Depends(require_internal_token)],
)
def run_scraper(source_key: str) -> dict[str, object]:
    """Run one registered scraper and save discovered PDFs as drafts."""

    scraper_class = SCRAPERS.get(source_key)

    if scraper_class is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown scraper source: {source_key}",
        )

    # Load the source from the existing database registry.
    try:
        source = get_active_source(source_key)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not load scraper source from the database",
        ) from exc

    if source is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source '{source_key}' is not registered or inactive",
        )

    # Validate required source configuration before creating a run.
    if not source.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Source '{source_key}' has no organization mapping",
        )

    if not source.get("list_url"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Source '{source_key}' has no listing URL",
        )

    scraper = scraper_class()
    scraper.list_url = source["list_url"]

    try:
        run_id = start_scrape_run(str(source["id"]))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not start scrape run",
        ) from exc

    items_found = 0
    new_items = 0
    duplicates = 0
    failed_items = 0
    skipped_non_pdf = 0
    results: list[dict[str, object]] = []

    try:

        if source_key == "ssc":
            notices = scraper.discover_notices()
        else:
            response = fetch(scraper.list_url)
            notices = scraper.find_notices(response.text)
        items_found = len(notices)

        for notice in notices:
            # This initial version processes direct PDF links only.
            path = urlsplit(notice.url).path.lower()

            if not path.endswith(".pdf"):
                skipped_non_pdf += 1
                results.append(
                    {
                        "title": notice.title,
                        "url": notice.url,
                        "status": "skipped_non_pdf",
                    }
                )
                continue

            try:
                result = process_pdf_notice(
                    source_id=str(source["id"]),
                    run_id=run_id,
                    source_key=source_key,
                    organization_id=str(source["organization_id"]),
                    category=(
                        "railways"
                        if source_key == "rrb"
                        else "central_govt"
                    ),
                    url=notice.url,
                    title=notice.title,
                    published_on=notice.published_on,
                )

                results.append(result)

                if result.get("inserted"):
                    new_items += 1
                elif result.get("status") == "duplicate":
                    duplicates += 1

            except Exception as exc:
                failed_items += 1
                results.append(
                    {
                        "title": notice.title,
                        "url": notice.url,
                        "status": "failed",
                        "error": str(exc)[:500],
                    }
                )

        # Non-PDF links are intentionally skipped in this version.
        run_status = "partial" if failed_items else "success"

        finish_scrape_run(
            str(source["id"]),
            run_id,
            status_value=run_status,
            items_found=items_found,
            new_items=new_items,
            error=(
                f"{failed_items} notice(s) failed"
                if failed_items
                else None
            ),
        )

        return {
            "source_key": source_key,
            "run_id": run_id,
            "status": run_status,
            "items_found": items_found,
            "new_items": new_items,
            "duplicates": duplicates,
            "failed_items": failed_items,
            "skipped_non_pdf": skipped_non_pdf,
            "notices": results,
        }

    except Exception as exc:
        # Record an unsuccessful run if the overall fetch or processing fails.
        try:
            finish_scrape_run(
                str(source["id"]),
                run_id,
                status_value="failed",
                items_found=items_found,
                new_items=new_items,
                error=str(exc)[:2000],
            )
        except SQLAlchemyError:
            # Preserve the original failure if logging the run also fails.
            pass

        if isinstance(exc, PermissionError):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(exc),
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Scraping source '{source_key}' failed",
        ) from exc
