from app.scrapers.ssc import SSCScraper


def test_finds_notification_links_and_skips_duplicates() -> None:
    scraper = SSCScraper()

    html = """
    <html><body>
        <a href="/notice/notice1.pdf">Recruitment Notification</a>
        <a href="/notice/notice1.pdf">Recruitment Notification</a>
        <a href="/about">About Us</a>
    </body></html>
    """

    notices = scraper.find_notices(html)

    assert len(notices) == 1
    assert notices[0].title == "Recruitment Notification"
    assert notices[0].url == "https://ssc.gov.in/notice/notice1.pdf"
    assert notices[0].published_on is None