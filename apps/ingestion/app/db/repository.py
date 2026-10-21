
"""Database operations for scraper runs and discovered notification documents."""

from datetime import date
from typing import Any

from sqlalchemy import text
from sqlalchemy.engine import Connection

from app.db import get_engine


def get_active_source(source_key: str) -> dict[str, Any] | None:
    """Return an active scraper source by its registered key."""
    query = text(
        """
        SELECT id, key, name, organization_id, list_url, kind, interval_hours
        FROM scrape_sources
        WHERE key = :source_key AND is_active = TRUE
        """
    )

    with get_engine().connect() as connection:
        row = connection.execute(query, {"source_key": source_key}).mappings().first()
        return dict(row) if row else None


def start_scrape_run(source_id: str) -> str:
    """Create a run record and return its UUID."""
    query = text(
        """
        INSERT INTO scrape_runs (source_id, status)
        VALUES (CAST(:source_id AS uuid), 'running')
        RETURNING id
        """
    )

    with get_engine().begin() as connection:
        return str(connection.execute(query, {"source_id": source_id}).scalar_one())


def finish_scrape_run(
    source_id: str,
    run_id: str,
    *,
    status_value: str,
    items_found: int,
    new_items: int,
    error: str | None = None,
) -> None:
    """Finish a run and update source health counters."""
    run_query = text(
        """
        UPDATE scrape_runs
        SET status = :run_status,
            finished_at = now(),
            items_found = :items_found,
            new_items = :new_items,
            error = :error
        WHERE id = CAST(:run_id AS uuid)
        """
    )

    source_query = text(
        """
        UPDATE scrape_sources
        SET last_run_at = now(),
            last_success_at = CASE
                WHEN :successful THEN now()
                ELSE last_success_at
            END,
            consecutive_failures = CASE
                WHEN :successful THEN 0
                ELSE consecutive_failures + 1
            END
        WHERE id = CAST(:source_id AS uuid)
        """
    )

    successful = status_value == "success"

    with get_engine().begin() as connection:
        connection.execute(
            run_query,
            {
                "run_id": run_id,
                "run_status": status_value,
                "items_found": items_found,
                "new_items": new_items,
                "error": error,
            },
        )
        connection.execute(
            source_query,
            {"source_id": source_id, "successful": successful},
        )


def save_scraped_document(
    connection: Connection,
    *,
    source_id: str,
    run_id: str,
    url: str,
    title: str,
    published_on: date | None,
    content_hash: str,
    storage_path: str | None = None,
    mime_type: str | None = None,
) -> str | None:
    """
    Save a downloaded notice if this URL and content hash are new.

    Returns True if inserted, False if the exact URL/hash already exists.
    The caller must pass a SHA-256 hash of the downloaded file.
    """
    query = text(
        """
        INSERT INTO scraped_documents (
            source_id, run_id, url, title, published_on,
            content_hash, storage_path, mime_type
        )
        VALUES (
            CAST(:source_id AS uuid), CAST(:run_id AS uuid),
            :url, :title, :published_on, :content_hash,
            :storage_path, :mime_type
        )
        ON CONFLICT (url, content_hash) DO NOTHING
        RETURNING id
        """
    )

    result = connection.execute(
        query,
        {
            "source_id": source_id,
            "run_id": run_id,
            "url": url,
            "title": title,
            "published_on": published_on,
            "content_hash": content_hash,
            "storage_path": storage_path,
            "mime_type": mime_type,
        },
    )

    return result.scalar_one_or_none()

def scraped_document_exists(url: str, content_hash: str) -> bool:
    """Check whether this exact URL and PDF content hash already exist."""
    query = text(
        """
        SELECT EXISTS (
            SELECT 1
            FROM scraped_documents
            WHERE url = :url AND content_hash = :content_hash
        )
        """
    )

    with get_engine().connect() as connection:
        return bool(
            connection.execute(
                query,
                {"url": url, "content_hash": content_hash},
            ).scalar_one()
        )

def create_draft_for_document(
    connection: Connection,
    *,
    document_id: str,
    source_key: str,
    source_url: str,
    content_hash: str,
    title: str,
    organization_id: str,
    category: str,
    opportunity_type: str = "govt_job",
) -> str | None:
    """Create a draft and its first version for a newly scraped document.

    Returns the opportunity UUID, or None if the document already has a draft.
    The caller must run this inside a database transaction.
    """
    import hashlib
    import json

    # Lock the document so concurrent workers don't create duplicate drafts.
    document = connection.execute(
        text(
            """
            SELECT id, opportunity_id
            FROM scraped_documents
            WHERE id = CAST(:document_id AS uuid)
            FOR UPDATE
            """
        ),
        {"document_id": document_id},
    ).mappings().one_or_none()

    if document is None:
        raise ValueError(f"Scraped document not found: {document_id}")

    if document["opportunity_id"] is not None:
        return str(document["opportunity_id"])

    # Also guard against an opportunity already created for this source URL.
    existing = connection.execute(
        text(
            """
            SELECT id
            FROM opportunities
            WHERE source_key = :source_key
              AND source_url = :source_url
            ORDER BY created_at
            LIMIT 1
            FOR UPDATE
            """
        ),
        {"source_key": source_key, "source_url": source_url},
    ).scalar_one_or_none()


    if existing is not None:
        existing = str(existing)

        # Find the latest version and its content hash.
        latest_version = connection.execute(
            text(
                """
                SELECT version_no, snapshot
                FROM opportunity_versions
                WHERE opportunity_id = CAST(:opportunity_id AS uuid)
                ORDER BY version_no DESC
                LIMIT 1
                FOR UPDATE
                """
            ),
            {"opportunity_id": existing},
        ).mappings().one_or_none()

        if latest_version is not None:
            latest_snapshot = latest_version["snapshot"] or {}
            if isinstance(latest_snapshot, str):
                latest_snapshot = json.loads(latest_snapshot)

            previous_hash = latest_snapshot.get("source_content_hash")

            if previous_hash != content_hash:
                version_no = int(latest_version["version_no"]) + 1
                snapshot = {
                    "title": title,
                    "type": opportunity_type,
                    "category": category,
                    "organization_id": organization_id,
                    "status": "draft",
                    "source_key": source_key,
                    "source_url": source_url,
                    "source_content_hash": content_hash,
                    "extractor_version": "scraper-v1",
                }

                connection.execute(
                    text(
                        """
                        INSERT INTO opportunity_versions (
                            opportunity_id, version_no, status, snapshot,
                            changed_fields, change_note, scraped_document_id
                        )
                        VALUES (
                            CAST(:opportunity_id AS uuid), :version_no,
                            'pending', CAST(:snapshot AS jsonb),
                            ARRAY['title', 'source_content_hash']::text[],
                            'A changed official PDF was discovered; review required',
                            CAST(:document_id AS uuid)
                        )
                        ON CONFLICT (opportunity_id, version_no) DO NOTHING
                        """
                    ),
                    {
                        "opportunity_id": existing,
                        "version_no": version_no,
                        "snapshot": json.dumps(snapshot),
                        "document_id": document_id,
                    },
                )

                # Keep the current opportunity unpublished; update its source hash.
                connection.execute(
                    text(
                        """
                        UPDATE opportunities
                        SET source_content_hash = :content_hash,
                            source_fetched_at = now()
                        WHERE id = CAST(:opportunity_id AS uuid)
                        """
                    ),
                    {
                        "content_hash": content_hash,
                        "opportunity_id": existing,
                    },
                )
        else:

            snapshot = {
                "title": title,
                "type": opportunity_type,
                "category": category,
                "organization_id": organization_id,
                "status": "draft",
                "source_key": source_key,
                "source_url": source_url,
                "source_content_hash": content_hash,
                "extractor_version": "scraper-v1",
            }

            connection.execute(
                text(
                    """
                    INSERT INTO opportunity_versions (
                        opportunity_id, version_no, status, snapshot,
                        changed_fields, change_note, scraped_document_id
                    )
                    VALUES (
                        CAST(:opportunity_id AS uuid), 1, 'pending',
                        CAST(:snapshot AS jsonb),
                        ARRAY['title', 'source_content_hash']::text[],
                        'Initial version created for an existing opportunity',
                        CAST(:document_id AS uuid)
                    )
                    """
                ),
                {
                    "opportunity_id": existing,
                    "snapshot": json.dumps(snapshot),
                    "document_id": document_id,
                },
            )


        connection.execute(
            text(
                """
                UPDATE scraped_documents
                SET opportunity_id = CAST(:opportunity_id AS uuid),
                    status = 'linked'
                WHERE id = CAST(:document_id AS uuid)
                """
            ),
            {
                "opportunity_id": existing,
                "document_id": document_id,
            },
        )
        return existing


    slug_suffix = hashlib.sha256(
        f"{source_key}:{source_url}".encode()
    ).hexdigest()[:16]
    slug = f"{source_key}-{slug_suffix}"

    snapshot = {
        "title": title,
        "type": opportunity_type,
        "category": category,
        "organization_id": organization_id,
        "status": "draft",
        "source_key": source_key,
        "source_url": source_url,
        "source_content_hash": content_hash,
        "extractor_version": "scraper-v1",
    }

    opportunity_id = connection.execute(
        text(
            """
            INSERT INTO opportunities (
                slug, type, category, title, organization_id,
                status, source_key, source_url, source_content_hash,
                source_fetched_at, extractor_version,
                notification_pdf_url, official_page_url
            )
            VALUES (
                :slug, :opportunity_type,
                :category, :title, CAST(:organization_id AS uuid),
                'draft', :source_key, :source_url, :content_hash,
                now(), 'scraper-v1', :source_url, :source_url
            )
            ON CONFLICT (slug) DO NOTHING
            RETURNING id
            """
        ),
        {
            "slug": slug,
            "opportunity_type": opportunity_type,
            "category": category,
            "title": title,
            "organization_id": organization_id,
            "source_key": source_key,
            "source_url": source_url,
            "content_hash": content_hash,
        },
    ).scalar_one_or_none()

    if opportunity_id is None:
        # A concurrent transaction may have created the same slug.
        opportunity_id = connection.execute(
            text("SELECT id FROM opportunities WHERE slug = :slug"),
            {"slug": slug},
        ).scalar_one()

    opportunity_id = str(opportunity_id)

    connection.execute(
        text(
            """
            INSERT INTO opportunity_versions (
                opportunity_id, version_no, status, snapshot,
                changed_fields, change_note, scraped_document_id
            )
            VALUES (
                CAST(:opportunity_id AS uuid), 1, 'pending',
                CAST(:snapshot AS jsonb),
                ARRAY['title', 'type', 'category']::text[],
                'Automatically created from an official scraped document',
                CAST(:document_id AS uuid)
            )
            ON CONFLICT (opportunity_id, version_no) DO NOTHING
            """
        ),
        {
            "opportunity_id": opportunity_id,
            "snapshot": json.dumps(snapshot),
            "document_id": document_id,
        },
    )

    connection.execute(
        text(
            """
            UPDATE scraped_documents
            SET opportunity_id = CAST(:opportunity_id AS uuid),
                status = 'linked'
            WHERE id = CAST(:document_id AS uuid)
            """
        ),
        {
            "opportunity_id": opportunity_id,
            "document_id": document_id,
        },
    )

    return opportunity_id
