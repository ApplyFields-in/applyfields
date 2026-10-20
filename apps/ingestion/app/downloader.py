"""Download and validate notification PDFs, then calculate SHA-256 hashes."""

import hashlib
from dataclasses import dataclass
from urllib.parse import urlparse

from app.fetcher import fetch

MAX_PDF_BYTES = 10 * 1024 * 1024  # 10 MB


@dataclass(frozen=True)
class DownloadedPDF:
    url: str
    content: bytes
    content_hash: str
    mime_type: str


def download_pdf(url: str) -> DownloadedPDF:
    """Download a bounded HTTPS PDF and calculate its SHA-256 hash."""
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        raise ValueError("PDF URLs must use HTTPS")

    response = fetch(url)

    # Reject cross-host redirects if a redirect was followed by the fetcher.
    final_url = urlparse(str(response.url))
    if final_url.scheme != "https" or final_url.hostname != parsed.hostname:
        raise ValueError("PDF download redirected to an untrusted URL")

    content_length = response.headers.get("content-length")

    if isinstance(content_length, str) and content_length.strip():
        try:
            declared_size = int(content_length)
        except ValueError as exc:
            raise ValueError("Invalid PDF Content-Length header") from exc

        if declared_size < 0:
            raise ValueError("Invalid PDF Content-Length header")

        if declared_size > MAX_PDF_BYTES:
            raise ValueError("PDF exceeds the 10 MB size limit")


    content = response.content
    if len(content) > MAX_PDF_BYTES:
        raise ValueError("PDF exceeds the 10 MB size limit")

    if not content.startswith(b"%PDF-"):
        raise ValueError(f"The URL did not return a valid PDF: {url}")

    return DownloadedPDF(
        url=str(response.url),
        content=content,
        content_hash=hashlib.sha256(content).hexdigest(),
        mime_type="application/pdf",
    )
