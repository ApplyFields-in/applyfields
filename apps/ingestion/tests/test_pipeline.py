
from unittest.mock import MagicMock, patch

from app.downloader import DownloadedPDF
from app.pipeline import process_pdf_notice


def test_process_pdf_notice_uploads_and_saves_metadata() -> None:
    pdf = DownloadedPDF(
        url="https://example.com/notice.pdf",
        content=b"%PDF-1.4 test",
        content_hash="a" * 64,
        mime_type="application/pdf",
    )

    connection = MagicMock()
    engine = MagicMock()
    engine.begin.return_value.__enter__.return_value = connection

    with (
        patch("app.pipeline.download_pdf", return_value=pdf),
        patch("app.pipeline.scraped_document_exists", return_value=False),
        patch(
            "app.pipeline.upload_pdf",
            return_value=f"ssc/{'a' * 64}.pdf",
        ) as upload,
        patch("app.pipeline.get_engine", return_value=engine),
        patch(
            "app.pipeline.save_scraped_document",
            return_value="document-test-id",
        ) as save,
        patch(
            "app.pipeline.create_draft_for_document",
            return_value="opportunity-test-id",
        ) as create_draft,
    ):
        result = process_pdf_notice(
            source_id="source-test",
            run_id="run-test",
            source_key="ssc",
            organization_id="org-test",
            category="central_govt",
            url="https://example.com/notice.pdf",
            title="Test Notification",
        )

    assert result["status"] == "draft_created"
    assert result["inserted"] is True
    assert result["content_hash"] == "a" * 64
    assert result["storage_path"] == f"ssc/{'a' * 64}.pdf"
    assert result["opportunity_id"] == "opportunity-test-id"

    upload.assert_called_once_with(
        source_key="ssc",
        content_hash="a" * 64,
        content=b"%PDF-1.4 test",
        mime_type="application/pdf",
    )

    saved_metadata = save.call_args.kwargs
    assert saved_metadata["title"] == "Test Notification"
    assert saved_metadata["content_hash"] == "a" * 64
    assert saved_metadata["storage_path"] == f"ssc/{'a' * 64}.pdf"

    create_draft.assert_called_once_with(
        connection,
        document_id="document-test-id",
        source_key="ssc",
        source_url="https://example.com/notice.pdf",
        content_hash="a" * 64,
        title="Test Notification",
        organization_id="org-test",
        category="central_govt",
    )


def test_duplicate_pdf_skips_storage_upload() -> None:
    pdf = DownloadedPDF(
        url="https://example.com/notice.pdf",
        content=b"%PDF-1.4 test",
        content_hash="a" * 64,
        mime_type="application/pdf",
    )

    with (
        patch("app.pipeline.download_pdf", return_value=pdf),
        patch("app.pipeline.scraped_document_exists", return_value=True),
        patch("app.pipeline.upload_pdf") as upload,
        patch("app.pipeline.save_scraped_document") as save,
        patch("app.pipeline.create_draft_for_document") as create_draft,
    ):
        result = process_pdf_notice(
            source_id="source-test",
            run_id="run-test",
            source_key="ssc",
            organization_id="org-test",
            category="central_govt",
            url="https://example.com/notice.pdf",
            title="Existing Notification",
        )

    assert result["status"] == "duplicate"
    assert result["inserted"] is False
    assert result["opportunity_id"] is None

    upload.assert_not_called()
    save.assert_not_called()
    create_draft.assert_not_called()
