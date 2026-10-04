from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_scrape_requires_internal_token() -> None:
    response = client.post("/scrape/ssc")
    assert response.status_code == 401
