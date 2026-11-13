"""
Every website gets ONE scraper file (ssc.py, upsc.py, appsc.py …) that extends BaseScraper.
A scraper only finds notice links on the site's "notifications" page.
Downloading, PDF reading and AI extraction happen in app/extract, not here.
"""

import datetime as dt
from abc import ABC, abstractmethod
from dataclasses import dataclass
from urllib.parse import urlsplit


@dataclass
class NoticeLink:
    title: str
    url: str
    published_on: dt.date | None = None


class BaseScraper(ABC):
    source_key: str
    list_url: str

    @abstractmethod
    def find_notices(self, html: str) -> list[NoticeLink]:
        """Read the list page HTML and return the notices found on it."""

    def is_document_url(self, url: str) -> bool:
        """Links the pipeline may download. Override for sites that serve PDFs without a .pdf path;
        the downloader still rejects anything whose bytes don't start with %PDF-."""
        return urlsplit(url).path.lower().endswith(".pdf")

    def resolve_document_url(self, url: str) -> str:
        """The URL to actually download. Override when the listed link is a wrapper page around the
        PDF. Called only for documents a run processes (it may cost one extra fetch)."""
        return url
