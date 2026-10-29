import datetime as dt
import re
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper, NoticeLink
from dataclasses import dataclass

@dataclass(frozen=True)
class RelatedPdfLink:
    title: str
    url: str
    category: str


@dataclass
class RecruitmentPdfBundle:
    recruitment_title: str
    official_page_url: str
    notification_pdf: NoticeLink | None
    related_links: list[RelatedPdfLink]
class IsroScraper(BaseScraper):
    source_key = "isro"
    list_url = "https://www.isro.gov.in/Careers.html"

    @staticmethod
    def _published_date(title: str) -> dt.date | None:
        patterns = (
            r"\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b",
            r"\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\b",
        )

        for pattern in patterns:
            match = re.search(pattern, title)
            if not match:
                continue

            try:
                first, second, year = match.groups()
                if second.isdigit():
                    return dt.date(int(year), int(second), int(first))
                return dt.datetime.strptime(
                    f"{first} {second} {year}", "%d %B %Y"
                ).date()
            except ValueError:
                try:
                    return dt.datetime.strptime(
                        f"{first} {second} {year}", "%d %b %Y"
                    ).date()
                except ValueError:
                    continue

        return None

    def find_notices(self, html: str) -> list[NoticeLink]:
        soup = BeautifulSoup(html, "html.parser")
        notices: list[NoticeLink] = []
        seen_urls: set[str] = set()

        for anchor in soup.find_all("a", href=True):
            title = " ".join(anchor.get_text(" ", strip=True).split())
            if not title or "read more" not in title.lower():
                continue

            url = urljoin(self.list_url, anchor["href"].strip())
            parsed = urlsplit(url)

            if parsed.scheme != "https":
                continue
            if parsed.hostname != "www.isro.gov.in":
                continue
            if not parsed.path.lower().endswith(".html"):
                continue

            path = parsed.path.rsplit("/", 1)[-1].lower()
            if not any(term in path for term in ("recruitment", "career")):
                continue
            if path in {
                "careers.html",
                "careeropportunities.html",
                "currentopportunities.html",
                "liveregistration.html",
                "faqsoncareers.html",
                "oldquestionpapers.html",
            }:
                continue

            title = re.sub(r"\s*read more\s*$", "", title, flags=re.IGNORECASE)
            if not title:
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

    def find_pdf_notices(
        self,
        html: str,
        *,
        detail_url: str,
        title: str,
        published_on: dt.date | None = None,
    ) -> list[NoticeLink]:
        """Extract unique official ISRO PDF links from a detail page."""
        soup = BeautifulSoup(html, "html.parser")
        notices: list[NoticeLink] = []
        seen_urls: set[str] = set()

        for anchor in soup.find_all("a", href=True):
            href = anchor["href"].strip()
            url = urljoin(detail_url, href)
            parsed = urlsplit(url)

            if parsed.scheme != "https":
                continue
            if parsed.hostname != "www.isro.gov.in":
                continue
            if not parsed.path.lower().endswith(".pdf"):
                continue

            # Ignore fragments when deduplicating PDF URLs.
            normalized_url = url.split("#", 1)[0]
            if normalized_url in seen_urls:
                continue
            seen_urls.add(normalized_url)
            link_title = " ".join(anchor.get_text(" ", strip=True).split())

            notices.append(
                NoticeLink(
                    title=link_title or title,
                    url=normalized_url,
                    published_on=published_on,
                )
            )


        return notices


def is_recruitment_advertisement(title: str, url: str) -> bool:
    """Identify likely recruitment advertisements, excluding supporting documents."""
    text = f"{title} {url}".lower()
    filename = url.split("?", 1)[0].rsplit("/", 1)[-1].lower()

    exclude_terms = (
        "application_form",
        "application form",
        "annexure",
        "bio-data",
        "biodata",
        "declaration",
        "corrigendum",
        "short-listed",
        "shortlisted",
        "selection panel",
        "interview schedule",
        "answer key",
        "answer_key",
        "question paper",
        "question_paper",
        "admit card",
        "objection format",
        "response sheet",
    )

    if any(term in text for term in exclude_terms):
        return False

    include_terms = (
        "recruitment to the post",
        "recruitment for",
        "detailed advertisement",
        "inviting applications",
        "junior research fellow",
        "research associate",
        "project scientist",
    )

    return any(term in text for term in include_terms)
def classify_pdf_link(title: str, url: str) -> str:
    """Classify an ISRO PDF using its link title and filename."""
    filename = url.split("?", 1)[0].rsplit("/", 1)[-1]

    text = re.sub(
        r"[_\-]+",
        " ",
        f"{title} {filename}".lower(),
    )
    text = " ".join(text.split())

    # Supporting documents must be checked before main advertisements.
    if any(term in text for term in (
        "application form",
        "application_form",
        "online application",
    )):
        return "application_form"

    if any(term in text for term in (
        "shortlisted",
        "short listed",
        "short-list",
        "short list",
    )):
        return "shortlist"

    if any(term in text for term in (
        "interview schedule",
        "schedule of interview",
        "interview date",
        "interview call letter",
    )):
        return "interview_schedule"

    if any(term in text for term in (
        "corrigendum",
        "addendum",
    )):
        return "corrigendum"

    if any(term in text for term in (
        "answer key",
        "question paper",
        "response sheet",
        "objection format",
        "admit card",
        "annexure",
        "bio-data",
        "biodata",
        "declaration",
    )):
        return "supporting_document"

    if any(term in text for term in (
        "result",
        "merit list",
        "selection panel",
        "selected candidates",
        "final selection",
    )):
        return "result"

    if any(term in text for term in (
        "detailed recruitment advertisement",
        "recruitment to the post",
        "recruitment for",
        "detailed advertisement",
        "inviting applications",
        "junior research fellow",
        "research associate",
        "project scientist",
    )):
        return "main_advertisement"

    return "supporting_document"
def group_related_pdf_links(
    detail: NoticeLink,
    pdfs: list[NoticeLink],
) -> RecruitmentPdfBundle:
    """Group a recruitment page's PDFs into its main notice and related links."""
    classified = []

    for pdf in pdfs:
        category = classify_pdf_link(pdf.title, pdf.url)

        # Use the parent page title as a fallback when the PDF link
        # has a generic label such as "Download PDF".
        if (
            category == "supporting_document"
            and is_recruitment_advertisement(detail.title, pdf.url)
        ):
            category = "main_advertisement"

        classified.append((pdf, category))
    # Use the first identified main advertisement as the primary notification.
    main_index = next(
        (
            index
            for index, (_, category) in enumerate(classified)
            if category == "main_advertisement"
        ),
        None,
    )

    notification_pdf = (
        classified[main_index][0]
        if main_index is not None
        else None
    )

    related_links = [
        RelatedPdfLink(
            title=pdf.title,
            url=pdf.url,
            category=category,
        )
        for index, (pdf, category) in enumerate(classified)
        if index != main_index
    ]

    return RecruitmentPdfBundle(
        recruitment_title=detail.title,
        official_page_url=detail.url,
        notification_pdf=notification_pdf,
        related_links=related_links,
    )