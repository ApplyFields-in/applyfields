
import hashlib
from unittest.mock import Mock, patch

import pytest

from app.downloader import download_pdf


def test_download_pdf_calculates_sha256() -> None:
    pdf_content = b"%PDF-1.4\nfake test PDF"
    response = Mock()
    response.content = pdf_content
    response.url = "https://example.com/notice.pdf"

    with patch("app.downloader.fetch", return_value=response):
        result = download_pdf("https://example.com/notice.pdf")

    assert result.content == pdf_content
    assert result.content_hash == hashlib.sha256(pdf_content).hexdigest()
    assert result.mime_type == "application/pdf"


def test_download_pdf_rejects_html() -> None:
    response = Mock()
    response.content = b"<html><body>Not a PDF</body></html>"
    response.url = "https://example.com/notice"

    with patch("app.downloader.fetch", return_value=response):
        with pytest.raises(ValueError, match="valid PDF"):
            download_pdf("https://example.com/notice")
