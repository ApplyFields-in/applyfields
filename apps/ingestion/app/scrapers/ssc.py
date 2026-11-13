"""Discover SSC notices from its official notice-board API."""
import datetime as dt
import re
from urllib.parse import quote, urlencode, urljoin

from app.fetcher import fetch
from app.scrapers.base import BaseScraper, NoticeLink

# A new recruitment = a new draft job. Everything else on SSC's notice board (admit cards, results,
# answer keys, vacancy revisions, cancellations…) is an update to an exam that already exists.
_NEW_RECRUITMENT = re.compile(
    r"^notice of |\brecruitment\b|^notification\b|\bengagement of\b", re.I
)
_NOT_RECRUITMENT = re.compile(
    r"result|answer key|response sheet|admit card|admission certificate|city of exam"
    r"|identity verification"
    r"|allocation|cancellation|schedule|tentative vacanc|marks|calling options|addendum|corrigendum"
    r"|revised|important notice|declaration|skill test|document verification|selection list",
    re.I,
)


def is_new_recruitment(title: str) -> bool:
    """SSC headline → is this a new recruitment/exam notification (not an update to one)?"""
    return bool(_NEW_RECRUITMENT.search(title)) and not _NOT_RECRUITMENT.search(title)


class SSCScraper(BaseScraper):
    source_key = "ssc"
    list_url = "https://ssc.gov.in/home/notice-board"
    api_url = "https://ssc.gov.in/api/general-website/portal/records"
    pdf_base_url = "https://ssc.gov.in/api/attachment/"
    # Newest 100 notices (~3 months). Each page costs one polite 5 s fetch; older pages were all
    # updates to past exams anyway.
    max_pages = 10

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

                title = " ".join(str(record.get("headline") or "").split())
                attachments = record.get("attachments") or []

                if not title or not isinstance(attachments, list):
                    continue
                if not is_new_recruitment(title):
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
            if len(records) < limit or page >= self.max_pages:
                break

            page += 1

        return notices
