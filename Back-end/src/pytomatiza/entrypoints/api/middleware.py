"""FastAPI middleware — request ID, timing, rate limiting, and domain exception handling.

All middleware components are ASGI-compatible and chained in main.py.
"""

from __future__ import annotations

import time
import uuid
from collections.abc import Awaitable, Callable
from typing import Any, cast

import redis.asyncio as aioredis
from redis.asyncio.client import Pipeline
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from pytomatiza.config import settings
from pytomatiza.domain.exceptions.auth_exceptions import (
    AccountNotVerified,
    EmailAlreadyRegistered,
    InvalidCredentials,
)
from pytomatiza.domain.exceptions.base import (
    BusinessRuleViolation,
    DomainException,
    EntityNotFound,
    NotificationException,
    ProcessingException,
    StorageException,
)
from pytomatiza.infrastructure.cache.redis_client import get_redis
from pytomatiza.infrastructure.monitoring.prometheus_setup import (
    REQUEST_COUNT,
    REQUEST_LATENCY,
)

# ── Domain → HTTP status code mapping ───────────────────────────────────

EXCEPTION_MAP: dict[type[DomainException], int] = {
    EntityNotFound: 404,
    BusinessRuleViolation: 422,
    InvalidCredentials: 401,
    EmailAlreadyRegistered: 409,
    AccountNotVerified: 403,
    StorageException: 502,
    NotificationException: 502,
    ProcessingException: 502,
}


# ── Request ID Middleware ───────────────────────────────────────────────

class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a unique X-Request-ID header to every request/response pair."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


# ── Timing Middleware ───────────────────────────────────────────────────

class TimingMiddleware(BaseHTTPMiddleware):
    """Record request latency histograms and count totals for Prometheus."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        start = time.monotonic()
        response = await call_next(request)
        elapsed = time.monotonic() - start
        endpoint = request.url.path
        method = request.method
        status_code = str(response.status_code)
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
        REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(elapsed)
        return response


# ── Rate Limiting Middleware ────────────────────────────────────────────

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Sliding-window rate limiter backed by Redis.

    Uses sorted-set sliding-window algorithm per IP + endpoint.
    """

    _REDIS_KEY_PREFIX = "ratelimit:"

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        self._redis: aioredis.Redis[Any] | None = None

    async def _get_redis(self) -> aioredis.Redis[Any]:
        if self._redis is None:
            self._redis = await get_redis()
        return self._redis

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path

        limit = settings.RATE_LIMIT_PER_MINUTE
        if "/auth/" in path:
            limit = settings.RATE_LIMIT_AUTH_PER_MINUTE

        redis_conn = await self._get_redis()
        now = time.time()
        window = 60  # 1 minute sliding window
        key = f"{self._REDIS_KEY_PREFIX}{client_ip}:{path}"

        pipe = redis_conn.pipeline()
        pipe.zremrangebyscore(key, 0, now - window)
        pipe.zcard(key)
        pipe.zadd(key, {str(uuid.uuid4()): now})
        pipe.expire(key, window + 1)
        pipe: Pipeline[Any] = redis_conn.pipeline()
        pipe.zremrangebyscore(key, 0, now - window)
        pipe.zcard(key)
        pipe.zadd(key, {str(uuid.uuid4()): now})
        pipe.expire(key, window + 1)
        results = cast(list[Any], await pipe.execute()) # type: ignore[misc]
        _, count, *_ = results
        count = int(count)

        if count > limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down.", "type": "RateLimitExceeded"},
                headers={"Retry-After": str(window)},
            )

        return await call_next(request)


# ── Domain Exception Handler ────────────────────────────────────────────

async def domain_exception_handler(request: Request, exc: DomainException) -> JSONResponse:
    """Translate domain exceptions into HTTP JSON error responses.

    Registered as a FastAPI exception handler in main.py.
    """
    status_code = EXCEPTION_MAP.get(type(exc), 500)
    return JSONResponse(
        status_code=status_code,
        content={
            "detail": str(exc),
            "type": type(exc).__name__,
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler for unexpected exceptions."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred.",
            "type": type(exc).__name__,
        },
    )


# ── Security Headers Middleware ───────────────────────────────────────

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inject Content-Security-Policy and other security headers on every response."""

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https:; "
            "font-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        return response