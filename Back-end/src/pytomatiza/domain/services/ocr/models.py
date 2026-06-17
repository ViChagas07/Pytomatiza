"""OCR domain models — value objects for OCR results and metadata."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass(frozen=True)
class OCRPage:
    """Extracted text and metadata for a single page."""

    page_number: int
    text: str
    confidence: float  # 0.0 – 100.0
    width: int | None = None
    height: int | None = None


@dataclass(frozen=True)
class OCRResult:
    """Structured OCR extraction result returned by any provider."""

    text: str
    """Full concatenated text across all pages."""

    pages: list[OCRPage] = field(default_factory=list)
    """Per‑page breakdown (empty list = single image input)."""

    language: str = "por"
    """Detected / configured language (ISO 639‑3)."""

    processing_time: float = 0.0
    """Wall‑clock seconds spent on OCR (including preprocessing)."""

    confidence: float = 0.0
    """Average confidence across all pages (0‑100)."""

    provider: str = "tesseract"
    """Which OCR engine produced this result."""

    metadata: dict[str, object] = field(default_factory=dict)
    """Arbitrary provider‑specific metadata (raw Tesseract output, etc.)."""

    created_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    def __post_init__(self) -> None:
        """Compute average confidence from pages if not explicitly set."""
        if self.confidence == 0.0 and self.pages:
            avg = sum(p.confidence for p in self.pages) / len(self.pages)
            object.__setattr__(self, "confidence", round(avg, 2))


@dataclass(frozen=True)
class OCRHealth:
    """Health‑check status of an OCR provider."""

    provider: str
    available: bool
    language: str
    details: dict[str, object] = field(default_factory=dict)
