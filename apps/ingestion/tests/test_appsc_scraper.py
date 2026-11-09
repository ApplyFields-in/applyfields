import datetime as dt

from app.scrapers.appsc import AppscScraper


def test_finds_pdf_notifications_and_skips_duplicates() -> None:
    scraper = AppscScraper()

    html = """
    <html><body>
        <a href="https://psc.ap.gov.in/Documents/NotificationDocuments/notice1.pdf">
            Notification No.18/2026, Dated:16/10/2026 - Forest Beat Officer
        </a>
        <a href="https://psc.ap.gov.in/Documents/NotificationDocuments/notice1.pdf">
            Duplicate notification
        </a>
        <a href="/HomePages/RecruitmentNotifications_Detailed_Breakup_Documents.aspx">
            Detailed breakup
        </a>
        <a href="https://example.com/notice.pdf">External PDF</a>
    </body></html>
    """

    notices = scraper.find_notices(html)

    assert len(notices) == 1
    assert notices[0].title == (
        "Notification No.18/2026, Dated:16/10/2026 - Forest Beat Officer"
    )
    assert notices[0].url == (
        "https://psc.ap.gov.in/Documents/NotificationDocuments/notice1.pdf"
    )
    assert notices[0].published_on == dt.date(2026, 10, 16)


def test_resolves_relative_pdf_url() -> None:
    scraper = AppscScraper()

    html = '<a href="/Documents/NotificationDocuments/notice.pdf">Recruitment Notification</a>'

    notices = scraper.find_notices(html)

    assert len(notices) == 1
    assert notices[0].url == (
        "https://portal-psc.ap.gov.in/Documents/NotificationDocuments/notice.pdf"
    )


def test_invalid_publication_date_returns_none() -> None:
    scraper = AppscScraper()

    html = """
    <a href="https://psc.ap.gov.in/Documents/NotificationDocuments/notice.pdf">
        Notification Dated:31/02/2026
    </a>
    """

    notices = scraper.find_notices(html)

    assert len(notices) == 1
    assert notices[0].published_on is None


