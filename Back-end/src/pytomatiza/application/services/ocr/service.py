"""OCR Service — thin orchestration layer over the provider.

Responsible for:
- Selecting the provider via the factory
- Running OCR in a thread pool (CPU‑bound work)
- Enforcing file‑size / extension / page limits
- Extracting structured fields after OCR
"""

from __future__ import annotations

import asyncio
import logging
import os
import tempfile
from pathlib import Path
from typing import BinaryIO

from fastapi import UploadFile

from pytomatiza.config import settings
from pytomatiza.application.services.ocr.factory import get_ocr_provider
from pytomatiza.domain.services.ocr.base import OCRProvider
from pytomatiza.domain.services.ocr.exceptions import (
    OCRError,
    OCRProcessingError,
    OCRUnsupportedFormat,
)
from pytomatiza.domain.services.ocr.models import OCRResult
from pytomatiza.infrastructure.ocr.extraction import extract_structured

logger = logging.getLogger(__name__)

# ── File limits ────────────────────────────────────────────────────

_MAX_BYTES = settings.OCR_MAX_FILE_SIZE_MB * 1024 * 1024
_ALLOWED: set[str] = settings.OCR_ALLOWED_EXTENSIONS


class OCRService:
    """High‑level OCR service (Strategy‑pattern consumer)."""

    def __init__(self, provider: OCRProvider | None = None) -> None:
        self._provider = provider

    @property
    def provider(self) -> OCRProvider:
        if self._provider is None:
            self._provider = get_ocr_provider()
        return self._provider

    # ── Public API ──────────────────────────────────────────────────

    async def process_image(
        self,
        file_path: str,
        *,
        language: str = "",
        extract: bool = True,
    ) -> dict:
        """OCR a single image file and optionally extract structured fields."""
        result = await self._run_in_thread(
            self.provider.extract_text,
            image_path=file_path,
            language=language or settings.OCR_LANGUAGE,
            timeout=settings.OCR_TIMEOUT,
        )
        return self._enrich(result, extract)

    async def process_pdf(
        self,
        file_path: str,
        *,
        language: str = "",
        extract: bool = True,
    ) -> dict:
        """OCR a PDF file page‑by‑page and optionally extract fields."""
        result = await self._run_in_thread(
            self.provider.extract_from_pdf,
            pdf_path=file_path,
            language=language or settings.OCR_LANGUAGE,
            timeout=settings.OCR_TIMEOUT,
            max_pages=settings.OCR_MAX_PAGES,
        )
        return self._enrich(result, extract)

    async def process_upload(
        self,
        file: UploadFile,
        *,
        language: str = "",
        extract: bool = True,
    ) -> dict:
        """Accept an UploadFile, validate, save to temp, OCR, and clean up."""
        if not settings.OCR_ENABLED:
            raise OCRError("OCR is disabled (OCR_ENABLED=false).")

        # Validate extension
        if file.filename is None:
            raise OCRUnsupportedFormat("unknown")
        ext = Path(file.filename).suffix.lower()
        if ext not in _ALLOWED:
            raise OCRUnsupportedFormat(ext)

        # Save to temp file
        content = await file.read()
        if len(content) > _MAX_BYTES:
            raise OCRProcessingError(
                f"File exceeds maximum size of {settings.OCR_MAX_FILE_SIZE_MB} MB"
            )

        suffix = ext if ext else ".png"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            if suffix == ".pdf":
                return await self.process_pdf(tmp_path, language=language, extract=extract)
            else:
                return await self.process_image(tmp_path, language=language, extract=extract)
        finally:
            # Clean up temp file
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    async def health_check(self) -> dict:
        """Return provider health status."""
        health = await self._run_in_thread(self.provider.health_check)
        return {
            "provider": health.provider,
            "available": health.available,
            "language": health.language,
            "details": health.details,
        }

    # ── Internals ───────────────────────────────────────────────────

    @staticmethod
    async def _run_in_thread(func, **kwargs) -> OCRResult | object:
        """Run a CPU‑bound OCR call in a thread pool to keep the event loop free."""
        return await asyncio.to_thread(func, **kwargs)

    @staticmethod
    def _enrich(result: OCRResult, extract: bool) -> dict:
        base: dict = {
            "text": result.text,
            "pages": [
                {
                    "page_number": p.page_number,
                    "text": p.text,
                    "confidence": p.confidence,
                }
                for p in result.pages
            ],
            "language": result.language,
            "processing_time": result.processing_time,
            "confidence": result.confidence,
            "provider": result.provider,
            "metadata": result.metadata,
        }
        if extract and result.text:
            base["extracted_fields"] = extract_structured(result.text)
        return base
