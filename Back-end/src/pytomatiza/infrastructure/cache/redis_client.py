"""Redis client — shared async Redis connection pool.
Provides a singleton Redis client and dependency injection helper.
"""
from __future__ import annotations

import redis.asyncio as aioredis

from pytomatiza.config import settings

# Explicit type with str generic — matches decode_responses=True
_redis_client: aioredis.Redis[str] | None = None


async def get_redis() -> aioredis.Redis[str]:
    """Return the shared Redis client instance, creating it on first call."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url( # type: ignore[misc]
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
    return _redis_client
