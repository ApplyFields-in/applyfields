"""
One scraper for simple sites: a page that lists notice PDFs as plain links.

Its settings live in `scrape_sources.config`, so adding such a site is a database row,
not a new file:

    {"path_contains": "/notifications/", "title_words": ["notification", "advertisement"],
     "hosts": ["psc.example.gov.in"], "category": "state_govt"}

Every key is optional. Sites that need JavaScript, an API or a click-through detail page still get
their own file (ssc.py, isro.py …); a dedicated file always wins over the config.
"""

import datetime as dt
import re
from typing import Literal
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup
from pydantic import BaseModel, ConfigDict, Field

from app.scrapers.base import BaseScraper, NoticeLink

# Same values as the `opportunity_category` enum in database/01_create_tables.sql.
Category = Literal[
    "central_govt", "state_govt", "district", "panchayat", "municipal", "psu",
    "railways", "banking", "defence", "police",
    "entrance", "competitive", "recruitment",
    "central", "state",
    "college", "university", "course",
    "other",
]  # fmt: skip


class GenericConfig(BaseModel):
    # A misspelt key fails the run loudly instead of silently scraping everything.
    model_config = ConfigDict(extra="forbid")

    hosts: list[str] = []  # allowed link hosts; empty = the list page's own host
    path_contains: str = ""  # keep only links whose path contains this (case-insensitive)
    title_words: list[str] = []  # keep only links whose text has any of these words
    skip_words: list[str] = []  # drop links whose text has any of these ("result", "key" …)
    limit: int | None = Field(default=None, ge=1)  # first N matches in page order (newest-first
    # sites); stops a page with years of history from flooding the review queue
    category: Category | None = None  # opportunity category for the drafts


_DATE = re.compile(r"\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b")


def first_date(text: str) -> dt.date | None:
    """First real DD/MM/YYYY (or . / - separated) date in the text."""
    for day, month, year in _DATE.findall(text):
        try:
            return dt.date(int(year), int(month), int(day))
        except ValueError:
            continue
    return None


class GenericPdfListScraper(BaseScraper):
    def __init__(self, source_key: str, list_url: str, config: dict) -> None:
        self.source_key = source_key
        self.list_url = list_url
        self.config = GenericConfig.model_validate(config)
        self.category = self.config.category

    def find_notices(self, html: str) -> list[NoticeLink]:
        hosts = {h.lower() for h in self.config.hosts} or {urlsplit(self.list_url).hostname}
        path_part = self.config.path_contains.lower()
        words = [w.lower() for w in self.config.title_words]
        skip = [w.lower() for w in self.config.skip_words]

        notices: list[NoticeLink] = []
        seen: set[str] = set()

        for anchor in BeautifulSoup(html, "html.parser").find_all("a", href=True):
            title = anchor.get_text(" ", strip=True) or anchor.get("title", "").strip()
            url = urljoin(self.list_url, anchor["href"].strip()).split("#", 1)[0]
            parts = urlsplit(url)
            path = parts.path.lower()

            if not title or url in seen:
                continue
            if parts.scheme not in {"http", "https"} or parts.hostname not in hosts:
                continue
            if not path.endswith(".pdf") or path_part not in path:
                continue
            if words and not any(w in title.lower() for w in words):
                continue
            if any(w in title.lower() for w in skip):
                continue

            # ponytail: first date in the link text, else in its table row / list item. It may be
            # a last date, not the publish date; it only orders newest-first.
            row = anchor.find_parent(["tr", "li"])
            published_on = first_date(title) or (first_date(row.get_text(" ")) if row else None)

            seen.add(url)
            notices.append(NoticeLink(title=title, url=url, published_on=published_on))
            if len(notices) == self.config.limit:
                break

        return notices
