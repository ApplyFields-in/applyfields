
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
        SELECT id, key, name, organization_id, list_url, kind, interval_hours, config
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
    extracted_text: str | None = None,
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
            content_hash, storage_path, mime_type, extracted_text
        )
        VALUES (
            CAST(:source_id AS uuid), CAST(:run_id AS uuid),
            :url, :title, :published_on, :content_hash,
            :storage_path, :mime_type, :extracted_text
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
            "extracted_text": extracted_text,
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
def get_opportunity_id_for_scraped_document(
    url: str,
    content_hash: str,
) -> str | None:
    """Return the linked opportunity ID for an existing scraped PDF."""
    query = text(
        """
        SELECT opportunity_id
        FROM scraped_documents
        WHERE url = :url
          AND content_hash = :content_hash
        LIMIT 1
        """
    )

    with get_engine().connect() as connection:
        opportunity_id = connection.execute(
            query,
            {
                "url": url,
                "content_hash": content_hash,
            },
        ).scalar_one_or_none()

    return str(opportunity_id) if opportunity_id is not None else None
def update_opportunity_related_links(
    *,
    opportunity_id: str,
    related_links: list[dict[str, str]],
) -> None:
    """Save official supporting-document links on an opportunity."""
    import json

    query = text(
        """
        UPDATE opportunities
        SET related_links = CAST(:related_links AS jsonb),
            updated_at = now()
        WHERE id = CAST(:opportunity_id AS uuid)
        RETURNING id
        """
    )

    with get_engine().begin() as connection:
        updated_id = connection.execute(
            query,
            {
                "opportunity_id": opportunity_id,
                "related_links": json.dumps(related_links),
            },
        ).scalar_one_or_none()

        if updated_id is None:
            raise ValueError(
                f"Opportunity not found: {opportunity_id}"
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


# ---------- Session 05: extraction (PDF text -> job JSON) ----------


def find_extraction_by_hash(content_hash: str, extractor_version: str) -> dict[str, Any] | None:
    """Cost guard: reuse an earlier extraction of the exact same PDF (same SHA-256)."""
    query = text(
        """
        SELECT extraction
        FROM scraped_documents
        WHERE content_hash = :content_hash
          AND extraction ->> 'extractor_version' = :extractor_version
        ORDER BY fetched_at DESC
        LIMIT 1
        """
    )
    with get_engine().connect() as connection:
        row = connection.execute(
            query, {"content_hash": content_hash, "extractor_version": extractor_version}
        ).scalar_one_or_none()
    return row if isinstance(row, dict) else None


def get_document_for_reextract(opportunity_id: str) -> dict[str, Any] | None:
    """The newest scraped document of an opportunity (its saved text is NULL for old rows)."""
    query = text(
        """
        SELECT d.id, d.url, d.content_hash, d.extracted_text, o.title
        FROM scraped_documents d
        JOIN opportunities o ON o.id = d.opportunity_id
        WHERE d.opportunity_id = CAST(:opportunity_id AS uuid)
        ORDER BY d.fetched_at DESC
        LIMIT 1
        """
    )
    with get_engine().connect() as connection:
        row = connection.execute(query, {"opportunity_id": opportunity_id}).mappings().first()
    return dict(row) if row else None


def save_extraction(
    connection: Connection,
    *,
    document_id: str,
    opportunity_id: str | None,
    extracted_text: str | None,
    result: dict[str, Any] | None,
    error: str | None,
) -> None:
    """Store the extraction on the scraped document and fill the draft it belongs to.

    - Draft opportunities get the extracted fields (never erasing what a reviewer typed).
    - Published/closed ones are not touched: the changes go on the pending version for review.
    """
    from app.extract.extractor import diff_fields, to_json

    previous = None
    if opportunity_id:
        previous = connection.execute(
            text(
                """
                SELECT extraction FROM scraped_documents
                WHERE opportunity_id = CAST(:opportunity_id AS uuid)
                  AND id <> CAST(:document_id AS uuid)
                  AND extraction IS NOT NULL
                ORDER BY fetched_at DESC
                LIMIT 1
                """
            ),
            {"opportunity_id": opportunity_id, "document_id": document_id},
        ).scalar_one_or_none()

    connection.execute(
        text(
            """
            UPDATE scraped_documents
            SET extracted_text = COALESCE(:extracted_text, extracted_text),
                extraction = COALESCE(CAST(:extraction AS jsonb), extraction),
                confidence = COALESCE(:confidence, confidence),
                error = :error,
                updated_at = now()
            WHERE id = CAST(:document_id AS uuid)
            """
        ),
        {
            "document_id": document_id,
            "extracted_text": extracted_text,
            "extraction": to_json(result) if result else None,
            "confidence": result["confidence"] if result else None,
            "error": error,
        },
    )
    if not result or not opportunity_id:
        return

    fields = result["fields"]
    status_value = connection.execute(
        text("SELECT status FROM opportunities WHERE id = CAST(:id AS uuid) FOR UPDATE"),
        {"id": opportunity_id},
    ).scalar_one_or_none()

    if isinstance(previous, dict) and previous.get("fields"):
        changed, note = diff_fields(previous["fields"], to_plain(fields))
        if changed:
            connection.execute(
                text(
                    """
                    UPDATE opportunity_versions
                    SET changed_fields = CAST(:changed AS text[]),
                        change_note = :note,
                        snapshot = snapshot
                          || jsonb_build_object('extracted', CAST(:fields AS jsonb))
                    WHERE opportunity_id = CAST(:opportunity_id AS uuid)
                      AND scraped_document_id = CAST(:document_id AS uuid)
                    """
                ),
                {
                    "changed": changed,
                    "note": note,
                    "fields": to_json(fields),
                    "opportunity_id": opportunity_id,
                    "document_id": document_id,
                },
            )

    if status_value == "draft":
        _fill_draft(connection, opportunity_id, result)


def to_plain(value: Any) -> Any:
    """Dates -> ISO strings, so a fresh extraction compares equal to one read back from jsonb."""
    import json

    from app.extract.extractor import to_json

    return json.loads(to_json(value))


def _fill_draft(connection: Connection, opportunity_id: str, result: dict[str, Any]) -> None:
    """Write extracted fields into a draft. Empty extracted values never overwrite existing ones."""
    import json

    from app.extract.extractor import to_json

    f = result["fields"]
    by_kind = {d["kind"]: d["date"] for d in f["dates"]}
    status = result["field_status"]
    available = {k: v for k, v in status.items() if v == "available"}
    missing = {k: v for k, v in status.items() if v != "available"}

    connection.execute(
        text(
            """
            UPDATE opportunities SET
              notification_number = COALESCE(:notification_number, notification_number),
              summary = COALESCE(:summary, summary),
              vacancies_total = COALESCE(:vacancies_total, vacancies_total),
              fees = CASE WHEN :has_fees THEN CAST(:fees AS jsonb) ELSE fees END,
              fee_text = COALESCE(:fee_text, fee_text),
              payment_modes = CASE WHEN :has_modes
                              THEN CAST(:payment_modes AS text[]) ELSE payment_modes END,
              selection_process = CASE WHEN :has_selection
                                  THEN CAST(:selection AS text[]) ELSE selection_process END,
              required_documents = CASE WHEN :has_docs THEN CAST(:documents AS jsonb)
                                   ELSE required_documents END,
              apply_url = COALESCE(:apply_url, apply_url),
              official_website = COALESCE(:official_website, official_website),
              state_codes = COALESCE(CAST(:state_codes AS text[]), state_codes),
              application_start = COALESCE(:application_start, application_start),
              application_end = COALESCE(:application_end, application_end),
              field_status = CAST(:missing AS jsonb) || field_status || CAST(:available AS jsonb),
              ai_model = :ai_model,
              extractor_version = :extractor_version,
              confidence = :confidence,
              updated_at = now()
            WHERE id = CAST(:id AS uuid)
            """
        ),
        {
            "id": opportunity_id,
            "notification_number": f["notification_number"],
            "summary": f["summary"],
            "vacancies_total": f["vacancies_total"],
            "has_fees": bool(f["fees"]),
            "fees": json.dumps(f["fees"]),
            "fee_text": f["fee_text"],
            "has_modes": bool(f["payment_modes"]),
            "payment_modes": f["payment_modes"],
            "has_selection": bool(f["selection_process"]),
            "selection": f["selection_process"],
            "has_docs": bool(f["required_documents"]),
            "documents": json.dumps(f["required_documents"]),
            "apply_url": f["apply_url"],
            "official_website": f["official_website"],
            "state_codes": f["state_codes"],
            "application_start": by_kind.get("application_start"),
            "application_end": by_kind.get("application_end"),
            "missing": json.dumps(missing),
            "available": json.dumps(available),
            "ai_model": result.get("ai_model"),
            "extractor_version": result.get("extractor_version"),
            "confidence": result["confidence"],
        },
    )

    if f["posts"]:
        connection.execute(
            text("DELETE FROM opportunity_posts WHERE opportunity_id = CAST(:id AS uuid)"),
            {"id": opportunity_id},
        )
        for order, post in enumerate(f["posts"]):
            connection.execute(
                text(
                    """
                    INSERT INTO opportunity_posts (
                      opportunity_id, name, vacancies_total, vacancies_by_category,
                      pay_level, salary_min, salary_max, salary_text, sort_order)
                    VALUES (CAST(:id AS uuid), :name, :vacancies_total, CAST(:by_cat AS jsonb),
                      :pay_level, :salary_min, :salary_max, :salary_text, :sort_order)
                    """
                ),
                {
                    **post,
                    "id": opportunity_id,
                    "by_cat": to_json(post["vacancies_by_category"])
                    if post["vacancies_by_category"] else None,
                    "sort_order": order,
                },
            )

    elig = f["eligibility"]
    if elig:
        connection.execute(
            text(
                """
                DELETE FROM opportunity_eligibility
                WHERE opportunity_id = CAST(:id AS uuid) AND post_id IS NULL
                """
            ),
            {"id": opportunity_id},
        )
        connection.execute(
            text(
                """
                INSERT INTO opportunity_eligibility (
                  opportunity_id, age_min, age_max, age_as_on_date, age_relaxations,
                  qualification_level, qualification_streams, min_percentage,
                  final_year_allowed, gender, domicile_states, categories_allowed,
                  other_conditions, official_text)
                VALUES (CAST(:id AS uuid), :age_min, :age_max, :age_as_on_date,
                  CAST(:relaxations AS jsonb), :qualification_level,
                  CAST(:qualification_streams AS text[]), :min_percentage, :final_year_allowed,
                  CAST(:gender AS gender_rule), CAST(:domicile_states AS text[]),
                  CAST(:categories_allowed AS text[]), CAST(:other_conditions AS text[]),
                  :official_text)
                """
            ),
            {**elig, "id": opportunity_id, "relaxations": to_json(elig["age_relaxations"])},
        )

    if f["dates"]:
        connection.execute(
            text("DELETE FROM opportunity_dates WHERE opportunity_id = CAST(:id AS uuid)"),
            {"id": opportunity_id},
        )
        for d in f["dates"]:
            connection.execute(
                text(
                    """
                    INSERT INTO opportunity_dates (
                      opportunity_id, kind, date, end_date, is_tentative, note)
                    VALUES (CAST(:id AS uuid), CAST(:kind AS date_kind), :date, :end_date,
                      :is_tentative, :note)
                    """
                ),
                {**d, "id": opportunity_id},
            )
