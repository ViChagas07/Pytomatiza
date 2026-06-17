"""OCR router — file upload + text extraction + health check."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from pytomatiza.application.dtos.ocr_dtos import OCRHealthResponse, OCRResponse
from pytomatiza.application.services.ocr import OCRService
from pytomatiza.config import settings
from pytomatiza.domain.entities.user import User
from pytomatiza.domain.services.ocr.exceptions import (
    OCRError,
    OCRProcessingError,
    OCRUnsupportedFormat,
)
from pytomatiza.domain.services.ocr.models import OCRHealth
from pytomatiza.entrypoints.api.deps import get_current_user
from pytomatiza.infrastructure.monitoring.prometheus_setup import (
    OCR_FAILURES_TOTAL,
    OCR_PAGES_PROCESSED,
    OCR_PROCESSING_SECONDS,
    OCR_PROVIDER_USAGE,
    OCR_REQUESTS_TOTAL,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_ocr_service() -> OCRService:
    """Dependency: provides a fresh OCRService instance."""
    return OCRService()


@router.post("/ocr", response_model=OCRResponse, status_code=status.HTTP_200_OK)
async def ocr_extract(
    file: Annotated[UploadFile, File(description="Image (PNG/JPG/WEBP/TIFF) or PDF")],
    language: Annotated[str, Form()] = "",
    extract: Annotated[bool, Form()] = True,
    current_user: Annotated[User, Depends(get_current_user)] = None,  # optional
    service: Annotated[OCRService, Depends(_get_ocr_service)] = None,
) -> OCRResponse:
    """Upload an image or PDF and extract text via OCR.

    - Supported formats: PNG, JPG, JPEG, WEBP, TIFF, PDF
    - Max file size: configured via ``OCR_MAX_FILE_SIZE_MB`` (default 10 MB)
    - Language defaults to ``por`` (Portuguese)
    """
    if not settings.OCR_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OCR is currently disabled.",
        )

    try:
        result = await service.process_upload(
            file,
            language=language or settings.OCR_LANGUAGE,
            extract=extract,
        )
    except OCRUnsupportedFormat as exc:
        _record_failure(file.filename or "unknown", "unsupported_format")
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(exc),
        ) from exc
    except OCRProcessingError as exc:
        _record_failure(file.filename or "unknown", "processing_error")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except OCRError as exc:
        _record_failure(file.filename or "unknown", "ocr_error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    # ── Record success metrics ──────────────────────────────────────
    _record_success(file.filename or "unknown", result)

    return OCRResponse(**result)


@router.get("/ocr/health", response_model=OCRHealthResponse)
async def ocr_health(
    service: Annotated[OCRService, Depends(_get_ocr_service)],
) -> OCRHealthResponse:
    """Check whether the configured OCR provider is operational."""
    try:
        health = await service.health_check()
    except Exception as exc:
        return OCRHealthResponse(
            provider=settings.OCR_PROVIDER,
            available=False,
            language=settings.OCR_LANGUAGE,
            details={"error": str(exc)},
        )
    return OCRHealthResponse(**health)


# ── Metric helpers ──────────────────────────────────────────────────


def _file_type(filename: str) -> str:
    ext = Path(filename).suffix.lower().lstrip(".")
    return ext if ext else "unknown"


def _record_success(filename: str, result: dict) -> None:
    provider = result.get("provider", settings.OCR_PROVIDER)
    language = result.get("language", settings.OCR_LANGUAGE)
    processing_time = result.get("processing_time", 0.0)
    page_count = len(result.get("pages", []))

    OCR_REQUESTS_TOTAL.labels(provider=provider, file_type=_file_type(filename)).inc()
    OCR_PROCESSING_SECONDS.labels(provider=provider).observe(processing_time)
    OCR_PAGES_PROCESSED.labels(provider=provider).inc(page_count)
    OCR_PROVIDER_USAGE.labels(provider=provider, language=language).inc()


def _record_failure(filename: str, reason: str) -> None:
    provider = settings.OCR_PROVIDER
    OCR_REQUESTS_TOTAL.labels(provider=provider, file_type=_file_type(filename)).inc()
    OCR_FAILURES_TOTAL.labels(provider=provider, reason=reason).inc()
