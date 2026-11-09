import json
from unittest.mock import MagicMock, patch

from app.db.repository import update_opportunity_related_links


def test_saves_related_links_to_opportunity():
    related_links = [
        {
            "title": "Online Application Form",
            "url": "https://www.isro.gov.in/media/application_form.pdf",
            "category": "application_form",
        },
        {
            "title": "Shortlisted Candidates",
            "url": "https://www.isro.gov.in/media/shortlist.pdf",
            "category": "shortlist",
        },
    ]

    connection = MagicMock()
    connection.execute.return_value.scalar_one_or_none.return_value = "opp-1"

    engine = MagicMock()
    engine.begin.return_value.__enter__.return_value = connection

    with patch(
        "app.db.repository.get_engine",
        return_value=engine,
    ):
        update_opportunity_related_links(
            opportunity_id="opp-1",
            related_links=related_links,
        )

    engine.begin.assert_called_once()

    query, params = connection.execute.call_args.args

    assert "UPDATE opportunities" in str(query)
    assert params["opportunity_id"] == "opp-1"
    assert json.loads(params["related_links"]) == related_links


def test_raises_error_when_opportunity_does_not_exist():
    connection = MagicMock()
    connection.execute.return_value.scalar_one_or_none.return_value = None

    engine = MagicMock()
    engine.begin.return_value.__enter__.return_value = connection

    with patch(
        "app.db.repository.get_engine",
        return_value=engine,
    ):
        try:
            update_opportunity_related_links(
                opportunity_id="missing-id",
                related_links=[],
            )
            assert False, "Expected ValueError"
        except ValueError as exc:
            assert "Opportunity not found" in str(exc)