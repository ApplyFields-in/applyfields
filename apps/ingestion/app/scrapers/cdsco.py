import datetime as dt
import re
from urllib.parse import quote, urljoin, urlsplit

from bs4 import BeautifulSoup

from app.fetcher import fetch
from app.scrapers.base import BaseScraper, NoticeLink

_IFRAME_SRC = re.compile(r"""<iframe[^>]+src\s*=\s*['"]([^'"]+)['"]""", re.IGNORECASE)


class CDSCOScraper(BaseScraper):
    source_key = "cdsco"
    list_url = "https://www.cdsco.gov.in/opencms/en/Notifications/Vacancy/"

    def is_document_url(self, url: str) -> bool:
        """CDSCO serves its PDFs through download_file_division.jsp?... (no .pdf in the path)."""
        parsed = urlsplit(url)
        path = parsed.path.lower()
        return (
            parsed.scheme == "https"
            and parsed.hostname in {"cdsco.gov.in", "www.cdsco.gov.in"}
            and (path.endswith(".pdf") or path.endswith("/download_file_division.jsp"))
        )

    def resolve_document_url(self, url: str) -> str:
        """download_file_division.jsp returns a tiny HTML page; its <iframe src> is the real PDF."""
        if not urlsplit(url).path.lower().endswith("/download_file_division.jsp"):
            return url
        match = _IFRAME_SRC.search(fetch(url).text)
        if not match:
            raise ValueError(f"CDSCO download page has no file link: {url}")
        # Join first (so an absolute off-site src stays off-site and is refused below), then encode
        # the spaces/brackets in the file name, keeping any existing %-escapes.
        parts = urlsplit(urljoin(url, match.group(1).strip()))
        real = parts._replace(path=quote(parts.path, safe="/%")).geturl()
        if not (self.is_document_url(real) and urlsplit(real).path.lower().endswith(".pdf")):
            raise ValueError(f"CDSCO file link is not an official PDF: {real}")
        return real

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

                if not self.is_document_url(url):
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