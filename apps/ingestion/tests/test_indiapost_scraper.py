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
