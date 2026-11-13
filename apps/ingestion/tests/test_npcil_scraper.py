# ruff: noqa: E501  (HTML fixture copied from the live page)
import datetime as dt

from app.scrapers.npcil import NPCILScraper

# Shape of the live Opportunities table (Nov 2026): Date | Advertisement No. | Subject | Last date,
# with "Download Advertisement" / corrigendum / result links in the row.
HTML = """
<table>
<tr><th>Date</th><th>Advertisement No.</th><th>Subject</th><th>Last Date of Receipt</th></tr>
<tr><td>08.10.2026</td><td>NPCIL / HQ / HRM / ET / 2026 / 03</td>
    <td>Recruitment of Engineering Graduates in NPCIL Through Gate.</td><td>-</td>
    <td><a href="/WriteReadData/userfiles/file/Advt_ET_08102026_01.pdf">Download Advertisement</a>
        <a href="/WriteReadData/userfiles/file/Corr_ET_01.pdf">Download Corrigendum</a></td></tr>
<tr><td>20.08.2026</td><td>-</td><td>Fixed Term Appointment for the Post of GDMO</td><td>-</td>
    <td><a href="/WriteReadData/userfiles/file/Advt_20082026_01.pdf">Download   Advertisement</a>
        <a href="/WriteReadData/userfiles/file/Advt_20082026_01.pdf#page=2">Download Advertisement</a></td></tr>
<tr><td>01.06.2026</td><td>NPCIL / HQ / 02</td><td>Select list of candidates for Stipendiary Trainee</td><td>-</td>
    <td><a href="/WriteReadData/userfiles/file/Select_02.pdf">Download Advertisement</a></td></tr>
<tr><td>09.07.2026</td><td>NPCIL / KKNPP / 01</td><td>Opening date postponed</td><td>-</td>
    <td><a href="http://npcil.nic.in/WriteReadData/userfiles/file/insecure.pdf">Download Advertisement</a>
        <a href="https://example.com/offsite.pdf">Download Advertisement</a>
        <a href="/content/notice.aspx">Download Advertisement</a></td></tr>
</table>
"""


def test_finds_main_advertisements_with_title_and_date():
    notices = NPCILScraper().find_notices(HTML)

    assert [n.url for n in notices] == [
        "https://npcil.nic.in/WriteReadData/userfiles/file/Advt_ET_08102026_01.pdf",
        "https://npcil.nic.in/WriteReadData/userfiles/file/Advt_20082026_01.pdf",
    ]
    assert notices[0].title == (
        "NPCIL / HQ / HRM / ET / 2026 / 03 - Recruitment of Engineering Graduates in NPCIL Through Gate."
    )
    assert notices[0].published_on == dt.date(2026, 10, 8)
    # No advertisement number ("-") → subject only.
    assert notices[1].title == "Fixed Term Appointment for the Post of GDMO"


def test_skips_corrigenda_results_duplicates_insecure_offsite_and_non_pdf():
    urls = [n.url for n in NPCILScraper().find_notices(HTML)]
    assert not any("Corr_" in u or "Select_" in u for u in urls)
    assert len(urls) == len(set(urls))  # #page=2 copy collapsed
    assert not any(
        u.startswith("http://") or "example.com" in u or u.endswith(".aspx") for u in urls
    )


def test_date_formats():
    assert NPCILScraper._published_date("08.10.2026") == dt.date(2026, 10, 8)
    assert NPCILScraper._published_date("08/10/2026") == dt.date(2026, 10, 8)
    assert NPCILScraper._published_date("not a date") is None
