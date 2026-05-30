"""Health router — liveness and readiness probes for Kubernetes/Docker.

Also returns DB and Redis connectivity status.
"""
from __future__ import annotations

import sqlalchemy

from fastapi import APIRouter

from pytomatiza.infrastructure.cache.redis_client import get_redis
from pytomatiza.infrastructure.db.session import engine

router = APIRouter()


@router.get("", response_model=None)
async def health_check() -> dict[str, str]:
    """Liveness + readiness probe.

    Returns 200 if the API process is running. Checks DB and Redis connectivity
    for the readiness signal.
    """
    db_healthy = True
    redis_healthy = True

    try:
        async with engine.connect() as conn:
            await conn.execute(sqlalchemy.text("SELECT 1"))
    except Exception:
        db_healthy = False

    try:
        redis = await get_redis()
        await redis.ping()
    except Exception:
        redis_healthy = False

    overall = db_healthy and redis_healthy

    return {
        "status": "ok" if overall else "degraded",
        "database": "connected" if db_healthy else "unavailable",
        "redis": "connected" if redis_healthy else "unavailable",
    }