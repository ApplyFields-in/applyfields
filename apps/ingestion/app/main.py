"""
ApplyFields ingestion service (INTERNAL ONLY).
The website never calls this. Only the NestJS API / scheduled jobs do, using the internal token.
Run locally:  uv run uvicorn app.main:app --reload --port 8000
"""

import secrets

from fastapi import Depends, FastAPI, Header, HTTPException, status

from app.config import settings

app = FastAPI(title="ApplyFields Ingestion (internal)", version="0.1.0")


def require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    expected = settings.internal_service_token
    if (
        not expected
        or not x_internal_token
        or not secrets.compare_digest(x_internal_token, expected)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal token"
        )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/scrape/{source_key}", dependencies=[Depends(require_internal_token)])
def run_scraper(source_key: str) -> dict[str, str]:
    # TODO(Harsha): look up the scraper for source_key, run it, save drafts
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=f"Scraper '{source_key}' not built yet"
    )
