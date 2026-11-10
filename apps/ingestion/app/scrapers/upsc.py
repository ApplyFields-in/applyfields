import datetime as dt
import re
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper, NoticeLink


class UPSCScraper(BaseScraper):
    source_key = "upsc"
    list_url = "https://www.upsc.gov.in/examinations/active-exams"

    @staticmethod
    def _published_date(title: str) -> dt.date | None:
        match = re.search(
            r"\b(?:dated?|dt)\.?\s*:?\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4})",
            title,
            re.IGNORECASE,
        )
        if not match:
            return None

        day, month, year = map(int, match.groups())
        try:
            return dt.date(year, month, day)
        except ValueError:
            return None

    def find_notices(self, html: str) -> list[NoticeLink]:
        """Extract official UPSC notification PDF links from supplied HTML."""
        soup = BeautifulSoup(html, "html.parser")
        notices: list[NoticeLink] = []
        seen_urls: set[str] = set()

        for anchor in soup.find_all("a", href=True):
            title = anchor.get_text(" ", strip=True)
            href = anchor["href"].strip()

            if not title or not href:
                continue

            url = urljoin(self.list_url, href)
            parsed = urlsplit(url)

            if parsed.scheme not in {"http", "https"}:
                continue
            if parsed.hostname not in {"upsc.gov.in", "www.upsc.gov.in"}:
                continue
            if not parsed.path.lower().endswith(".pdf"):
                continue

            text = title.lower()
            if not any(
                term in text
                for term in (
                    "notification",
                    "examination",
                    "recruitment",
                    "advertisement",
                    "advt",
                    "notice",
                )
            ):
                continue

            normalized_url = url.split("#", 1)[0]
            if normalized_url in seen_urls:
                continue

            seen_urls.add(normalized_url)
            notices.append(
                NoticeLink(
                    title=title,
                    url=normalized_url,
                    published_on=self._published_date(title),
                )
            )

        return notices
