"""OCR DTOs — request/response schemas for OCR endpoints."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class OCRRequest(BaseModel):
    """Optional parameters to override defaults per request."""

    language: str = Field(default="", max_length=10)
    """Override OCR language (ISO 639‑3). Empty = use default."""
    extract: bool = True
    """Whether to run intelligent field extraction after OCR."""


class OCRPageResponse(BaseModel):
    page_number: int
    text: str
    confidence: float


class ExtractedFields(BaseModel):
    """Structured data extracted from OCR text via regex patterns."""

    cpf: str | None = None
    cnpj: str | None = None
    emails: list[str] = Field(default_factory=list)
    phones: list[str] = Field(default_factory=list)
    dates: list[str] = Field(default_factory=list)
    money_values: list[str] = Field(default_factory=list)
    urls: list[str] = Field(default_factory=list)
    license_plates: list[str] = Field(default_factory=list)
    codes: list[str] = Field(default_factory=list)


class OCRResponse(BaseModel):
    """Successful OCR result."""

    text: str
    pages: list[OCRPageResponse] = Field(default_factory=list)
    language: str
    processing_time: float
    confidence: float
    provider: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    extracted_fields: ExtractedFields | None = None


class OCRHealthResponse(BaseModel):
    """Health‑check response for the OCR provider."""

    provider: str
    available: bool
    language: str
    details: dict[str, Any] = Field(default_factory=dict)
