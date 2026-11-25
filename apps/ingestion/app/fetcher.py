"""Polite HTTP fetching with robots.txt enforcement and retry handling."""

import ssl
import time
import urllib.robotparser
from urllib.parse import urlparse

import httpx
import truststore

from app.config import settings

_ssl_context = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)


def is_allowed_by_robots(url: str) -> bool:
    """Check whether the configured crawler may fetch a URL."""
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"

    response = httpx.get(
        robots_url,
        headers={"User-Agent": settings.user_agent},
        verify=_ssl_context,
        timeout=10.0,
        follow_redirects=True,  # sbi.co.in → sbi.bank.in, TGPSC 302s its robots.txt
    )

    # RFC 9309: a 4xx robots.txt means "no rules"; a 5xx still stops us (raise below).
    if 400 <= response.status_code < 500:
        return True

    response.raise_for_status()

    parser = urllib.robotparser.RobotFileParser()
    parser.parse(response.text.splitlines())

    return parser.can_fetch(settings.user_agent, url)


def fetch(url: str) -> httpx.Response:
    """Fetch a URL after checking robots.txt, with retries and crawl delay."""
    headers = {"User-Agent": settings.user_agent}

    for attempt in range(4):
        if attempt > 0:
            time.sleep(2 ** (attempt - 1))

        try:
            # Inside the retry: a flaky TLS handshake on robots.txt (IBPS) is retried too.
            # PermissionError is not an httpx error, so a real "disallow" stops at once.
            if not is_allowed_by_robots(url):
                raise PermissionError(f"robots.txt disallows fetching: {url}")

            response = httpx.get(
                url,
                headers=headers,
                verify=_ssl_context,
                timeout=10.0,
                follow_redirects=True,
            )
            response.raise_for_status()

            # Apply the configured delay after a successful fetch.
            if settings.crawl_delay_seconds > 0:
                time.sleep(settings.crawl_delay_seconds)

            return response

        except httpx.HTTPError:
            if attempt == 3:
                raise

    raise RuntimeError("Fetch failed unexpectedly")
