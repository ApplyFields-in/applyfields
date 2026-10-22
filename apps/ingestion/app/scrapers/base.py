"""
Every website gets ONE scraper file (ssc.py, upsc.py, appsc.py …) that extends BaseScraper.
A scraper only finds notice links on the site's "notifications" page.
Downloading, PDF reading and AI extraction happen in app/extract, not here.
"""

import datetime as dt
from abc import ABC, abstractmethod
from dataclasses import dataclass


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
