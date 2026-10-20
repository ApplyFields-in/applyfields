
from unittest.mock import patch

import pytest

from app.storage import upload_pdf


def test_upload_pdf_requires_supabase_url() -> None:
    with (
        patch("app.storage.settings.supabase_url", ""),
        patch("app.storage.settings.supabase_service_role_key", "test-key"),
    ):
        with pytest.raises(RuntimeError, match="SUPABASE_URL"):
            upload_pdf(
                source_key="ssc",
                content_hash="a" * 64,
                content=b"%PDF-1.4 test",
            )


def test_upload_pdf_requires_service_role_key() -> None:
    with (
        patch(
            "app.storage.settings.supabase_url",
            "https://example.supabase.co",
        ),
        patch("app.storage.settings.supabase_service_role_key", ""),
    ):
        with pytest.raises(RuntimeError, match="service-role key"):
            upload_pdf(
                source_key="ssc",
                content_hash="a" * 64,
                content=b"%PDF-1.4 test",
            )


def test_upload_pdf_returns_object_path() -> None:
    with (
        patch(
            "app.storage.settings.supabase_url",
            "https://example.supabase.co",
        ),
        patch("app.storage.settings.supabase_service_role_key", "test-key"),
        patch("app.storage.httpx.Client") as client_class,
    ):
        client = client_class.return_value.__enter__.return_value
        client.put.return_value.raise_for_status.return_value = None

        result = upload_pdf(
            source_key="ssc",
            content_hash="a" * 64,
            content=b"%PDF-1.4 test",
        )

    assert result == f"ssc/{'a' * 64}.pdf"
    client.put.assert_called_once()
