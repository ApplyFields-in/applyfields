
"""
ApplyFields ingestion service (INTERNAL ONLY).

Run locally:
    uv run uvicorn app.main:app --reload --port 8000
"""

import datetime as dt
import secrets

from fastapi import Depends, FastAPI, Header, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.db.repository import (
    finish_scrape_run,
    get_active_source,
    start_scrape_run,
    update_opportunity_related_links,
)
from app.fetcher import fetch
from app.pipeline import process_pdf_notice
from app.scrapers.appsc import AppscScraper
from app.scrapers.cdsco import CDSCOScraper
from app.scrapers.indiapost import IndiaPostScraper
from app.scrapers.isro import (
    IsroScraper,
    RecruitmentPdfBundle,
    group_related_pdf_links,
)
from app.scrapers.npcil import NPCILScraper
from app.scrapers.ssc import SSCScraper
from app.scrapers.upsc import UPSCScraper

app = FastAPI(title="ApplyFields Ingestion (internal)", version="0.1.0")

# Only sources with implemented scrapers belong here.
SCRAPERS = {
    "ssc": SSCScraper,
    "appsc": AppscScraper,
    "upsc": UPSCScraper,
    "isro": IsroScraper,
    "indiapost": IndiaPostScraper,
    "npcil": NPCILScraper,
    "cdsco": CDSCOScraper,
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
    isro_bundles_by_pdf_url: dict[str, RecruitmentPdfBundle] = {}

    try:


        if source_key == "ssc":
            notices = scraper.discover_notices()
        elif source_key == "isro":
            response = fetch(scraper.list_url)
            detail_notices = scraper.find_notices(response.text)

            notices = []
            seen_pdf_urls: set[str] = set()

            for detail in detail_notices:
                detail_response = fetch(detail.url)

                pdf_notices = scraper.find_pdf_notices(
                    detail_response.text,
                    detail_url=detail.url,
                    title=detail.title,
                    published_on=detail.published_on,
                )

                unique_pdf_notices = []

                for pdf_notice in pdf_notices:
                    normalized_url = pdf_notice.url.split("#", 1)[0]

                    if normalized_url in seen_pdf_urls:
                        continue

                    seen_pdf_urls.add(normalized_url)
                    unique_pdf_notices.append(pdf_notice)

                bundle = group_related_pdf_links(
                    detail,
                    unique_pdf_notices,
                )

                # Only the main advertisement can create a draft opportunity.
                if bundle.notification_pdf is None:
                    continue

                main_notice = bundle.notification_pdf
                notices.append(main_notice)
                isro_bundles_by_pdf_url[main_notice.url] = bundle


        else:
            response = fetch(scraper.list_url)
            notices = scraper.find_notices(response.text)

        items_found = len(notices)

        documents = []
        for notice in notices:
            if scraper.is_document_url(notice.url):
                documents.append(notice)
            else:
                skipped_non_pdf += 1
                results.append(
                    {"title": notice.title, "url": notice.url, "status": "skipped_non_pdf"}
                )

        # ponytail: newest-first cap; a source that posts more than N notices between two runs loses
        # the oldest ones (raise MAX_NOTICES_PER_RUN or run more often if that ever happens).
        documents.sort(key=lambda n: n.published_on or dt.date.min, reverse=True)
        deferred = max(0, len(documents) - settings.max_notices_per_run)
        documents = documents[: settings.max_notices_per_run]

        for notice in documents:
            bundle = isro_bundles_by_pdf_url.get(notice.url)
            notice_title = (
                bundle.recruitment_title
                if bundle is not None
                else notice.title
            )
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
                    url=scraper.resolve_document_url(notice.url),
                    title=notice_title,
                    published_on=notice.published_on,
                )
                if (
                    bundle is not None
                    and bundle.related_links
                    and result.get("opportunity_id")
                ):
                    update_opportunity_related_links(
                        opportunity_id=str(result["opportunity_id"]),
                        related_links=[
                            {
                                "title": link.title,
                                "url": link.url,
                                "category": link.category,
                            }
                            for link in bundle.related_links
                        ],
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
            "deferred": deferred,
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

