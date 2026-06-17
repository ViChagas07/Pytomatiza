"""OCR infrastructure — concrete providers and utilities."""

from pytomatiza.infrastructure.ocr.tesseract_provider import TesseractProvider
from pytomatiza.infrastructure.ocr.preprocessing import preprocess_image
from pytomatiza.infrastructure.ocr.extraction import extract_fields, extract_structured

__all__ = [
    "TesseractProvider",
    "preprocess_image",
    "extract_fields",
    "extract_structured",
]
