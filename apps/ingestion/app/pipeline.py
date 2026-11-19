"""Notification PDF -> draft opportunity filled from the PDF (session 05).

The PDF is read in memory and thrown away: only its text, SHA-256 and the extracted JSON are kept.
"""

from datetime import date
from typing import Any

from app.db import get_engine
from app.db.repository import (
    create_draft_for_document,
    find_extraction_by_hash,
    get_document_for_reextract,
    get_opportunity_id_for_scraped_document,
    save_extraction,
    save_scraped_document,
    scraped_document_exists,
)
from app.downloader import download_pdf
from app.extract.extractor import EXTRACTOR_VERSION, ExtractionError, extract, pdf_to_text


def read_and_extract(
    content: bytes, *, content_hash: str, title: str, url: str
) -> tuple[str | None, dict[str, Any] | None, str | None]:
    """Returns (text, extraction, error). Never raises for extraction problems: the draft
    is still created and a reviewer can fill it by hand or press Re-extract later."""
    text = None
    try:
        text = pdf_to_text(content)
        cached = find_extraction_by_hash(content_hash, EXTRACTOR_VERSION)
        return text, cached or extract(text, title, url), None
    except ExtractionError as exc:
        return text, None, str(exc)
    except Exception as exc:  # broken PDF etc. — keep the scrape run going
        return text, None, f"Could not read the PDF: {exc}"[:500]


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
    """Download, deduplicate, extract, and create (or update) a draft for a PDF."""

    downloaded = download_pdf(url)
    if scraped_document_exists(downloaded.url, downloaded.content_hash):
        return {
            "url": downloaded.url,
            "title": title,
            "content_hash": downloaded.content_hash,
            "inserted": False,
            "opportunity_id": get_opportunity_id_for_scraped_document(
                downloaded.url, downloaded.content_hash
            ),
            "status": "duplicate",
        }

    # AI call happens before the transaction so no DB locks are held while Groq answers.
    text, result, error = read_and_extract(
        downloaded.content,
        content_hash=downloaded.content_hash,
        title=title,
        url=downloaded.url,
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
            mime_type=downloaded.mime_type,
            extracted_text=text,
        )
        if document_id is None:  # a concurrent run saved the same PDF first
            return {
                "url": downloaded.url,
                "title": title,
                "content_hash": downloaded.content_hash,
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
        save_extraction(
            connection,
            document_id=str(document_id),
            opportunity_id=opportunity_id,
            extracted_text=None,  # already saved with the document
            result=result,
            error=error,
        )

    return {
        "url": downloaded.url,
        "title": title,
        "content_hash": downloaded.content_hash,
        "inserted": True,
        "opportunity_id": opportunity_id,
        "status": "draft_created" if opportunity_id else "saved",
        "extracted": result is not None,
        "confidence": result["confidence"] if result else None,
        "error": error,
    }


def reextract_opportunity(opportunity_id: str) -> dict[str, Any]:
    """Admin "Re-extract": run extraction again from the saved text.

    Drafts scraped before session 05 have no saved text, so their PDF is downloaded again
    (in memory only). The result bypasses the hash cache, since the point is a fresh read.
    """
    document = get_document_for_reextract(opportunity_id)
    if document is None:
        raise LookupError("This opportunity has no scraped notification to read")

    text = document["extracted_text"]
    content = None
    if not text:
        content = download_pdf(document["url"]).content
    try:
        text = text or pdf_to_text(content or b"")
        result, error = extract(text, document["title"], document["url"]), None
    except ExtractionError as exc:
        result, error = None, str(exc)

    with get_engine().begin() as connection:
        save_extraction(
            connection,
            document_id=str(document["id"]),
            opportunity_id=opportunity_id,
            extracted_text=text,
            result=result,
            error=error,
        )
    return {
        "opportunity_id": opportunity_id,
        "extracted": result is not None,
        "confidence": result["confidence"] if result else None,
        "error": error,
    }
