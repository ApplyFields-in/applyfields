import datetime as dt
import json
import re
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper, NoticeLink

# The vacancies page is rendered by JavaScript; its document list is embedded as JSON objects like
# {"title": ..., "date": "29-10-2026", "version": "English Version",
#  "url": "/api/documents/file/..."}.
_EMBEDDED_DOC = re.compile(r'\{[^{}]*?"url":"/api/documents/file/[^"]+"[^{}]*\}')


class IndiaPostScraper(BaseScraper):
    source_key = "indiapost"
    list_url = "https://www.indiapost.gov.in/vacancies"

    def is_document_url(self, url: str) -> bool:
        """India Post serves PDFs through /api/documents/file/<id> (no .pdf suffix)."""
        parsed = urlsplit(url)
        return (
            parsed.scheme == "https"
            and parsed.hostname == "www.indiapost.gov.in"
            and parsed.path.lower().startswith("/api/documents/file/")
        )

    def _embedded_notices(self, html: str, seen_urls: set[str]) -> list[NoticeLink]:
        notices: list[NoticeLink] = []
        for raw in _EMBEDDED_DOC.findall(html.replace('\\"', '"')):
            try:
                doc = json.loads(raw)
            except ValueError:
                continue
            title = " ".join(str(doc.get("title") or "").split())
            # Listed once per language: keep English (or bilingual), skip Hindi-only copies.
            if str(doc.get("version") or "").strip().lower() == "hindi version":
                continue
            if not title or not self._is_recruitment_title(title):
                continue
            url = urljoin(self.list_url, doc["url"])
            if not self.is_document_url(url) or url in seen_urls:
                continue
            seen_urls.add(url)
            published_on = self._published_date(str(doc.get("date") or ""))
            notices.append(NoticeLink(title=title, url=url, published_on=published_on))
        return notices

    @staticmethod
    def _published_date(value: str) -> dt.date | None:
        value = value.strip()
        for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%d %b %Y", "%d %B %Y"):
            try:
                return dt.datetime.strptime(value, fmt).date()
            except ValueError:
                continue

        match = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b", value)
        if match:
            day, month, year = map(int, match.groups())
            try:
                return dt.date(year, month, day)
            except ValueError:
                return None
        return None

    @staticmethod
    def _is_recruitment_title(title: str) -> bool:
        """A new vacancy → a draft job. Results, merit lists etc. are updates, not new jobs."""
        title_lower = title.lower()
        if any(
            term in title_lower
            for term in (
                "result", "merit list", "selection list", "selected candidates",
                "shortlist", "answer key", "admit card", "hall ticket", "cancellation",
            )
        ):
            return False
        return any(
            term in title_lower
            for term in (
                "recruitment", "notification", "vacancy", "vacancies",
                "appointment", "engagement", "selection", "driver",
                "postman", "mail guard", "gramin dak sevak", "gds",
                "deputation", "absorption", "staff", "employment",
                "artisan", "sportsperson",
            )
        )

    def find_notices(self, html: str) -> list[NoticeLink]:
        soup = BeautifulSoup(html, "html.parser")
        notices: list[NoticeLink] = []
        seen_urls: set[str] = set()

        for anchor in soup.find_all("a", href=True):
            href = anchor["href"].strip()
            if not href:
                continue

            url = urljoin(self.list_url, href)
            parsed = urlsplit(url)

            if parsed.scheme != "https" or parsed.hostname != "www.indiapost.gov.in":
                continue
            if not parsed.path.lower().startswith("/api/documents/file/"):
                continue

            row = anchor.find_parent("tr")
            title = ""

            if row:
                cells = row.find_all(["td", "th"], recursive=False)
                # India Post's listing table has the document title in a separate cell.
                for cell in cells:
                    candidate = cell.get_text(" ", strip=True)
                    if candidate and candidate.lower() not in {"view", "download", "pdf"}:
                        if self._is_recruitment_title(candidate):
                            title = candidate
                            break

            if not title:
                title = anchor.get_text(" ", strip=True)

            if not title or not self._is_recruitment_title(title):
                continue

            normalized_url = url.split("#", 1)[0]
            if normalized_url in seen_urls:
                continue
            seen_urls.add(normalized_url)

            published_on = None
            if row:
                cells = row.find_all(["td", "th"], recursive=False)
                for cell in cells:
                    candidate = cell.get_text(" ", strip=True)
                    date_value = self._published_date(candidate)
                    if date_value:
                        published_on = date_value
                        break

            notices.append(
                NoticeLink(
                    title=title,
                    url=normalized_url,
                    published_on=published_on,
                )
            )

        # Current site: no <a> links in the HTML, the list is in the embedded JSON.
        notices.extend(self._embedded_notices(html, seen_urls))
        return notices
