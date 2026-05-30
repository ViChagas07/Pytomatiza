"""Pytomatiza+ Backend — Configuration via Pydantic Settings.

All secrets and environment-specific values are loaded from the `.env` file.
Never hard-code secrets — always reference `settings.*` attributes.
"""

from __future__ import annotations

from functools import lru_cache #lru_cache is used to cache the settings instance, ensuring that we only create it once per process. This is important for performance and consistency, as we don't want to read from the .env file multiple times or have different parts of the app using different settings instances.
from pathlib import Path
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env path absolutely so the app works regardless of the CWD.
# config.py is at src/pytomatiza/config.py, .env is at Back-end/.env
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────
    ENVIRONMENT: str = "development"  # development | staging | production
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # ── Security / JWT ───────────────────────────────────────────────────
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 60

    # ── Database ─────────────────────────────────────────────────────────
    DATABASE_URL: str
    DB_ECHO: bool = False

    # ── Redis ────────────────────────────────────────────────────────────
    REDIS_URL: str

    # ── Google OAuth ─────────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""

    # ── Google API Scopes ──────────────────────────────────────────────────
    GOOGLE_DRIVE_SCOPES: str = (
        "https://www.googleapis.com/auth/drive.readonly"
    )
    GOOGLE_PHOTOS_SCOPES: str = (
        "https://www.googleapis.com/auth/photoslibrary.readonly"
    )
    # Base OIDC scopes used for authentication login
    GOOGLE_OIDC_SCOPES: str = "openid email profile"

    # ── Resend (email) ───────────────────────────────────────────────────
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "Pytomatiza+ <noreply@pytomatiza.com>"

    # ── Frontend ─────────────────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # ── Sentry ───────────────────────────────────────────────────────────
    SENTRY_DSN: str = ""

    # ── Grafana ──────────────────────────────────────────────────────────
    GRAFANA_ADMIN_USER: str = "admin"
    GRAFANA_ADMIN_PASSWORD: str = "change-me"

    # ── Rate Limiting ────────────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_AUTH_PER_MINUTE: int = 10

    # ── AI Agents ────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    CREWAI_MODEL: str = "gpt-4o"
    LANGCHAIN_TRACING_V2: bool = False

    # ── AWS Cloud Services ───────────────────────────────────────────────
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = ""
    LAMBDA_FUNCTION_NAME: str = ""
    AWS_SNS_TOPIC_ARN: str = ""

    # ── Upload Limits ────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 100
    ALLOWED_UPLOAD_EXTENSIONS: set[str] = {
        ".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp",
        ".doc", ".docx", ".txt", ".csv", ".xlsx",
    }

    @field_validator("ALLOWED_UPLOAD_EXTENSIONS", mode="before")
    @classmethod
    def _parse_extensions(cls, v: Any) -> set[str]:
            """Parse a comma-separated string from env into a set of extensions."""
            if isinstance(v, str):
                return {ext.strip().lower() for ext in v.split(",") if ext.strip()}
            if isinstance(v, (list, tuple, set)):
                items: list[Any] = list(v)  # type: ignore[arg-type]
                return {str(item) for item in items}
            return set()


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (singleton within the process)."""
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
