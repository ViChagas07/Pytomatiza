"""OCR Provider Factory — instantiates the configured provider via settings."""

from __future__ import annotations

import logging

from pytomatiza.config import settings
from pytomatiza.domain.services.ocr.base import OCRProvider as OCRProviderProtocol
from pytomatiza.domain.services.ocr.exceptions import OCRProviderNotFound

logger = logging.getLogger(__name__)

# Lazy imports — providers are only loaded when requested
_PROVIDER_REGISTRY: dict[str, str] = {
    "tesseract": "pytomatiza.infrastructure.ocr.tesseract_provider.TesseractProvider",
    # Future:
    # "textract":       "pytomatiza.infrastructure.ocr.textract_provider.TextractProvider",
    # "google_vision":  "pytomatiza.infrastructure.ocr.google_vision_provider.GoogleVisionProvider",
    # "azure":          "pytomatiza.infrastructure.ocr.azure_provider.AzureOCRProvider",
}


def get_ocr_provider() -> OCRProviderProtocol:
    """Return the configured OCR provider as a singleton.

    The provider name is read from ``settings.OCR_PROVIDER``.
    Raises OCRProviderNotFound if the name is unknown.
    """
    return _get_or_create_provider(settings.OCR_PROVIDER)


# ── Internal cache ──────────────────────────────────────────────────

_provider_instance: OCRProviderProtocol | None = None
_provider_name: str | None = None


def _get_or_create_provider(name: str) -> OCRProviderProtocol:
    global _provider_instance, _provider_name

    if _provider_instance is not None and _provider_name == name:
        return _provider_instance

    import_path = _PROVIDER_REGISTRY.get(name)
    if import_path is None:
        raise OCRProviderNotFound(name)

    try:
        module_path, class_name = import_path.rsplit(".", 1)
        import importlib

        module = importlib.import_module(module_path)
        provider_cls = getattr(module, class_name)

        _provider_instance = provider_cls(
            tesseract_cmd=settings.OCR_TESSERACT_CMD,
            default_language=settings.OCR_LANGUAGE,
            timeout=settings.OCR_TIMEOUT,
            preprocessing_enabled=settings.OCR_PREPROCESSING_ENABLED,
        )
        _provider_name = name
        logger.info("OCR provider '%s' initialised", name)
        return _provider_instance

    except OCRProviderNotFound:
        raise
    except Exception as exc:
        raise OCRProviderNotFound(name) from exc


def reset_ocr_provider() -> None:
    """Clear the cached provider (useful for testing)."""
    global _provider_instance, _provider_name
    _provider_instance = None
    _provider_name = None
