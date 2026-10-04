"""All settings come from environment variables (.env locally). Never hard-code secrets."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase Postgres (same database as the core API; we only write DRAFT rows)
    database_url: str = ""

    # Shared secret: only the NestJS API / admin jobs may call this service
    internal_service_token: str = ""

    # Supabase Storage (for downloaded notification PDFs)
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    storage_bucket: str = "notifications"

    # AI extraction
    llm_api_key: str = ""

    # Polite crawling
    user_agent: str = "ApplyFieldsBot/0.1 (+https://applyfields.in/bot)"
    crawl_delay_seconds: float = 5.0


settings = Settings()
