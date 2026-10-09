import time
import urllib.robotparser
from urllib.parse import urlparse

import httpx

from app.config import settings


def is_allowed_by_robots(url: str) -> bool:
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"

    response = httpx.get(
        robots_url,
        headers={"User-Agent": settings.user_agent},
        timeout=10.0,
    )

    if response.status_code == 404:
        return True

    response.raise_for_status()

    parser = urllib.robotparser.RobotFileParser()
    parser.parse(response.text.splitlines())

    return parser.can_fetch(settings.user_agent, url)


def fetch(url: str) -> httpx.Response:
    if not is_allowed_by_robots(url):
        raise PermissionError(f"robots.txt disallows fetching: {url}")

    headers = {
        "User-Agent": settings.user_agent,
    }

    for attempt in range(4):
        if attempt > 0:
            time.sleep(settings.crawl_delay_seconds)

        try:
            response = httpx.get(
                url,
                headers=headers,
                timeout=10.0,
            )
            response.raise_for_status()
            return response
        except httpx.HTTPError:
            if attempt == 3:
                raise

            time.sleep(2**attempt)