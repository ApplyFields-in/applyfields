# ruff: noqa: E501  (EMBEDDED is a page payload copied as-is)
import datetime as dt

from app.scrapers.indiapost import IndiaPostScraper


def test_finds_recruitment_notice_and_published_date():
    html = """
    <table>
      <tr>
        <td>Notification for filling up of Drivers (Ordinary Grade)</td>
        <td>PDF</td>
        <td>01/08/2026</td>
        <td><a href="/api/documents/file/driver123">View</a></td>
      </tr>
    </table>
    """
    # The title is in the row, while the link text is "View".
    # The scraper should use the notice title rather than the button label.
    notices = IndiaPostScraper().find_notices(html)

    assert len(notices) == 1
    assert notices[0].title == "Notification for filling up of Drivers (Ordinary Grade)"
    assert notices[0].published_on == dt.date(2026, 8, 1)


def test_ignores_non_document_links():
    html = """
    <a href="https://example.com/api/documents/file/driver123">Driver recruitment notification</a>
    <a href="/about">Driver recruitment notification</a>
    """
    notices = IndiaPostScraper().find_notices(html)
    assert notices == []


def test_deduplicates_same_document_url():
    html = """
    <a href="/api/documents/file/driver123">Driver recruitment notification</a>
    <a href="/api/documents/file/driver123">Driver recruitment notification</a>
    """
    notices = IndiaPostScraper().find_notices(html)
    assert len(notices) == 1


# The live page (Nov 2026) has no <a> links: the list is JSON inside Next.js script payloads.
EMBEDDED = r"""
<script>self.__next_f.push([1,"[{\"id\":\"57f6\",\"title\":\"Notification for Filling up of 19 vacant posts of Skilled Artisan through Direct Recruitment\",\"category\":\"Vacancies\",\"date\":\"29-10-2026\",\"size\":\"906.5 KB\",\"version\":\"English Version\",\"type\":\"PDF\",\"url\":\"/api/documents/file/aaa111\"},{\"id\":\"a104\",\"title\":\"Recruitment of 24 post of Staff Car Driver in Tamilnadu Circle\",\"category\":\"Recruitment\",\"date\":\"29-10-2026\",\"version\":\"Hindi Version\",\"type\":\"PDF\",\"url\":\"/api/documents/file/bbb222\"},{\"id\":\"f58d\",\"title\":\"Philately stamp release\",\"category\":\"Philately\",\"date\":\"28-10-2026\",\"version\":\"English Version\",\"url\":\"/api/documents/file/ccc333\"}]"])</script>
"""


def test_reads_embedded_json_list_and_skips_hindi_copies_and_non_recruitment():
    scraper = IndiaPostScraper()
    notices = scraper.find_notices(EMBEDDED)

    assert [n.url for n in notices] == ["https://www.indiapost.gov.in/api/documents/file/aaa111"]
    assert notices[0].title.startswith("Notification for Filling up of 19 vacant posts")
    assert notices[0].published_on == dt.date(2026, 10, 29)
    assert scraper.is_document_url(notices[0].url)
    assert not scraper.is_document_url("https://example.com/api/documents/file/aaa111")


def test_results_and_merit_lists_are_not_new_jobs():
    is_job = IndiaPostScraper._is_recruitment_title
    assert is_job("Recruitment of Staff Car Driver in Tamilnadu Circle")
    assert is_job("Engagement of Gramin Dak Sevaks - Schedule III")
    assert not is_job("Result of Staff Car Driver recruitment, Tamilnadu Circle")
    assert not is_job("GDS Online Engagement - Merit List III")
    assert not is_job("Selection list of Postman / Mail Guard examination")
    assert not is_job("Cancellation of recruitment notification for Skilled Artisan")
