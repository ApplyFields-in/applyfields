from unittest.mock import MagicMock, patch

from app.downloader import DownloadedPDF
from app.extract.extractor import ExtractionError
from app.pipeline import process_pdf_notice

PDF = DownloadedPDF(
    url="https://example.com/notice.pdf",
    content=b"%PDF-1.4 test",
    content_hash="a" * 64,
    mime_type="application/pdf",
)
RESULT = {"fields": {}, "field_status": {}, "confidence": 0.9}


def _run(**patches):
    connection = MagicMock()
    engine = MagicMock()
    engine.begin.return_value.__enter__.return_value = connection
    defaults = {
        "download_pdf": MagicMock(return_value=PDF),
        "scraped_document_exists": MagicMock(return_value=False),
        "pdf_to_text": MagicMock(return_value="notice text"),
        "find_extraction_by_hash": MagicMock(return_value=None),
        "extract": MagicMock(return_value=RESULT),
        "get_engine": MagicMock(return_value=engine),
        "save_scraped_document": MagicMock(return_value="document-test-id"),
        "create_draft_for_document": MagicMock(return_value="opportunity-test-id"),
        "save_extraction": MagicMock(),
    }
    mocks = {**defaults, **patches}
    with patch.multiple("app.pipeline", **mocks):
        result = process_pdf_notice(
            source_id="source-test",
            run_id="run-test",
            source_key="ssc",
            organization_id="org-test",
            category="central_govt",
            url="https://example.com/notice.pdf",
            title="Test Notification",
        )
    return result, mocks, connection


def test_new_pdf_is_extracted_and_never_stored() -> None:
    result, m, connection = _run()

    assert result["status"] == "draft_created"
    assert result["extracted"] is True
    assert result["confidence"] == 0.9
    assert "storage_path" not in result

    saved = m["save_scraped_document"].call_args.kwargs
    assert saved["extracted_text"] == "notice text"
    assert "storage_path" not in saved  # the PDF itself is not kept

    m["extract"].assert_called_once_with(
        "notice text", "Test Notification", "https://example.com/notice.pdf"
    )
    m["save_extraction"].assert_called_once_with(
        connection,
        document_id="document-test-id",
        opportunity_id="opportunity-test-id",
        extracted_text=None,
        result=RESULT,
        error=None,
    )


def test_same_pdf_hash_reuses_cached_extraction() -> None:
    cached = {**RESULT, "confidence": 0.7}
    result, m, _ = _run(find_extraction_by_hash=MagicMock(return_value=cached))
    m["extract"].assert_not_called()  # no second Groq call for the same PDF
    assert result["confidence"] == 0.7


def test_scanned_pdf_still_creates_a_manual_draft() -> None:
    result, m, connection = _run(
        pdf_to_text=MagicMock(side_effect=ExtractionError("Scanned PDF (no text layer)"))
    )
    assert result["status"] == "draft_created"
    assert result["extracted"] is False
    assert "Scanned PDF" in result["error"]
    m["extract"].assert_not_called()
    assert m["save_extraction"].call_args.kwargs["result"] is None


def test_duplicate_pdf_skips_extraction() -> None:
    result, m, _ = _run(
        scraped_document_exists=MagicMock(return_value=True),
        get_opportunity_id_for_scraped_document=MagicMock(return_value="opportunity-existing-id"),
    )
    assert result["status"] == "duplicate"
    assert result["opportunity_id"] == "opportunity-existing-id"
    m["pdf_to_text"].assert_not_called()
    m["extract"].assert_not_called()
    m["save_scraped_document"].assert_not_called()
