"""OCR domain services — provider protocol, models, exceptions."""

from pytomatiza.domain.services.ocr.base import OCRProvider
from pytomatiza.domain.services.ocr.models import OCRHealth, OCRPage, OCRResult
from pytomatiza.domain.services.ocr.exceptions import (
    OCRError,
    OCRHealthError,
    OCRProcessingError,
    OCRProviderNotFound,
    OCRTimeout,
    OCRUnsupportedFormat,
)

__all__ = [
    "OCRProvider",
    "OCRHealth",
    "OCRPage",
    "OCRResult",
    "OCRError",
    "OCRHealthError",
    "OCRProcessingError",
    "OCRProviderNotFound",
    "OCRTimeout",
    "OCRUnsupportedFormat",
]
