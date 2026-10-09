import httpx

from app.fetcher import fetch, is_allowed_by_robots


def test_fetch_returns_response():
    response = fetch("https://example.com")

    assert response.status_code == 200
    assert "Example Domain" in response.text


def test_robots_check_allows_example():
    assert is_allowed_by_robots("https://example.com/")


def test_fetch_retries_on_http_error(monkeypatch):
    calls = []

    def fake_get(*args, **kwargs):
        calls.append(1)

        if len(calls) < 4:
            raise httpx.ConnectError("temporary failure")

        return httpx.Response(200, request=httpx.Request("GET", "https://example.com"))

    monkeypatch.setattr(httpx, "get", fake_get)
    monkeypatch.setattr("app.fetcher.is_allowed_by_robots", lambda url: True)
    monkeypatch.setattr("app.fetcher.time.sleep", lambda seconds: None)

    response = fetch("https://example.com")

    assert response.status_code == 200
    assert len(calls) == 4