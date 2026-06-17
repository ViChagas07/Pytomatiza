"""OCR application services."""

from pytomatiza.application.services.ocr.service import OCRService
from pytomatiza.application.services.ocr.factory import get_ocr_provider, reset_ocr_provider

__all__ = ["OCRService", "get_ocr_provider", "reset_ocr_provider"]
