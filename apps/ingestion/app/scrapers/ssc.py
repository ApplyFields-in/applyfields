
"""Discover SSC notices from its official notice-board API."""
import datetime as dt
from urllib.parse import quote, urlencode, urljoin

from app.fetcher import fetch
from app.scrapers.base import BaseScraper, NoticeLink


class SSCScraper(BaseScraper):
    source_key = "ssc"
    list_url = "https://ssc.gov.in/home/notice-board"
    api_url = "https://ssc.gov.in/api/general-website/portal/records"
    pdf_base_url = "https://ssc.gov.in/api/attachment/"

    def find_notices(self, html: str) -> list[NoticeLink]:
        """Preserve HTML parsing for compatibility and existing tests."""
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")
        notices: list[NoticeLink] = []
        seen_urls: set[str] = set()

        for link in soup.find_all("a", href=True):
            title = link.get_text(" ", strip=True)
            href = link.get("href", "").strip()

            if not title or not href:
                continue

            url = urljoin(self.list_url, href)
            text = f"{title} {href}".lower()

            if not url.startswith(("https://", "http://")):
                continue
            if not any(
                word in text
                for word in (
                    "notice",
                    "notification",
                    "recruitment",
                    "examination",
                    ".pdf",
                )
            ):
                continue
            if url in seen_urls:
                continue

            seen_urls.add(url)
            notices.append(NoticeLink(title=title, url=url))

        return notices

    def discover_notices(self) -> list[NoticeLink]:
        """Fetch real notice records and PDF attachments from SSC's API."""
        notices: list[NoticeLink] = []
        seen_urls: set[str] = set()
        page = 1
        limit = 10

        while True:
            params = {
                "page": page,
                "limit": limit,
                "contentType": "notice-boards",
                "key": "createdAt",
                "order": "DESC",
                "pageType": "filter",
                "isAttachment": "true",
                "attributes": (
                    "id,headline,examId,contentType,redirectUrl,startDate,"
                    "endDate,language,createdAt"
                ),
                "queryKey": "startDate,endDate",
                "queryValue": "undefined,undefined",
                "customKey": "createdAt",
                "exams": "false",
                "date": "false",
                "language": "english",
            }



            response = fetch(f"{self.api_url}?{urlencode(params)}")
            payload = response.json()
            response.raise_for_status()
            payload = response.json()

            if payload.get("statusCode") != "200":
                raise ValueError("SSC API returned an unsuccessful status")

            records = payload.get("data")
            if not isinstance(records, list):
                raise ValueError("Unexpected SSC API response structure")

            for record in records:
                if not isinstance(record, dict):
                    continue

                title = str(record.get("headline") or "").strip()
                attachments = record.get("attachments") or []

                if not title or not isinstance(attachments, list):
                    continue

                published_on = None
                created_at = record.get("createdAt")
                if created_at:
                    try:
                        published_on = dt.datetime.fromisoformat(
                            created_at.replace("Z", "+00:00")
                        ).date()
                    except (ValueError, AttributeError):
                        published_on = None

                for attachment in attachments:
                    if not isinstance(attachment, dict):
                        continue

                    path = str(attachment.get("path") or "").strip()
                    if not path or not path.lower().endswith(".pdf"):
                        continue

                    path = path.replace("\\", "/").lstrip("/")
                    url = urljoin(
                        self.pdf_base_url,
                        quote(path, safe="/"),
                    )

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

            # Continue only when the API returned a full page.
            if len(records) < limit:
                break

            page += 1

        return notices
