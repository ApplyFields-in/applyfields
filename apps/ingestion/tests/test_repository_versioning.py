import json
from unittest.mock import MagicMock

from app.db.repository import create_draft_for_document


def test_existing_opportunity_without_versions_gets_initial_version():
    connection = MagicMock()

    document_result = MagicMock()
    document_result.mappings.return_value.one_or_none.return_value = {
        "id": "doc-1",
        "opportunity_id": None,
    }

    existing_result = MagicMock()
    existing_result.scalar_one_or_none.return_value = "opp-1"

    latest_version_result = MagicMock()
    latest_version_result.mappings.return_value.one_or_none.return_value = None

    connection.execute.side_effect = [
        document_result,
        existing_result,
        latest_version_result,
        MagicMock(),  # Insert initial version
        MagicMock(),  # Link document to existing opportunity
    ]

    result = create_draft_for_document(
        connection,
        document_id="doc-1",
        source_key="ssc",
        source_url="https://example.com/notice.pdf",
        content_hash="a" * 64,
        title="Updated notice",
        organization_id="org-1",
        category="central_govt",
    )

    assert result == "opp-1"
    assert connection.execute.call_count == 5

    version_params = connection.execute.call_args_list[3].args[1]
    snapshot = json.loads(version_params["snapshot"])

    assert snapshot["source_content_hash"] == "a" * 64
    assert snapshot["status"] == "draft"
    assert version_params["document_id"] == "doc-1"
def test_changed_pdf_creates_pending_review_version():
    connection = MagicMock()

    document_result = MagicMock()
    document_result.mappings.return_value.one_or_none.return_value = {
        "id": "doc-2",
        "opportunity_id": None,
    }

    existing_result = MagicMock()
    existing_result.scalar_one_or_none.return_value = "opp-1"

    latest_version_result = MagicMock()
    latest_version_result.mappings.return_value.one_or_none.return_value = {
        "version_no": 1,
        "snapshot": {
            "source_content_hash": "a" * 64,
            "title": "Old notice",
        },
    }

    connection.execute.side_effect = [
        document_result,
        existing_result,
        latest_version_result,
        MagicMock(),  # Insert changed pending version
        MagicMock(),  # Update opportunity source hash
        MagicMock(),  # Link document
    ]

    result = create_draft_for_document(
        connection,
        document_id="doc-2",
        source_key="ssc",
        source_url="https://example.com/notice.pdf",
        content_hash="b" * 64,
        title="Updated notice",
        organization_id="org-1",
        category="central_govt",
    )

    assert result == "opp-1"

    version_params = connection.execute.call_args_list[3].args[1]
    snapshot = json.loads(version_params["snapshot"])

    assert snapshot["source_content_hash"] == "b" * 64
    assert snapshot["title"] == "Updated notice"
    assert version_params["version_no"] == 2
