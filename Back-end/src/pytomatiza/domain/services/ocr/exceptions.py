"""OCR domain exceptions."""

from __future__ import annotations


class OCRError(Exception):
    """Base exception for all OCR‑related failures."""

    def __init__(self, message: str, *, provider: str = "unknown") -> None:
        super().__init__(message)
        self.provider = provider


class OCRProviderNotFound(OCRError):
    """The configured OCR provider could not be instantiated."""

    def __init__(self, provider_name: str) -> None:
        super().__init__(
            f"OCR provider '{provider_name}' is not registered.",
            provider=provider_name,
        )


class OCRProcessingError(OCRError):
    """The OCR engine failed to process the input (e.g. bad file, timeout)."""

    def __init__(self, message: str, *, provider: str = "unknown") -> None:
        super().__init__(message, provider=provider)


class OCRUnsupportedFormat(OCRError):
    """The input file format is not supported by the OCR provider."""

    def __init__(self, extension: str, *, provider: str = "unknown") -> None:
        super().__init__(
            f"File format '{extension}' is not supported for OCR.",
            provider=provider,
        )


class OCRTimeout(OCRError):
    """OCR processing exceeded the configured timeout."""

    def __init__(self, timeout_seconds: float, *, provider: str = "unknown") -> None:
        super().__init__(
            f"OCR processing timed out after {timeout_seconds:.0f}s.",
            provider=provider,
        )


class OCRHealthError(OCRError):
    """The OCR provider is not in a healthy state."""

    def __init__(self, message: str, *, provider: str = "unknown") -> None:
        super().__init__(message, provider=provider)
