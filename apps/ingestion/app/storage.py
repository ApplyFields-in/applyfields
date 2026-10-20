
"""Upload notification PDFs to Supabase Storage."""

from urllib.parse import quote

import httpx

from app.config import settings


def upload_pdf(
    *,
    source_key: str,
    content_hash: str,
    content: bytes,
    mime_type: str = "application/pdf",
) -> str:
    """Upload a PDF and return its Storage object path."""

    if not settings.supabase_url:
        raise RuntimeError("SUPABASE_URL is not configured")

    if not settings.supabase_service_role_key:
        raise RuntimeError("Supabase service-role key is not configured")

    bucket = settings.storage_bucket
    object_path = f"{source_key}/{content_hash}.pdf"

    url = (
        f"{settings.supabase_url.rstrip('/')}/storage/v1/object/"
        f"{quote(bucket, safe='')}/{quote(object_path, safe='/')}"
    )

    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": mime_type,
        "x-upsert": "true",
    }

    with httpx.Client(timeout=30.0) as client:
        response = client.put(url, content=content, headers=headers)
        response.raise_for_status()

    return object_path
