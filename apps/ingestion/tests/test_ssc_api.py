from datetime import date
from unittest.mock import Mock, patch
from urllib.parse import parse_qs, urlparse

import pytest

from app.scrapers.ssc import SSCScraper


def api_response(records):
    response = Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = {
        "statusCode": "200",
        "data": records,
    }
    return response


@patch("app.scrapers.ssc.fetch")
def test_discovers_pdf_notice_and_publication_date(mock_get):
    mock_get.return_value = api_response([
        {
            "headline": "Recruitment Notification",
            "createdAt": "2026-10-12T13:17:07.360Z",
            "attachments": [
                {
                    "path": r"uploads\\masterData\\NoticeBoards\\notice.pdf",
                    "fileName": "notice.pdf",
                }
            ],
        }
    ])

    notices = SSCScraper().discover_notices()

    assert len(notices) == 1
    assert notices[0].title == "Recruitment Notification"
    assert notices[0].url == (
        "https://ssc.gov.in/api/attachment/"
        "uploads/masterData/NoticeBoards/notice.pdf"
    )
    assert notices[0].published_on == date(2026, 10, 12)
    mock_get.assert_called_once()


@patch("app.scrapers.ssc.fetch")
def test_skips_non_pdf_and_duplicate_attachments(mock_get):
    mock_get.return_value = api_response([
        {
            "headline": "Notice A",
            "createdAt": "2026-10-12T00:00:00Z",
            "attachments": [
                {"path": "uploads/notice.pdf"},
                {"path": "uploads/notice.pdf"},
                {"path": "uploads/readme.html"},
            ],
        }
    ])

    notices = SSCScraper().discover_notices()

    assert len(notices) == 1
    assert notices[0].url.endswith("/uploads/notice.pdf")


@patch("app.scrapers.ssc.fetch")
def test_rejects_unsuccessful_api_status(mock_get):
    response = Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = {
        "statusCode": "203",
        "statusMessage": "Error Occurred!",
    }
    mock_get.return_value = response

    with pytest.raises(ValueError, match="unsuccessful status"):
        SSCScraper().discover_notices()


@patch("app.scrapers.ssc.fetch")
def test_rejects_unexpected_api_data_structure(mock_get):
    mock_get.return_value = api_response({"unexpected": "object"})

    with pytest.raises(ValueError, match="Unexpected SSC API response"):
        SSCScraper().discover_notices()

@patch("app.scrapers.ssc.fetch")
def test_fetches_next_page_when_current_page_is_full(mock_get):
    first_page = [
        {
            "headline": f"Notice {i}",
            "createdAt": "2026-10-12T00:00:00Z",
            "attachments": [{"path": f"uploads/notice{i}.pdf"}],
        }
        for i in range(10)
    ]
    second_page = [
        {
            "headline": "Notice 10",
            "createdAt": "2026-10-11T00:00:00Z",
            "attachments": [{"path": "uploads/notice10.pdf"}],
        }
    ]

    mock_get.side_effect = [
        api_response(first_page),
        api_response(second_page),
    ]

    notices = SSCScraper().discover_notices()

    assert len(notices) == 11
    assert mock_get.call_count == 2
    first_url = mock_get.call_args_list[0].args[0]
    second_url = mock_get.call_args_list[1].args[0]

    assert parse_qs(urlparse(first_url).query)["page"] == ["1"]
    assert parse_qs(urlparse(second_url).query)["page"] == ["2"]