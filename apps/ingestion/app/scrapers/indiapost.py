import datetime as dt
import re
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper, NoticeLink


class IndiaPostScraper(BaseScraper):
    source_key = "indiapost"
    list_url = "https://www.indiapost.gov.in/vacancies"

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
        title_lower = title.lower()
        return any(
            term in title_lower
            for term in (
                "recruitment", "notification", "vacancy", "vacancies",
                "appointment", "engagement", "selection", "driver",
                "postman", "mail guard", "gramin dak sevak", "gds",
                "deputation", "absorption", "staff", "employment",
                "artisan", "sportsperson", "merit list", "results",
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

        return notices
