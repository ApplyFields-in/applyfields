import datetime as dt

from app.scrapers.cdsco import CDSCOScraper

# Shape of the live vacancy table (Nov 2026): S.No | Title | Release date | (blank) | Size,
# with the download link (a .jsp, not a .pdf) in the 4th cell.
DOWNLOAD = (
    "/opencms/opencms/system/modules/CDSCO.WEB/elements/download_file_division.jsp"
    "?num_id=MTQ1NTE="
)
HTML = f"""
<table>
<tr><td>1</td><td>Vacancy Notice for the position of Data Analyst</td><td>2026-Nov-09</td>
    <td><a href="{DOWNLOAD}">Download</a></td><td>222 KB</td></tr>
<tr><td>2</td><td>Result of interview for Data Analyst</td><td>2026-Nov-01</td>
    <td><a href="{DOWNLOAD}2">Download</a></td><td>90 KB</td></tr>
<tr><td>3</td><td>Old vacancy</td><td>2019-Jan-01</td>
    <td><a href="{DOWNLOAD}3">Download</a></td><td>90 KB</td></tr>
<tr><td>4</td><td>Advertisement elsewhere</td><td>2026-Oct-05</td>
    <td><a href="https://example.com/x.pdf">Download</a></td><td>1 MB</td></tr>
</table>
"""


def test_finds_jsp_download_links_and_skips_results_old_and_offsite():
    notices = CDSCOScraper().find_notices(HTML)

    assert len(notices) == 1
    assert notices[0].title == "Vacancy Notice for the position of Data Analyst"
    assert notices[0].url == "https://www.cdsco.gov.in" + DOWNLOAD
    assert notices[0].published_on == dt.date(2026, 11, 9)


def test_resolves_jsp_wrapper_to_the_real_pdf(monkeypatch):
    # Live response (Nov 2026): a tiny HTML page with the PDF in an iframe; names contain spaces.
    wrapper = (
        "<iframe src='/opencms/resources/UploadCDSCOWeb/2018/UploadVacancy/"
        "Vacancy Notice for Data Analytics Consultant in CDSCO(HQ.pdf' width='100%'></iframe>"
    )
    monkeypatch.setattr("app.scrapers.cdsco.fetch", lambda url: type("R", (), {"text": wrapper})())

    real = CDSCOScraper().resolve_document_url("https://www.cdsco.gov.in" + DOWNLOAD)

    assert real == (
        "https://www.cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2018/UploadVacancy/"
        "Vacancy%20Notice%20for%20Data%20Analytics%20Consultant%20in%20CDSCO%28HQ.pdf"
    )
    # Plain PDF links need no extra fetch.
    assert CDSCOScraper().resolve_document_url("https://cdsco.gov.in/a.pdf") == (
        "https://cdsco.gov.in/a.pdf"
    )


def test_refuses_an_offsite_iframe(monkeypatch):
    import pytest

    wrapper = "<iframe src='https://evil.example/x.pdf'></iframe>"
    monkeypatch.setattr("app.scrapers.cdsco.fetch", lambda url: type("R", (), {"text": wrapper})())
    with pytest.raises(ValueError, match="not an official PDF"):
        CDSCOScraper().resolve_document_url("https://www.cdsco.gov.in" + DOWNLOAD)


def test_document_urls():
    s = CDSCOScraper()
    assert s.is_document_url("https://www.cdsco.gov.in" + DOWNLOAD)
    assert s.is_document_url("https://cdsco.gov.in/opencms/files/advert.pdf")
    assert not s.is_document_url("https://www.cdsco.gov.in/opencms/en/Notifications/Vacancy/")
    assert not s.is_document_url("http://www.cdsco.gov.in" + DOWNLOAD)
