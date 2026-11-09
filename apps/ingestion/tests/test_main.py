
from unittest.mock import patch

from fastapi.testclient import TestClient # type: ignore

from app.main import app

client = TestClient(app)

SSC_ORGANIZATION_ID = "db0e0c5c-38a8-45d6-b0ba-9ce16047c836"


def mock_source() -> dict:
    return {
        "id": "source-test",
        "key": "ssc",
        "name": "Staff Selection Commission",
        "organization_id": SSC_ORGANIZATION_ID,
        "list_url": "https://ssc.gov.in/",
        "kind": "html",
        "interval_hours": 6,
    }


def mock_notice(title: str, url: str):
    from app.scrapers.base import NoticeLink

    return NoticeLink(title=title, url=url)


def test_scrape_rejects_invalid_token() -> None:
    response = client.post(
        "/scrape/ssc",
        headers={"X-Internal-Token": "invalid-token"},
    )

    assert response.status_code == 401


def test_scrape_rejects_source_without_organization() -> None:
    source = mock_source()
    source["organization_id"] = None

    with (
        patch("app.main.settings.internal_service_token", "test-token"),
        patch("app.main.get_active_source", return_value=source),
        patch("app.main.start_scrape_run") as start_mock,
    ):
        response = client.post(
            "/scrape/ssc",
            headers={"X-Internal-Token": "test-token"},
        )

    assert response.status_code == 409
    assert "no organization mapping" in response.json()["detail"]
    start_mock.assert_not_called()


def test_scrape_skips_non_pdf_links() -> None:
    notices = [
        mock_notice("About SSC", "https://ssc.gov.in/about"),
    ]

    with (
        patch("app.main.settings.internal_service_token", "test-token"),
        patch("app.main.get_active_source", return_value=mock_source()),
        patch("app.main.start_scrape_run", return_value="run-test"),
        patch("app.main.fetch") as fetch_mock,
        patch("app.main.SSCScraper.discover_notices", return_value=notices),
        patch("app.main.finish_scrape_run") as finish_mock,
    ):
        fetch_mock.return_value.text = "<html></html>"

        response = client.post(
            "/scrape/ssc",
            headers={"X-Internal-Token": "test-token"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["items_found"] == 1
    assert body["new_items"] == 0
    assert body["skipped_non_pdf"] == 1
    assert body["notices"][0]["status"] == "skipped_non_pdf"
    finish_mock.assert_called_once()


def test_scrape_counts_new_pdf() -> None:
    notices = [
        mock_notice(
            "Recruitment Notification",
            "https://ssc.gov.in/files/notice.pdf",
        ),
    ]

    with (
        patch("app.main.settings.internal_service_token", "test-token"),
        patch("app.main.get_active_source", return_value=mock_source()),
        patch("app.main.start_scrape_run", return_value="run-test"),
        patch("app.main.fetch") as fetch_mock,
        patch("app.main.SSCScraper.discover_notices", return_value=notices),
        patch(
            "app.main.process_pdf_notice",
            return_value={
                "url": notices[0].url,
                "title": notices[0].title,
                "content_hash": "a" * 64,
                "inserted": True,
                "status": "saved",
            },
        ) as process_mock,
        patch("app.main.finish_scrape_run") as finish_mock,
    ):
        fetch_mock.return_value.text = "<html></html>"

        response = client.post(
            "/scrape/ssc",
            headers={"X-Internal-Token": "test-token"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["new_items"] == 1
    assert body["duplicates"] == 0
    assert body["failed_items"] == 0
    process_mock.assert_called_once()
    assert finish_mock.call_args.kwargs["new_items"] == 1


def test_scrape_counts_duplicate_pdf() -> None:
    notices = [
        mock_notice(
            "Existing Notice",
            "https://ssc.gov.in/files/existing.pdf",
        ),
    ]

    with (
        patch("app.main.settings.internal_service_token", "test-token"),
        patch("app.main.get_active_source", return_value=mock_source()),
        patch("app.main.start_scrape_run", return_value="run-test"),
        patch("app.main.fetch") as fetch_mock,
        patch("app.main.SSCScraper.discover_notices", return_value=notices),
        patch(
            "app.main.process_pdf_notice",
            return_value={
                "url": notices[0].url,
                "title": notices[0].title,
                "content_hash": "b" * 64,
                "inserted": False,
                "status": "duplicate",
            },
        ),
        patch("app.main.finish_scrape_run"),
    ):
        fetch_mock.return_value.text = "<html></html>"

        response = client.post(
            "/scrape/ssc",
            headers={"X-Internal-Token": "test-token"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["new_items"] == 0
    assert body["duplicates"] == 1


def test_scrape_continues_when_one_pdf_fails() -> None:
    notices = [
        mock_notice("Broken PDF", "https://ssc.gov.in/files/broken.pdf"),
        mock_notice("Working PDF", "https://ssc.gov.in/files/working.pdf"),
    ]

    def process_notice(**kwargs):
        if "broken.pdf" in kwargs["url"]:
            raise ValueError("Invalid PDF")

        return {
            "url": kwargs["url"],
            "title": kwargs["title"],
            "content_hash": "c" * 64,
            "inserted": True,
            "status": "saved",
        }

    with (
        patch("app.main.settings.internal_service_token", "test-token"),
        patch("app.main.get_active_source", return_value=mock_source()),
        patch("app.main.start_scrape_run", return_value="run-test"),
        patch("app.main.fetch") as fetch_mock,
        patch("app.main.SSCScraper.discover_notices", return_value=notices),
        patch("app.main.process_pdf_notice", side_effect=process_notice),
        patch("app.main.finish_scrape_run") as finish_mock,
    ):
        fetch_mock.return_value.text = "<html></html>"

        response = client.post(
            "/scrape/ssc",
            headers={"X-Internal-Token": "test-token"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["items_found"] == 2
    assert body["new_items"] == 1
    assert body["failed_items"] == 1
    assert body["status"] == "partial"
    assert finish_mock.call_args.kwargs["status_value"] == "partial"

def test_isro_scrape_fetches_detail_page_and_processes_pdf():
    from app.scrapers.base import NoticeLink

    source = {
        **mock_source(),
        "key": "isro",
        "name": "Indian Space Research Organisation",
        "list_url": "https://www.isro.gov.in/Careers.html",
    }

    detail = NoticeLink(
        title="Recruitment to the post of Technical Assistant",
        url="https://www.isro.gov.in/ICRB_Recruitment11.html",
    )

    pdf = NoticeLink(
        title="Recruitment to the post of Technical Assistant",
        url="https://www.isro.gov.in/media/advertisement.pdf",
    )

    application_form = NoticeLink(
        title="Online Application Form",
        url="https://www.isro.gov.in/media/application_form.pdf",
    )

    shortlist = NoticeLink(
        title="Shortlisted Candidates",
        url="https://www.isro.gov.in/media/shortlisted_candidates.pdf",
    )

    with (
        patch("app.main.settings.internal_service_token", "test-token"),
        patch("app.main.get_active_source", return_value=source),
        patch("app.main.start_scrape_run", return_value="run-test"),
        patch("app.main.fetch") as fetch_mock,
        patch(
            "app.main.IsroScraper.find_notices",
            return_value=[detail],
        ),
        patch(
            "app.main.IsroScraper.find_pdf_notices",
            return_value=[pdf, application_form, shortlist],
        ) as pdf_mock,
        patch(
            "app.main.process_pdf_notice",
            return_value={
                "url": pdf.url,
                "title": pdf.title,
                "content_hash": "d" * 64,
                "inserted": True,
                "opportunity_id": "opportunity-test-id",
                "status": "draft_created",
            },
        ) as process_mock,
        patch(
            "app.main.update_opportunity_related_links",
        ) as related_links_mock,
        patch("app.main.finish_scrape_run") as finish_mock,
    ):
        fetch_mock.return_value.text = "<html></html>"

        response = client.post(
            "/scrape/isro",
            headers={"X-Internal-Token": "test-token"},
        )

    assert response.status_code == 200

    body = response.json()
    assert body["items_found"] == 1
    assert body["new_items"] == 1
    assert body["failed_items"] == 0

    assert fetch_mock.call_count == 2
    pdf_mock.assert_called_once()

    assert pdf_mock.call_args.kwargs["detail_url"] == detail.url

    process_mock.assert_called_once()
    assert process_mock.call_args.kwargs["url"] == pdf.url

    related_links_mock.assert_called_once_with(
        opportunity_id="opportunity-test-id",
        related_links=[
            {
                "title": "Online Application Form",
                "url": application_form.url,
                "category": "application_form",
            },
            {
                "title": "Shortlisted Candidates",
                "url": shortlist.url,
                "category": "shortlist",
            },
        ],
    )

    finish_mock.assert_called_once()

def test_isro_duplicate_scrape_updates_existing_opportunity_links():
    from app.scrapers.base import NoticeLink

    source = {
        **mock_source(),
        "key": "isro",
        "name": "Indian Space Research Organisation",
        "list_url": "https://www.isro.gov.in/Careers.html",
    }

    detail = NoticeLink(
        title="Recruitment to the post of Technical Assistant",
        url="https://www.isro.gov.in/ICRB_Recruitment11.html",
    )

    pdf = NoticeLink(
        title="Detailed Recruitment Advertisement",
        url="https://www.isro.gov.in/media/advertisement.pdf",
    )

    application_form = NoticeLink(
        title="Online Application Form",
        url="https://www.isro.gov.in/media/application_form.pdf",
    )

    with (
        patch("app.main.settings.internal_service_token", "test-token"),
        patch("app.main.get_active_source", return_value=source),
        patch("app.main.start_scrape_run", return_value="run-test"),
        patch("app.main.fetch") as fetch_mock,
        patch(
            "app.main.IsroScraper.find_notices",
            return_value=[detail],
        ),
        patch(
            "app.main.IsroScraper.find_pdf_notices",
            return_value=[pdf, application_form],
        ),
        patch(
            "app.main.process_pdf_notice",
            return_value={
                "url": pdf.url,
                "title": pdf.title,
                "content_hash": "d" * 64,
                "inserted": False,
                "opportunity_id": "existing-opportunity-id",
                "status": "duplicate",
            },
        ) as process_mock,
        patch(
            "app.main.update_opportunity_related_links",
        ) as related_links_mock,
        patch("app.main.finish_scrape_run") as finish_mock,
    ):
        fetch_mock.return_value.text = "<html></html>"

        response = client.post(
            "/scrape/isro",
            headers={"X-Internal-Token": "test-token"},
        )

    assert response.status_code == 200

    body = response.json()
    assert body["new_items"] == 0
    assert body["duplicates"] == 1
    assert body["failed_items"] == 0

    process_mock.assert_called_once()

    related_links_mock.assert_called_once_with(
        opportunity_id="existing-opportunity-id",
        related_links=[
            {
                "title": "Online Application Form",
                "url": application_form.url,
                "category": "application_form",
            }
        ],
    )

    finish_mock.assert_called_once()
def test_upsc_scrape_fetches_notifications_and_processes_pdfs():
    from app.scrapers.base import NoticeLink

    source = {
        **mock_source(),
        "key": "upsc",
        "name": "Union Public Service Commission",
        "list_url": "https://www.upsc.gov.in/examinations/active-exams",
    }

    notice = NoticeLink(
        title="Civil Services Examination Notification",
        url="https://upsc.gov.in/sites/default/files/notification.pdf",
    )

    with (
        patch("app.main.settings.internal_service_token", "test-token"),
        patch("app.main.get_active_source", return_value=source),
        patch("app.main.start_scrape_run", return_value="run-upsc-test"),
        patch("app.main.fetch") as fetch_mock,
        patch(
            "app.main.UPSCScraper.find_notices",
            return_value=[notice],
        ) as discover_mock,
        patch(
            "app.main.process_pdf_notice",
            return_value={
                "url": notice.url,
                "title": notice.title,
                "inserted": True,
                "status": "draft_created",
                "opportunity_id": "upsc-opportunity-test",
            },
        ) as process_mock,
        patch("app.main.finish_scrape_run") as finish_mock,
    ):
        fetch_mock.return_value.text = "<html>UPSC notifications</html>"

        response = client.post(
            "/scrape/upsc",
            headers={"X-Internal-Token": "test-token"},
        )

    assert response.status_code == 200

    body = response.json()
    assert body["source_key"] == "upsc"
    assert body["items_found"] == 1
    assert body["new_items"] == 1
    assert body["failed_items"] == 0

    fetch_mock.assert_called_once()
    discover_mock.assert_called_once_with("<html>UPSC notifications</html>")
    process_mock.assert_called_once()
    assert process_mock.call_args.kwargs["url"] == notice.url

    finish_mock.assert_called_once()