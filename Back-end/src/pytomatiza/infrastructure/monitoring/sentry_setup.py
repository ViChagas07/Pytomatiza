"""Sentry SDK initialization — integrated with FastAPI + SQLAlchemy.

Only active when SENTRY_DSN is configured in settings.
"""

from __future__ import annotations

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from pytomatiza.config import settings


def init_sentry() -> None:
    """Initialize Sentry error tracking if a DSN is configured."""
    if not settings.SENTRY_DSN:
        return
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.2,
        profiles_sample_rate=0.1,
        send_default_pii=True,
    )
