"""Pytomatiza+ FastAPI application factory.

Wires together all Clean Architecture layers:
  Domain → Application → Infrastructure → Entrypeoints

Run with: uvicorn pytomatiza.main:app --reload
"""

from __future__ import annotations
from prometheus_fastapi_instrumentator import Instrumentator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pytomatiza.config import settings
from pytomatiza.domain.exceptions.base import DomainException
from pytomatiza.entrypoints.api.middleware import (
    RateLimitMiddleware,
    RequestIDMiddleware,
    TimingMiddleware,
    domain_exception_handler,
    generic_exception_handler,
)
from pytomatiza.entrypoints.api.routers import agents, auth, automations, dashboard, health, integrations, ocr_router, storage, workflows
from pytomatiza.entrypoints.websocket.ws_handler import ws_router
from pytomatiza.infrastructure.monitoring.sentry_setup import init_sentry


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    init_sentry()

    # Create database tables on startup (dev convenience).
    # For production, use Alembic migrations instead.
    from pytomatiza.infrastructure.db.base import Base
    from pytomatiza.infrastructure.db.session import engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield


def create_app() -> FastAPI:
    """Build and return a configured FastAPI application instance."""
    app = FastAPI(
        title="Pytomatiza+ API",
        version="1.0.0",
        description="Intelligent automation platform backend powered by Python AI agents",
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    # ── CORS ────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Custom middleware (order matters!) ────────────────────────────────
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(TimingMiddleware)
    app.add_middleware(RateLimitMiddleware)

    # ── Exception handlers ──────────────────────────────────────────────
    app.add_exception_handler(Exception, generic_exception_handler)
    app.add_exception_handler(DomainException, domain_exception_handler)  # type: ignore[arg-type]

    # ── Root health (convenience) ──────────────────────────────────────
    async def root() -> dict[str, str]:
        return {
            "service": "Pytomatiza+ API",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/api/v1/health",
        }

    app.add_api_route("/", root, include_in_schema=False)

    # ── Routers ─────────────────────────────────────────────────────────
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
    app.include_router(agents.router, prefix="/api/v1/agents", tags=["Agents"])
    app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["Workflows"])
    app.include_router(automations.router, prefix="/api/v1/automations", tags=["Automations"])
    app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
    app.include_router(health.router, prefix="/api/v1/health", tags=["Health"])
    app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["Integrations"])
    app.include_router(ocr_router.router, prefix="/api/v1", tags=["OCR"])
    if settings.S3_BUCKET:
        app.include_router(storage.router, prefix="/api/v1/storage", tags=["Storage"])
    app.include_router(ws_router)

    # ── Prometheus Instrumentator ───────────────────────────────────────
    Instrumentator().instrument(app).expose(app)
    return app
    
    

# Singleton for uvicorn execution
app = create_app()
