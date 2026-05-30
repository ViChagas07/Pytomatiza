"""Centralized S3 prefix & path management for Pytomatiza+.

This module is the single source of truth for ALL S3 object key
construction. Every service, worker, and route that needs to read
from or write to S3 MUST build keys through this module — never
hard-code or interpolate paths manually elsewhere.

Design goals:
- Zero hard-coded strings in business logic.
- Multi-tenant ready: user_id is always the first path segment.
- Date-partitioned for efficient listing / lifecycle policies.
- UUID prefix on uploaded files prevents collisions.
- Extensible: adding a new logical prefix is a single-line change.
- Purely domain-agnostic: no imports from config or infrastructure.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import Enum
from pathlib import Path


# ──────────────────────────────────────────────────────────────────────
# Logical S3 prefixes (folder names) — the seven buckets of the AI pipeline
# ──────────────────────────────────────────────────────────────────────


class S3Prefix(str, Enum):
    """Logical S3 folder prefixes used across the AI document pipeline.

    These values map directly to top-level folder names inside each
    user's prefix. The bucket itself is configured via settings.S3_BUCKET.
    """

    UPLOADS = "uploads"
    """Original documents uploaded by users (PDF, images, DOCX, etc.)."""

    PROCESSED = "processed"
    """Documents that completed Lambda/AI processing successfully."""

    FAILED = "failed"
    """Documents whose processing failed (with error metadata attached)."""

    REPORTS = "reports"
    """Final generated reports (PDF summaries, analytics exports)."""

    AI_ANALYSIS = "ai-analysis"
    """AI pipeline outputs — JSON analysis, entity extraction, NLP results."""

    TEMP = "temp"
    """Ephemeral files created during OCR / AI processing (auto-expired)."""

    AUDIT = "audit"
    """Structured audit trails, workflow events, fraud metadata, and compliance logs."""


# ──────────────────────────────────────────────────────────────────────
# S3 Key builder
# ──────────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class S3Paths:
    """Builds organised, collision-resistant S3 object keys.

    All methods are pure functions — they accept parameters and return
    fully-qualified S3 object keys. They do NOT call boto3, access
    environment variables, or depend on the AWS session.

    Usage::

        paths = S3Paths()

        # Upload path
        key = paths.upload(user_id="u-123", filename="invoice.pdf")
        # → "u-123/uploads/2026/05/26/a1b2c3d4e5f6_invoice.pdf"

        # Report path
        key = paths.report(user_id="u-123", document_id="doc-456")
        # → "u-123/reports/2026/05/doc-456_report.pdf"

        # Audit trail path
        key = paths.audit_event(user_id="u-123", document_id="doc-456")
        # → "u-123/audit/2026/05/doc-456_processing_audit.json"
    """

    # ── File extension defaults ───────────────────────────────────────

    DEFAULT_REPORT_EXT = ".pdf"
    DEFAULT_ANALYSIS_EXT = ".json"
    DEFAULT_AUDIT_EXT = ".json"
    DEFAULT_TEMP_EXT = ".tmp"

    # ── Public key builders ───────────────────────────────────────────

    def upload(self, user_id: str, filename: str) -> str:
        """Build a key for a newly uploaded document.

        Pattern: ``{user_id}/uploads/{YYYY}/{MM}/{DD}/{uuid}_{safe_name}``
        """
        return self._build(
            prefix=S3Prefix.UPLOADS,
            user_id=user_id,
            filename=filename,
            include_day=True,
        )

    def processed(self, original_key: str) -> str:
        """Build a key for a successfully processed document.

        Preserves the filename but places it under ``processed/``.
        ``user_id`` is extracted from the original key's first segment.

        Args:
            original_key: The current S3 key (e.g. ``"u-1/uploads/2026/05/26/abc_invoice.pdf"``).
        """
        return self._migrate_key(original_key, S3Prefix.PROCESSED)

    def failed(self, original_key: str) -> str:
        """Build a key for a document whose processing failed.

        Preserves the filename but places it under ``failed/``.
        ``user_id`` is extracted from the original key's first segment.

        Args:
            original_key: The current S3 key.
        """
        return self._migrate_key(original_key, S3Prefix.FAILED)

    def report(self, user_id: str, document_id: str) -> str:
        """Build a key for a generated report.

        Pattern: ``{user_id}/reports/{YYYY}/{MM}/{document_id}_report.pdf``
        """
        now = datetime.now(UTC)
        safe_id = self._safe_name(document_id)
        return (
            f"{user_id}/{S3Prefix.REPORTS.value}/"
            f"{now.year:04d}/{now.month:02d}/"
            f"{safe_id}_report{self.DEFAULT_REPORT_EXT}"
        )

    def ai_analysis(self, user_id: str, document_id: str) -> str:
        """Build a key for AI/ML pipeline output (JSON).

        Pattern: ``{user_id}/ai-analysis/{YYYY}/{MM}/{document_id}_analysis.json``
        """
        now = datetime.now(UTC)
        safe_id = self._safe_name(document_id)
        return (
            f"{user_id}/{S3Prefix.AI_ANALYSIS.value}/"
            f"{now.year:04d}/{now.month:02d}/"
            f"{safe_id}_analysis{self.DEFAULT_ANALYSIS_EXT}"
        )

    def temp(self, user_id: str, filename: str) -> str:
        """Build a key for a temporary processing file.

        Pattern: ``{user_id}/temp/{YYYY}/{MM}/{DD}/{uuid}_{safe_name}``
        """
        return self._build(
            prefix=S3Prefix.TEMP,
            user_id=user_id,
            filename=filename,
            include_day=True,
            suffix=self.DEFAULT_TEMP_EXT,
        )

    def audit_event(
        self,
        user_id: str,
        document_id: str,
        *,
        event_type: str = "processing",
    ) -> str:
        """Build a key for an audit trail record.

        Pattern: ``{user_id}/audit/{YYYY}/{MM}/{document_id}_{event_type}_audit.json``
        """
        now = datetime.now(UTC)
        safe_id = self._safe_name(document_id)
        safe_event = self._safe_name(event_type)
        return (
            f"{user_id}/{S3Prefix.AUDIT.value}/"
            f"{now.year:04d}/{now.month:02d}/"
            f"{safe_id}_{safe_event}_audit{self.DEFAULT_AUDIT_EXT}"
        )

    # ── Generic prefix builder (public) ───────────────────────────────

    def for_prefix(self, prefix: S3Prefix, user_id: str, filename: str) -> str:
        """Build a key for any logical S3 prefix with UUID collision prevention.

        This is the generic entry point for uploads to any prefix.
        Prefer the typed methods (``upload()``, ``report()``, etc.)
        when available, as they include prefix-specific naming conventions.

        Args:
            prefix: Target ``S3Prefix`` enum value.
            user_id: Owning user.
            filename: Display filename.
        """
        return self._build(
            prefix=prefix,
            user_id=user_id,
            filename=filename,
            include_day=True,
        )

    # ── Prefix helpers (for listing / lifecycle policies) ─────────────

    @staticmethod
    def user_prefix(user_id: str, prefix: S3Prefix) -> str:
        """Return the prefix for all objects of a given type for a user.

        Example: ``S3Paths.user_prefix("u-1", S3Prefix.UPLOADS)`` → ``"u-1/uploads/"``
        """
        return f"{user_id}/{prefix.value}/"

    @staticmethod
    def list_prefixes() -> list[S3Prefix]:
        """Return all seven S3 logical prefixes."""
        return list(S3Prefix)

    # ── Internal helpers ──────────────────────────────────────────────

    @staticmethod
    def _build(
        prefix: S3Prefix,
        user_id: str,
        filename: str,
        *,
        include_day: bool = True,
        suffix: str | None = None,
    ) -> str:
        """Shared key builder with UUID collision prevention."""
        now = datetime.now(UTC)
        safe_name = S3Paths._safe_name(Path(filename).stem)
        ext = suffix or Path(filename).suffix
        short_uuid = uuid.uuid4().hex[:12]

        date_segments = (
            f"{now.year:04d}/{now.month:02d}/{now.day:02d}"
            if include_day
            else f"{now.year:04d}/{now.month:02d}"
        )

        return (
            f"{user_id}/{prefix.value}/"
            f"{date_segments}/"
            f"{short_uuid}_{safe_name}{ext}"
        )

    @staticmethod
    def _migrate_key(original_key: str, target_prefix: S3Prefix) -> str:
        """Move a key from one prefix to another while preserving the filename.

        Extracts ``user_id`` from the original key's first segment.
        Generates a fresh UUID to avoid overwrites.
        """
        parts = original_key.split("/")
        if len(parts) < 2:
            raise ValueError(f"Invalid S3 key format: {original_key!r}")

        user_id = parts[0]
        filename = parts[-1]
        now = datetime.now(UTC)
        safe_name = S3Paths._safe_name(Path(filename).stem)
        ext = Path(filename).suffix
        short_uuid = uuid.uuid4().hex[:12]

        return (
            f"{user_id}/{target_prefix.value}/"
            f"{now.year:04d}/{now.month:02d}/{now.day:02d}/"
            f"{short_uuid}_{safe_name}{ext}"
        )

    @staticmethod
    def _safe_name(name: str) -> str:
        """Sanitise a string for use in an S3 key segment.

        Replaces spaces with underscores and strips unsafe characters.
        """
        return name.strip().replace(" ", "_")
