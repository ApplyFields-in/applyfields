import datetime as dt
import re
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper, NoticeLink


class AppscScraper(BaseScraper):
    source_key = "appsc"
    list_url = "https://portal-psc.ap.gov.in/HomePages/RecruitmentNotifications"

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
        soup = BeautifulSoup(html, "html.parser")
        notices: list[NoticeLink] = []
        seen_urls: set[str] = set()

        for anchor in soup.find_all("a", href=True):
            title = anchor.get_text(" ", strip=True)
            if not title:
                continue

            url = urljoin(self.list_url, anchor["href"].strip())
            parsed = urlsplit(url)

            if parsed.scheme not in {"http", "https"}:
                continue
            if parsed.hostname not in {"psc.ap.gov.in", "portal-psc.ap.gov.in"}:
                continue
            if not parsed.path.lower().startswith(
                "/documents/notificationdocuments/"
            ):
                continue
            if not parsed.path.lower().endswith(".pdf"):
                continue
            if "notification" not in title.lower():
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
