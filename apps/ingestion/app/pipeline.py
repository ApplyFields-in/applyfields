
"""Process notification PDFs and create draft opportunities."""

from datetime import date
from typing import Any

from app.db import get_engine
from app.db.repository import (
    create_draft_for_document,
    save_scraped_document,
    scraped_document_exists,
)
from app.downloader import download_pdf
from app.storage import upload_pdf


def process_pdf_notice(
    *,
    source_id: str,
    run_id: str,
    source_key: str,
    organization_id: str,
    category: str,
    url: str,
    title: str,
    published_on: date | None = None,
) -> dict[str, Any]:
    """Download, deduplicate, upload, and create a draft for a PDF."""

    downloaded = download_pdf(url)

    if scraped_document_exists(downloaded.url, downloaded.content_hash):
        return {
            "url": downloaded.url,
            "title": title,
            "content_hash": downloaded.content_hash,
            "storage_path": None,
            "inserted": False,
            "opportunity_id": None,
            "status": "duplicate",
        }

    storage_path = upload_pdf(
        source_key=source_key,
        content_hash=downloaded.content_hash,
        content=downloaded.content,
        mime_type=downloaded.mime_type,
    )

    with get_engine().begin() as connection:
        document_id = save_scraped_document(
            connection,
            source_id=source_id,
            run_id=run_id,
            url=downloaded.url,
            title=title,
            published_on=published_on,
            content_hash=downloaded.content_hash,
            storage_path=storage_path,
            mime_type=downloaded.mime_type,
        )

        if document_id is None:
            return {
                "url": downloaded.url,
                "title": title,
                "content_hash": downloaded.content_hash,
                "storage_path": storage_path,
                "inserted": False,
                "opportunity_id": None,
                "status": "duplicate",
            }

        opportunity_id = create_draft_for_document(
            connection,
            document_id=str(document_id),
            source_key=source_key,
            source_url=downloaded.url,
            content_hash=downloaded.content_hash,
            title=title,
            organization_id=organization_id,
            category=category,
        )

    return {
        "url": downloaded.url,
        "title": title,
        "content_hash": downloaded.content_hash,
        "storage_path": storage_path,
        "inserted": True,
        "opportunity_id": opportunity_id,
        "status": "draft_created" if opportunity_id else "saved",
    }
