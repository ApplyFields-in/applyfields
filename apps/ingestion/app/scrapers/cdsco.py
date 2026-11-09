import datetime as dt
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper, NoticeLink


class CDSCOScraper(BaseScraper):
    source_key = "cdsco"
    list_url = "https://www.cdsco.gov.in/opencms/en/Notifications/Vacancy/"

    @staticmethod
    def _parse_date(value: str):
        value = value.strip()

        for fmt in ("%Y-%b-%d", "%Y-%m-%d", "%d-%b-%Y", "%d-%m-%Y"):
            try:
                return dt.datetime.strptime(value, fmt).date()
            except ValueError:
                continue

        return None

    def find_notices(self, html: str) -> list[NoticeLink]:
        soup = BeautifulSoup(html, "html.parser")
        notices = []
        seen_urls = set()

        excluded_terms = (
            "result",
            "selected candidate",
            "mark-list",
            "minutes of meeting",
            "compassionate ground",
        )

        for row in soup.find_all("tr"):
            cells = row.find_all("td", recursive=False)

            if len(cells) < 4:
                continue

            title = cells[1].get_text(" ", strip=True)
            release_date_text = cells[2].get_text(" ", strip=True)
            published_on = self._parse_date(release_date_text)

            if not title or not published_on:
                continue

            # Avoid importing old archive entries.
            if published_on.year < 2025:
                continue

            if any(term in title.lower() for term in excluded_terms):
                continue

            for anchor in cells[3].find_all("a", href=True):
                url = urljoin(self.list_url, anchor["href"])
                parsed = urlsplit(url)

                if parsed.scheme != "https":
                    continue

                if parsed.hostname not in {
                    "cdsco.gov.in",
                    "www.cdsco.gov.in",
                }:
                    continue

                if not parsed.path.lower().endswith(".pdf"):
                    continue

                if url in seen_urls:
                    continue

                seen_urls.add(url)
                notices.append(
                    NoticeLink(
                        title=title,
                        url=url,
                        published_on=published_on,
                    )
                )

        return notices