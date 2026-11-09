
import datetime as dt
import re
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper, NoticeLink


class NPCILScraper(BaseScraper):
    source_key = "npcil"
    list_url = "https://npcil.nic.in/content/289_1_Opportunities.aspx"

    @staticmethod
    def _published_date(value: str) -> dt.date | None:
        value = value.strip()

        for fmt in ("%d.%m.%Y", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                return dt.datetime.strptime(value, fmt).date()
            except ValueError:
                continue

        return None

    def find_notices(self, html: str) -> list[NoticeLink]:
        """Extract official NPCIL recruitment advertisement PDFs."""
        soup = BeautifulSoup(html, "html.parser")
        notices: list[NoticeLink] = []
        seen_urls: set[str] = set()

        for row in soup.find_all("tr"):
            cells = row.find_all(["td", "th"], recursive=False)

            if len(cells) < 4:
                continue

            published_on = self._published_date(
                cells[0].get_text(" ", strip=True)
            )
            advertisement_no = cells[1].get_text(" ", strip=True)
            subject = cells[2].get_text(" ", strip=True)

            if not subject:
                continue

            row_text = " ".join(row.stripped_strings).lower()

            # Do not create new opportunities from historical result rows.
            if any(term in row_text for term in (
                "select list of candidates",
                "cut-off marks",
                "shortlisted candidates for",
            )):
                continue

            for anchor in row.find_all("a", href=True):
                label = " ".join(
                    anchor.get_text(" ", strip=True).lower().split()
                )

                # Only main advertisements create draft opportunities.
                # Corrigenda and result PDFs are not separate opportunities.
                if "download advertisement" not in label:
                    continue

                href = anchor["href"].strip()
                url = urljoin(self.list_url, href)
                parsed = urlsplit(url)

                if parsed.scheme != "https":
                    continue

                if parsed.hostname not in {
                    "npcil.nic.in",
                    "www.npcil.nic.in",
                }:
                    continue

                if not parsed.path.lower().endswith(".pdf"):
                    continue

                normalized_url = url.split("#", 1)[0]

                if normalized_url in seen_urls:
                    continue

                seen_urls.add(normalized_url)

                title = (
                    f"{advertisement_no} - {subject}"
                    if advertisement_no and advertisement_no != "-"
                    else subject
                )

                notices.append(
                    NoticeLink(
                        title=title,
                        url=normalized_url,
                        published_on=published_on,
                    )
                )

        return notices
