import datetime as dt

from app.scrapers.upsc import UPSCScraper


def test_finds_official_notification_pdfs_and_skips_duplicates() -> None:
    scraper = UPSCScraper()

    html = """
    <html><body>
        <a href="/files/Notification_2026.pdf">
            Notification Dated:16/10/2026
        </a>
        <a href="/files/Notification_2026.pdf">
            Duplicate notification
        </a>
        <a href="/examinations/active-exams">Active examinations</a>
        <a href="https://example.com/notification.pdf">External notification</a>
        <a href="/files/general.pdf">General document</a>
    </body></html>
    """

    notices = scraper.find_notices(html)

    assert len(notices) == 1
    assert notices[0].title == "Notification Dated:16/10/2026"
    assert notices[0].url == "https://www.upsc.gov.in/files/Notification_2026.pdf"
    assert notices[0].published_on == dt.date(2026, 10, 16)


def test_invalid_publication_date_returns_none() -> None:
    scraper = UPSCScraper()

    html = """
    <a href="/files/notification.pdf">
        Notification Dated:31/02/2026
    </a>
    """

    notices = scraper.find_notices(html)

    assert len(notices) == 1
    assert notices[0].published_on is None


def test_ignores_non_pdf_and_non_upsc_links() -> None:
    scraper = UPSCScraper()

    html = """
    <a href="/recruitment">Recruitment notification</a>
    <a href="https://example.com/notification.pdf">Notification PDF</a>
    """

    assert scraper.find_notices(html) == []
