"""All settings come from environment variables (.env locally). Never hard-code secrets."""



from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase Postgres (same database as the core API; we only write DRAFT rows)
    database_url: str = ""

    # Shared secret: only the NestJS API / admin jobs may call this service
    internal_service_token: str = ""

    # AI extraction (Groq). PDFs are read in memory and never stored — only text + JSON are kept.
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    # Max PDF characters sent per document (~4 chars per token). Keeps one request under
    # Groq's free-tier tokens-per-minute cap; the key facts sit in the first pages.
    extract_max_chars: int = 16000

    # Polite crawling
    user_agent: str = "ApplyFieldsBot/0.1 (+https://applyfields.com/bot)"
    crawl_delay_seconds: float = 5.0
    # Newest N documents per run. Bounds one HTTP request (each PDF = one polite fetch) and the
    # review queue on a source's first run; the rest are older notices.
    max_notices_per_run: int = 15


settings = Settings()
