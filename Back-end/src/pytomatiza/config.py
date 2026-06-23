"""Pytomatiza+ Backend — Configuration via Pydantic Settings.

All secrets and environment-specific values are loaded from the `.env` file.
Never hard-code secrets — always reference `settings.*` attributes.
"""

from __future__ import annotations

from functools import lru_cache #lru_cache is used to cache the settings instance, ensuring that we only create it once per process. This is important for performance and consistency, as we don't want to read from the .env file multiple times or have different parts of the app using different settings instances.
from pathlib import Path
from typing import Any

from pydantic import field_validator, model_validator
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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 60

    # ── Token Encryption (AES-256-GCM) ──────────────────────────────────
    ENCRYPTION_KEY: str = ""
    """64-char hex string (32 bytes) for AES-256-GCM symmetric encryption
    of integration tokens at rest.  If empty a development-only derived key
    is used (with a loud warning)."""

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
        "https://www.googleapis.com/auth/drive.file"
    )
    GOOGLE_GMAIL_SCOPES: str = (
        "https://www.googleapis.com/auth/gmail.modify"
    )
    GOOGLE_PHOTOS_SCOPES: str = (
        "https://www.googleapis.com/auth/photoslibrary.readonly"
    )
    GOOGLE_CALENDAR_SCOPES: str = (
        "https://www.googleapis.com/auth/calendar"
    )
    GOOGLE_SHEETS_SCOPES: str = (
        "https://www.googleapis.com/auth/spreadsheets"
    )
    GOOGLE_MEET_SCOPES: str = (
        "https://www.googleapis.com/auth/calendar"
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

    # ── AI / LLM Provider ────────────────────────────────────────────────
    LLM_PROVIDER: str = "gemini"        # "gemini" | "ollama" | "openai"
    AI_TEMPERATURE: float = 0.1
    AI_MAX_TOKENS: int = 4096

    # ── Gemini ───────────────────────────────────────────────────────────
    GOOGLE_GEMINI_API_KEY: str = ""
    GOOGLE_GEMINI_MODEL: str = "gemini-2.5-flash"

    # ── Ollama ───────────────────────────────────────────────────────────
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    # ── OpenAI / LangChain (legacy) ──────────────────────────────────────
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

    # ── OCR ───────────────────────────────────────────────────────────────
    OCR_PROVIDER: str = "tesseract"
    """OCR engine: 'tesseract' | 'textract' | 'google_vision' | 'azure'."""
    OCR_LANGUAGE: str = "por"
    """Default OCR language (ISO 639-3). 'por' = Portuguese."""
    OCR_TIMEOUT: int = 30
    """Maximum seconds per page before the OCR call is aborted."""
    OCR_ENABLED: bool = True
    """Global kill‑switch for OCR endpoints."""
    OCR_TESSERACT_CMD: str = "tesseract"
    """Path or command name for the Tesseract binary."""
    OCR_PREPROCESSING_ENABLED: bool = True
    """Apply grayscale + contrast + denoise before OCR."""
    OCR_MAX_FILE_SIZE_MB: int = 10
    """Maximum file size accepted by OCR‑specific endpoints."""
    OCR_ALLOWED_EXTENSIONS: set[str] = {
        ".png", ".jpg", ".jpeg", ".webp", ".tiff", ".tif", ".pdf",
    }
    OCR_MAX_PAGES: int = 50
    """Maximum PDF pages to process in a single request."""
    
    # ── Integration Tokens ────────────────────────────────────────────────
    DISCORD_BOT_TOKEN: str = ""
    TELEGRAM_BOT_TOKEN: str = ""
    WHATSAPP_ACCESS_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    FACEBOOK_ACCESS_TOKEN: str = ""
    FACEBOOK_PAGE_ID: str = ""
    TRELLO_API_KEY: str = ""

    # ── OAuth Client Credentials ─────────────────────────────────────────
    # These identify OUR application to each provider's OAuth flow.
    # Per-user tokens are stored in the `integration_tokens` table.
    SLACK_CLIENT_ID: str = ""
    SLACK_CLIENT_SECRET: str = ""
    SLACK_SIGNING_SECRET: str = ""
    DISCORD_CLIENT_ID: str = ""
    DISCORD_CLIENT_SECRET: str = ""
    JIRA_CLIENT_ID: str = ""           # Atlassian OAuth 2.0 (3LO)
    JIRA_CLIENT_SECRET: str = ""       # Atlassian OAuth 2.0 (3LO)
    ZOOM_CLIENT_ID: str = ""
    ZOOM_CLIENT_SECRET: str = ""

    # ── Legacy Integration Tokens (being replaced by per-tenant OAuth) ───
    GOOGLE_MAPS_API_KEY: str = ""
    SLACK_BOT_TOKEN: str = ""
    ZOOM_ACCOUNT_ID: str = ""

    @model_validator(mode="before")
    @classmethod
    def _resolve_maps_api_key(cls, values: dict[str, object]) -> dict[str, object]:
        """Fallback: if GOOGLE_MAPS_API_KEY is empty, try NEXT_PUBLIC_GOOGLE_API_KEY."""
        if not values.get("GOOGLE_MAPS_API_KEY"):
            alt = values.get("NEXT_PUBLIC_GOOGLE_API_KEY")
            if alt:
                values["GOOGLE_MAPS_API_KEY"] = alt
        return values

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _ensure_async_driver(cls, v: Any) -> str:
        """Railway provides DATABASE_URL as 'postgresql://...' without the asyncpg
        driver suffix.  Automatically convert to 'postgresql+asyncpg://' so that
        create_async_engine does not fail."""
        if v is None:
            return ""
        if isinstance(v, str):
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
            return v
        return str(v)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, v: Any) -> list[str]:
        """Parse JSON array string from .env into a list of origin URLs."""
        if isinstance(v, str):
            import json
            try:
                parsed: list[Any] = json.loads(v)  # ← anota o retorno de json.loads
                return [str(item) for item in parsed]  # item é Any → str() aceita
            except (json.JSONDecodeError, TypeError):
                pass
            return [item.strip() for item in v.split(",") if item.strip()]
        if isinstance(v, (list, tuple)):
            return [str(item) for item in v]  # type: ignore[arg-type]
        return ["http://localhost:3000"]

    @field_validator("ALLOWED_UPLOAD_EXTENSIONS", mode="before")
    @classmethod
    def _parse_extensions(cls, v: Any) -> set[str]:
        """Parse a comma-separated string from env into a set of extensions."""
        if isinstance(v, str):
            return {ext.strip().lower() for ext in v.split(",") if ext.strip()}
        if isinstance(v, (list, tuple, set)):
            return {str(item) for item in list(v)}  # type: ignore[arg-type]
        return set()


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (singleton within the process)."""
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
