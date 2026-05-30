"""Async session factory — provides asyncpg-backed SQLAlchemy sessions.

Uses a connection pool with sensible defaults for production workloads.
Sessions are created per-request via FastAPI dependency injection.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession, create_async_engine

from pytomatiza.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.DB_ECHO,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db_session() -> AsyncSession:
    """Yield an async database session. Used by FastAPI DI."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            yield session
