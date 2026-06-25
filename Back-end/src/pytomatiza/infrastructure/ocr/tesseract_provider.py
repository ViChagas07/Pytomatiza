"""Tesseract OCR Provider — concrete implementation using pytesseract.

Handles both single images and multi‑page PDFs (via pdf2image).
Includes health‑check, configurable preprocessing, and timeout.
"""

from __future__ import annotations

import logging
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any

from pytomatiza.domain.services.ocr.base import OCRProvider
from pytomatiza.domain.services.ocr.exceptions import (
    OCRHealthError,
    OCRProcessingError,
    OCRTimeout,
    OCRUnsupportedFormat,
)
from pytomatiza.domain.services.ocr.models import OCRHealth, OCRPage, OCRResult
from pytomatiza.infrastructure.ocr.preprocessing import preprocess_image

logger = logging.getLogger(__name__)

# ── Supported extensions ───────────────────────────────────────────

_IMAGE_EXTENSIONS: frozenset[str] = frozenset(
    {".png", ".jpg", ".jpeg", ".webp", ".tiff", ".tif", ".bmp"}
)
_PDF_EXTENSION: str = ".pdf"


class TesseractProvider:
    """OCR engine backed by the system Tesseract binary."""

    def __init__(
        self,
        *,
        tesseract_cmd: str = "tesseract",
        default_language: str = "por",
        timeout: int = 30,
        preprocessing_enabled: bool = True,
    ) -> None:
        self._cmd = tesseract_cmd
        self._lang = default_language
        self._timeout = timeout
        self._preprocessing = preprocessing_enabled

    # ── OCRProvider protocol compliance ───────────────────────────

    @property
    def provider_name(self) -> str:
        return "tesseract"

    def extract_text(
        self,
        image_path: str,
        *,
        language: str = "",
        timeout: int = 0,
    ) -> OCRResult:
        lang = language or self._lang
        timeout_s = timeout or self._timeout

        path = Path(image_path)
        if not path.is_file():
            raise OCRProcessingError(f"File not found: {image_path}", provider=self.provider_name)

        ext = path.suffix.lower()
        if ext not in _IMAGE_EXTENSIONS:
            raise OCRUnsupportedFormat(ext, provider=self.provider_name)

        started = time.monotonic()

        # ── Optional preprocessing ────────────────────────────────
        input_path = str(path)
        if self._preprocessing:
            try:
                input_path = preprocess_image(path)
            except Exception as exc:
                logger.warning("Preprocessing failed, using original: %s", exc)

        # ── Run Tesseract ─────────────────────────────────────────
        try:
            import pytesseract

            if self._cmd:
                pytesseract.pytesseract.tesseract_cmd = self._cmd

            # Use pytesseract with timeout via the library's config
            raw: dict[str, Any] = pytesseract.image_to_data(
                input_path,
                lang=lang,
                output_type=pytesseract.Output.DICT,
                timeout=timeout_s,
            )
            text = pytesseract.image_to_string(
                input_path, lang=lang, timeout=timeout_s
            )
        except RuntimeError as exc:
            if "timeout" in str(exc).lower():
                raise OCRTimeout(timeout_s, provider=self.provider_name) from exc
            # TesseractError stores (status, message) in self.args.
            # A negative status means the process was killed by a signal (e.g. -9 = SIGKILL = OOM).
            exc_msg = str(exc)
            if hasattr(exc, "status") and isinstance(exc.status, int) and exc.status < 0:
                exc_msg = (
                    f"Tesseract foi encerrado pelo sistema (sinal {abs(exc.status)}). "
                    "O arquivo pode ser grande demais para a memória disponível."
                )
            raise OCRProcessingError(exc_msg, provider=self.provider_name) from exc
        except Exception as exc:
            raise OCRProcessingError(str(exc), provider=self.provider_name) from exc

        elapsed = time.monotonic() - started

        # ── Confidence extraction ──────────────────────────────────
        confidences = [
            int(c)
            for c in raw.get("conf", [])
            if isinstance(c, (int, float)) and c > 0
        ]
        avg_confidence = (
            round(sum(confidences) / len(confidences), 2) if confidences else 0.0
        )

        # ── Image dimensions ──────────────────────────────────────
        try:
            from PIL import Image

            with Image.open(path) as img:
                w, h = img.size
        except Exception:
            w, h = None, None

        return OCRResult(
            text=text.strip(),
            pages=[
                OCRPage(
                    page_number=1,
                    text=text.strip(),
                    confidence=avg_confidence,
                    width=w,
                    height=h,
                )
            ],
            language=lang,
            processing_time=round(elapsed, 3),
            confidence=avg_confidence,
            provider=self.provider_name,
            metadata={
                "raw_tesseract_keys": list(raw.keys()),
                "word_count": len(raw.get("text", [])),
                "preprocessing_applied": self._preprocessing,
            },
        )

    def extract_from_pdf(
        self,
        pdf_path: str,
        *,
        language: str = "",
        timeout: int = 0,
        max_pages: int = 50,
    ) -> OCRResult:
        lang = language or self._lang
        timeout_s = timeout or self._timeout

        path = Path(pdf_path)
        if not path.is_file():
            raise OCRProcessingError(f"File not found: {pdf_path}", provider=self.provider_name)

        if path.suffix.lower() != _PDF_EXTENSION:
            raise OCRUnsupportedFormat(path.suffix.lower(), provider=self.provider_name)

        started = time.monotonic()

        # ── Convert PDF pages to images ─────────────────────────────
        try:
            from pdf2image import convert_from_path

            images = convert_from_path(
                pdf_path,
                dpi=300,
                fmt="png",
                thread_count=os.cpu_count() or 2,
                first_page=1,
                last_page=max_pages,
            )
        except Exception as exc:
            raise OCRProcessingError(
                f"Failed to convert PDF to images: {exc}",
                provider=self.provider_name,
            ) from exc

        if not images:
            raise OCRProcessingError("PDF yielded no images", provider=self.provider_name)

        # ── OCR each page ──────────────────────────────────────────
        pages: list[OCRPage] = []
        all_text: list[str] = []

        with tempfile.TemporaryDirectory(prefix="ocr_pdf_") as tmpdir:
            for i, pil_image in enumerate(images, start=1):
                page_started = time.monotonic()
                img_path = os.path.join(tmpdir, f"page_{i:04d}.png")
                pil_image.save(img_path, "PNG")

                try:
                    result = self.extract_text(
                        img_path,
                        language=lang,
                        timeout=timeout_s,
                    )
                except OCRTimeout:
                    logger.warning("Page %d of %s timed out", i, path.name)
                    pages.append(
                        OCRPage(page_number=i, text="", confidence=0.0)
                    )
                    continue

                if result.pages:
                    p = result.pages[0]
                    pages.append(
                        OCRPage(
                            page_number=i,
                            text=p.text,
                            confidence=p.confidence,
                            width=p.width,
                            height=p.height,
                        )
                    )
                else:
                    pages.append(
                        OCRPage(page_number=i, text=result.text, confidence=result.confidence)
                    )

                all_text.append(result.text)
                logger.debug(
                    "Page %d/%d – %.1fs, confidence %.1f%%",
                    i,
                    len(images),
                    time.monotonic() - page_started,
                    pages[-1].confidence,
                )

        elapsed = time.monotonic() - started
        avg_conf = (
            round(sum(p.confidence for p in pages) / len(pages), 2)
            if pages
            else 0.0
        )

        return OCRResult(
            text="\n\n".join(all_text).strip(),
            pages=pages,
            language=lang,
            processing_time=round(elapsed, 3),
            confidence=avg_conf,
            provider=self.provider_name,
            metadata={
                "total_pages": len(images),
                "pages_processed": len(pages),
                "max_pages_limit": max_pages,
            },
        )

    def health_check(self) -> OCRHealth:
        details: dict[str, object] = {
            "tesseract_cmd": self._cmd,
            "language": self._lang,
            "preprocessing": self._preprocessing,
        }

        # 1. Is the binary available?
        tesseract_path = shutil.which(self._cmd)
        if tesseract_path is None:
            return OCRHealth(
                provider=self.provider_name,
                available=False,
                language=self._lang,
                details={**details, "error": "Tesseract binary not found in PATH"},
            )

        details["binary_path"] = tesseract_path

        # 2. Can we list available languages?
        try:
            result = subprocess.run(
                [self._cmd, "--list-langs"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if result.returncode != 0:
                return OCRHealth(
                    provider=self.provider_name,
                    available=False,
                    language=self._lang,
                    details={**details, "error": result.stderr.strip()},
                )
            available_langs = result.stdout.strip().splitlines()
            details["available_languages"] = available_langs

            # 3. Is the configured language available?
            lang_ok = self._lang in available_langs
            if not lang_ok:
                return OCRHealth(
                    provider=self.provider_name,
                    available=False,
                    language=self._lang,
                    details={
                        **details,
                        "error": f"Language '{self._lang}' not installed. Available: {available_langs}",
                    },
                )

        except subprocess.TimeoutExpired:
            return OCRHealth(
                provider=self.provider_name,
                available=False,
                language=self._lang,
                details={**details, "error": "Tesseract --list-langs timed out"},
            )
        except Exception as exc:
            return OCRHealth(
                provider=self.provider_name,
                available=False,
                language=self._lang,
                details={**details, "error": str(exc)},
            )

        # 4. pytesseract importable?
        try:
            import pytesseract  # noqa: F401
        except ImportError:
            return OCRHealth(
                provider=self.provider_name,
                available=False,
                language=self._lang,
                details={**details, "error": "pytesseract package not importable"},
            )

        return OCRHealth(
            provider=self.provider_name,
            available=True,
            language=self._lang,
            details=details,
        )
