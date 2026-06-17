"""OCR Provider Protocol — structural contract for all OCR engines.

Implement this protocol to add a new OCR backend (e.g. Textract, Google Vision).
The OCRService uses this interface via the Strategy pattern so the engine can
be swapped without touching business logic.
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable

from pytomatiza.domain.services.ocr.models import OCRHealth, OCRResult


@runtime_checkable
class OCRProvider(Protocol):
    """Contract that every OCR engine must fulfil.

    All methods are **synchronous** because pytesseract and most OCR libs
    are CPU‑bound.  The caller (OCRService) wraps them in a thread pool
    to keep the async event loop free.
    """

    @property
    def provider_name(self) -> str:
        """Unique identifier for this provider (e.g. 'tesseract')."""
        ...

    def extract_text(
        self,
        image_path: str,
        *,
        language: str = "por",
        timeout: int = 30,
    ) -> OCRResult:
        """Extract text from a single image file.

        Args:
            image_path: Absolute path to the image file.
            language: ISO 639‑3 language code(s), e.g. ``"por"`` or ``"por+eng"``.
            timeout: Maximum seconds for this call.

        Returns:
            OCRResult with the extracted text and metadata.

        Raises:
            OCRProcessingError: If the engine cannot process the image.
            OCRTimeout: If processing exceeds *timeout*.
            OCRUnsupportedFormat: If the file format is not supported.
        """
        ...

    def extract_from_pdf(
        self,
        pdf_path: str,
        *,
        language: str = "por",
        timeout: int = 30,
        max_pages: int = 50,
    ) -> OCRResult:
        """Extract text from a PDF by rasterising pages then OCR.

        Args:
            pdf_path: Absolute path to the PDF file.
            language: ISO 639‑3 language code(s).
            timeout: Maximum seconds **per page**.
            max_pages: Maximum number of pages to process.

        Returns:
            OCRResult with concatenated text and per‑page breakdown.
        """
        ...

    def health_check(self) -> OCRHealth:
        """Verify that the provider is operational.

        Returns:
            OCRHealth indicating availability and any diagnostic details.
        """
        ...


# Convenience alias used by OCRService
OCRProviderType = OCRProvider
