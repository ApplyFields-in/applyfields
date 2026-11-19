import datetime as dt
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient  # type: ignore
from pydantic import ValidationError

from app.main import app
from app.scrapers.generic import GenericPdfListScraper, first_date

LIST_URL = "https://psc.example.gov.in/notifications"

HTML = """
<table>
  <tr><td>12/10/2026</td>
      <td><a href="/uploads/notif/group2.pdf">Notification No. 5/2026 Group-II</a></td></tr>
  <tr><td><a href="/uploads/notif/group2.pdf">Duplicate link</a></td></tr>
  <tr><td><a href="/uploads/notif/results.pdf">Results of Group-I</a></td></tr>
  <tr><td><a href="/uploads/other/syllabus.pdf">Notification syllabus</a></td></tr>
  <tr><td><a href="/uploads/notif/page.html">Notification page</a></td></tr>
  <tr><td><a href="https://evil.example.com/uploads/notif/x.pdf">Notification off-site</a></td></tr>
</table>
<a href="https://cdn.example.gov.in/uploads/notif/AE.PDF">Advertisement dt. 03-11-2026 AE posts</a>
"""


def scraper(**config) -> GenericPdfListScraper:
    return GenericPdfListScraper("tgpsc", LIST_URL, config)


def test_filters_by_host_path_and_title_words() -> None:
    notices = scraper(
        hosts=["psc.example.gov.in", "cdn.example.gov.in"],
        path_contains="/uploads/notif/",
        title_words=["notification", "advertisement"],
    ).find_notices(HTML)

    assert [(n.url, n.published_on) for n in notices] == [
        (
            "https://psc.example.gov.in/uploads/notif/group2.pdf",
            dt.date(2026, 10, 12),
        ),  # date from its row
        (
            "https://cdn.example.gov.in/uploads/notif/AE.PDF",
            dt.date(2026, 11, 3),
        ),  # date from its text
    ]


def test_empty_config_keeps_every_pdf_on_the_list_page_host() -> None:
    urls = [n.url for n in scraper().find_notices(HTML)]

    assert urls == [
        "https://psc.example.gov.in/uploads/notif/group2.pdf",
        "https://psc.example.gov.in/uploads/notif/results.pdf",
        "https://psc.example.gov.in/uploads/other/syllabus.pdf",
    ]


def test_bad_config_is_rejected() -> None:
    with pytest.raises(ValidationError):
        scraper(title_word=["typo"])  # misspelt key
    with pytest.raises(ValidationError):
        scraper(category="jobs")  # not an opportunity_category value


def test_first_date_skips_impossible_dates() -> None:
    assert first_date("No. 31/45/2026 dated 05.01.2026") == dt.date(2026, 1, 5)
    assert first_date("no date") is None


# --- routing in main.py ---------------------------------------------------------------------------

client = TestClient(app)


def source(config) -> dict:
    return {
        "id": "source-test",
        "key": "tgpsc",
        "name": "TGPSC",
        "organization_id": "db0e0c5c-38a8-45d6-b0ba-9ce16047c836",
        "list_url": LIST_URL,
        "kind": "html",
        "interval_hours": 6,
        "config": config,
    }


def post(src: dict):
    with (
        patch("app.main.settings.internal_service_token", "test-token"),
        patch("app.main.get_active_source", return_value=src),
        patch("app.main.start_scrape_run", return_value="run-test"),
        patch("app.main.fetch") as fetch_mock,
        patch(
            "app.main.process_pdf_notice",
            return_value={"inserted": True, "status": "saved"},
        ) as process_mock,
        patch("app.main.finish_scrape_run"),
    ):
        fetch_mock.return_value.text = HTML
        response = client.post("/scrape/tgpsc", headers={"X-Internal-Token": "test-token"})
    return response, process_mock


def test_source_with_config_uses_generic_scraper_and_its_category() -> None:
    response, process_mock = post(
        source(
            {
                "path_contains": "/uploads/notif/",
                "title_words": ["group-ii"],
                "category": "state_govt",
            }
        )
    )

    assert response.status_code == 200
    assert response.json()["new_items"] == 1
    assert process_mock.call_args.kwargs["category"] == "state_govt"
    assert process_mock.call_args.kwargs["url"].endswith("/group2.pdf")


def test_source_without_scraper_or_config_is_unknown() -> None:
    response, _ = post(source(None))
    assert response.status_code == 404


def test_invalid_config_is_a_409() -> None:
    response, _ = post(source({"hostz": []}))
    assert response.status_code == 409
    assert "invalid config" in response.json()["detail"]


def test_skip_words_and_limit() -> None:
    urls = [n.url for n in scraper(skip_words=["results"], limit=2).find_notices(HTML)]

    assert urls == [
        "https://psc.example.gov.in/uploads/notif/group2.pdf",
        "https://psc.example.gov.in/uploads/other/syllabus.pdf",
    ]
