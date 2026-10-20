
"""Database connection for the internal ingestion service."""

from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection, Engine

from app.config import settings

_engine: Engine | None = None


def get_engine() -> Engine:
    """Create the database engine lazily."""
    global _engine

    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not configured")

    if _engine is None:
        database_url = settings.database_url

        # SQLAlchemy uses the postgresql+psycopg dialect for psycopg 3.
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace(
                "postgresql://", "postgresql+psycopg://", 1
            )

        _engine = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_size=1,
            max_overflow=0,
        )

    return _engine


def get_connection() -> Generator[Connection, None, None]:
    """Yield a connection for a transaction."""
    with get_engine().begin() as connection:
        yield connection


def check_database_connection() -> bool:
    """Check whether PostgreSQL is reachable."""
    with get_engine().connect() as connection:
        return connection.execute(text("SELECT 1")).scalar_one() == 1
