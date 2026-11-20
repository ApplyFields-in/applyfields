"""
One scraper for simple sites: a page that lists notice PDFs as plain links.

Its settings live in `scrape_sources.config`, so adding such a site is a database row,
not a new file:

    {"path_contains": "/notifications/", "title_words": ["notification", "advertisement"],
     "hosts": ["psc.example.gov.in"], "category": "state_govt"}

Every key is optional. Two keys cover the common variations:
- `doc_path_contains`: PDFs served from a path without ".pdf" (TGPSC "/preview/…").
- `detail_path_contains`: the list page links to one page per vacancy and the PDF sits on that
  page (DRDO, LIC). Those pages are fetched and their PDFs become the notices.

Sites that need JavaScript, an API or more steps still get their own file (ssc.py, isro.py …);
a dedicated file always wins over the config.
"""

import datetime as dt
import re
from typing import Literal
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup
from pydantic import BaseModel, ConfigDict, Field

from app.fetcher import fetch
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
    doc_path_contains: str = ""  # also treat links with this in the path as documents
    detail_path_contains: str = ""  # list links to per-vacancy pages that hold the PDFs
    title_words: list[str] = []  # keep only links whose text has any of these words
    skip_words: list[str] = []  # drop links whose text has any of these ("result", "key" …)
    limit: int | None = Field(default=None, ge=1)  # first N matches in page order (newest-first
    # sites); stops a page with years of history from flooding the review queue
    category: Category | None = None  # opportunity category for the drafts


_DATE = re.compile(r"\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b")
_DEFAULT_DETAIL_PAGES = 10  # each detail page is one more polite fetch


def first_date(text: str) -> dt.date | None:
    """First real DD/MM/YYYY (or . / - separated) date in the text."""
    for day, month, year in _DATE.findall(text):
        try:
            return dt.date(int(year), int(month), int(day))
        except ValueError:
            continue
    return None


def _page_title(soup: BeautifulSoup) -> str:
    """The page's own name: "<vacancy> | <site>" → "<vacancy>". An <h1> is often the site name."""
    tag = soup.find("title") or soup.find("h1")
    return tag.get_text(" ", strip=True).split(" | ", 1)[0].strip() if tag else ""


class GenericPdfListScraper(BaseScraper):
    def __init__(self, source_key: str, list_url: str, config: dict) -> None:
        self.source_key = source_key
        self.list_url = list_url
        self.config = GenericConfig.model_validate(config)
        self.category = self.config.category

    def _hosts(self) -> set[str]:
        return {h.lower() for h in self.config.hosts} or {urlsplit(self.list_url).hostname}

    def is_document_url(self, url: str) -> bool:
        doc_part = self.config.doc_path_contains.lower()
        path = urlsplit(url).path.lower()
        return path.endswith(".pdf") or bool(doc_part and doc_part in path)

    def find_notices(self, html: str) -> list[NoticeLink]:
        if not self.config.detail_path_contains:
            return self._documents(html, self.list_url)

        notices: list[NoticeLink] = []
        seen: set[str] = set()
        for detail_url in self._detail_links(html):
            for notice in self._documents(fetch(detail_url).text, detail_url, from_detail=True):
                if notice.url in seen:
                    continue
                seen.add(notice.url)
                notices.append(notice)
                if len(notices) == self.config.limit:
                    return notices
        return notices

    def _detail_links(self, html: str) -> list[str]:
        detail_part = self.config.detail_path_contains.lower()
        list_scheme = urlsplit(self.list_url).scheme
        hosts = self._hosts()
        links: list[str] = []

        for anchor in BeautifulSoup(html, "html.parser").find_all("a", href=True):
            parts = urlsplit(urljoin(self.list_url, anchor["href"].strip()).split("#", 1)[0])
            if parts.hostname not in hosts or detail_part not in parts.path.lower():
                continue
            # Same site, same scheme: DRDO links its own https pages as http, and port 80 is shut.
            url = parts._replace(scheme=list_scheme).geturl()
            if url.rstrip("/") == self.list_url.rstrip("/") or url in links:
                continue
            links.append(url)
            if len(links) == (self.config.limit or _DEFAULT_DETAIL_PAGES):
                break
        return links

    def _documents(self, html: str, base_url: str, from_detail: bool = False) -> list[NoticeLink]:
        hosts = self._hosts()
        path_part = self.config.path_contains.lower()
        words = [w.lower() for w in self.config.title_words]
        skip = [w.lower() for w in self.config.skip_words]

        soup = BeautifulSoup(html, "html.parser")
        page_title = _page_title(soup) if from_detail else ""
        notices: list[NoticeLink] = []
        seen: set[str] = set()

        for anchor in soup.find_all("a", href=True):
            title = anchor.get_text(" ", strip=True) or anchor.get("title", "").strip()
            url = urljoin(base_url, anchor["href"].strip()).split("#", 1)[0]
            parts = urlsplit(url)
            path = parts.path.lower()

            # A detail page's "View" / "Download" link is named by the page it sits on.
            if from_detail and len(title) < 15:
                title = page_title or title

            if not title or url in seen:
                continue
            if parts.scheme not in {"http", "https"} or parts.hostname not in hosts:
                continue
            if not self.is_document_url(url) or path_part not in path:
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
