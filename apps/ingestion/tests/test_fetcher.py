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


def test_robots_4xx_means_no_rules_but_5xx_stops(monkeypatch):
    def respond(code):
        return lambda *a, **k: httpx.Response(
            code, request=httpx.Request("GET", "https://x.gov.in")
        )

    monkeypatch.setattr(httpx, "get", respond(403))
    assert is_allowed_by_robots("https://x.gov.in/page")

    monkeypatch.setattr(httpx, "get", respond(503))
    try:
        is_allowed_by_robots("https://x.gov.in/page")
        raise AssertionError("5xx robots.txt must not count as allowed")
    except httpx.HTTPStatusError:
        pass


def test_flaky_robots_is_retried_but_disallow_is_not(monkeypatch):
    calls = []

    def flaky(url):
        calls.append(1)
        if len(calls) == 1:
            raise httpx.ConnectError("tls blip")
        return True

    monkeypatch.setattr("app.fetcher.is_allowed_by_robots", flaky)
    monkeypatch.setattr("app.fetcher.time.sleep", lambda seconds: None)
    monkeypatch.setattr(
        httpx,
        "get",
        lambda *a, **k: httpx.Response(200, request=httpx.Request("GET", "https://x.gov.in")),
    )
    assert fetch("https://x.gov.in").status_code == 200
    assert len(calls) == 2

    calls.clear()
    monkeypatch.setattr("app.fetcher.is_allowed_by_robots", lambda url: calls.append(1) or False)
    try:
        fetch("https://x.gov.in")
        raise AssertionError("disallowed URL must not be fetched")
    except PermissionError:
        assert len(calls) == 1
