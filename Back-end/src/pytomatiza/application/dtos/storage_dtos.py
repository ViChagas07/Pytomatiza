"""Storage DTOs — request/response schemas for file uploads, S3 operations,
AI pipeline stages, and audit trails.

These are Pydantic models used by the FastAPI layer for validation,
serialisation, and OpenAPI documentation generation.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


# ══════════════════════════════════════════════════════════════════════
# Response models
# ══════════════════════════════════════════════════════════════════════


class S3UploadResponse(BaseModel):
    """Returned after a successful file upload to S3."""

    bucket: str = Field(..., description="S3 bucket name.")
    key: str = Field(..., description="S3 object key (path).")
    s3_uri: str = Field(..., description="Full S3 URI (s3://bucket/key).")
    content_type: str = Field(..., description="Detected MIME content type.")
    filename: str = Field(..., description="Original uploaded filename.")


class LambdaTriggerResponse(BaseModel):
    """Returned when a Lambda processing request is submitted."""

    status: str = Field(
        default="processing",
        description='Lambda invocation status ("processing" means it was accepted).',
    )
    s3_key: str = Field(..., description="S3 key of the document being processed.")
    message: str = Field(..., description="Human-readable processing status message.")


class StorageErrorResponse(BaseModel):
    """Standardised error response for storage operations."""

    detail: str = Field(..., description="Error description.")
    error_type: str = Field(..., description="Domain exception class name.")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the error.",
    )


class PresignedURLResponse(BaseModel):
    """Returned when generating a pre-signed download URL."""

    url: str = Field(..., description="Time-limited pre-signed download URL.")
    key: str = Field(..., description="S3 object key the URL points to.")
    expires_in_seconds: int = Field(
        ..., description="Validity period in seconds."
    )


class S3FileInfoResponse(BaseModel):
    """Metadata about a file stored in S3."""

    bucket: str = Field(..., description="S3 bucket name.")
    key: str = Field(..., description="S3 object key.")
    s3_uri: str = Field(..., description="Full S3 URI.")
    exists: bool = Field(..., description="Whether the file currently exists in S3.")


class S3ObjectListItem(BaseModel):
    """A single object returned from an S3 list operation."""

    key: str = Field(..., description="S3 object key.")
    size: int = Field(..., description="Object size in bytes.")
    last_modified: datetime | None = Field(None, description="Last modified timestamp.")
    s3_uri: str = Field(..., description="Full S3 URI.")


class S3ListResponse(BaseModel):
    """Paginated list of S3 objects under a prefix."""

    items: list[S3ObjectListItem] = Field(default_factory=list[S3ObjectListItem])
    prefix: str = Field(..., description="S3 prefix that was queried.")
    count: int = Field(..., description="Number of objects returned.")


# ══════════════════════════════════════════════════════════════════════
# AI Pipeline response models
# ══════════════════════════════════════════════════════════════════════


class AIAnalysisResponse(BaseModel):
    """Returned when storing or retrieving AI/ML pipeline output."""

    s3_uri: str = Field(..., description="S3 URI of the stored analysis JSON.")
    document_id: str = Field(..., description="Related document identifier.")
    key: str = Field(..., description="S3 object key.")
    content: dict[str, Any] | None = Field(
        None, description="AI analysis content (only populated on GET)."
    )


class ReportResponse(BaseModel):
    """Returned after storing a generated report in S3."""

    s3_uri: str = Field(..., description="S3 URI of the stored report.")
    document_id: str = Field(..., description="Related document identifier.")
    key: str = Field(..., description="S3 object key.")
    content_type: str = Field(
        default="application/pdf",
        description="Report MIME type.",
    )


class PipelineTransitionResponse(BaseModel):
    """Returned after moving a document between pipeline stages."""

    source_key: str = Field(..., description="Previous S3 key.")
    destination_uri: str = Field(..., description="New s3:// URI.")
    stage: str = Field(..., description="Target pipeline stage (e.g. 'processed', 'failed').")


# ══════════════════════════════════════════════════════════════════════
# Audit response models
# ══════════════════════════════════════════════════════════════════════


class AuditRecordResponse(BaseModel):
    """A single audit trail record."""

    key: str = Field(..., description="S3 object key of the audit record.")
    s3_uri: str = Field(..., description="S3 URI of the audit record.")
    event: str = Field(..., description="Machine-readable event name.")
    event_type: str = Field(..., description="Audit category (e.g. 'processing', 'security').")
    document_id: str = Field(..., description="Related document identifier.")
    user_id: str = Field(..., description="Owning user identifier.")
    timestamp: str = Field(..., description="UTC ISO 8601 timestamp.")
    data: dict[str, Any] = Field(default_factory=dict, description="Event-specific payload.")


class AuditListResponse(BaseModel):
    """Paginated list of audit records."""

    items: list[AuditRecordResponse] = Field(default_factory=list[AuditRecordResponse])
    user_id: str = Field(..., description="User whose audit trail was queried.")
    count: int = Field(..., description="Number of records returned.")


class AuditStoreResponse(BaseModel):
    """Returned after persisting an audit record."""

    s3_uri: str = Field(..., description="S3 URI of the stored audit record.")
    event: str = Field(..., description="The event that was recorded.")
    document_id: str = Field(..., description="Related document identifier.")
    key: str = Field(..., description="S3 object key.")


# ══════════════════════════════════════════════════════════════════════
# Request models
# ══════════════════════════════════════════════════════════════════════


class PresignedURLRequest(BaseModel):
    """Request body for generating a pre-signed URL."""

    s3_key: str = Field(..., min_length=1, description="S3 object key.")
    expiration_seconds: int = Field(
        default=3600,
        ge=60,
        le=604800,  # max 7 days (S3 limit)
        description="Validity period in seconds (min 60, max 604800).",
    )


class AIAnalysisUploadRequest(BaseModel):
    """Request body for storing AI analysis results."""

    document_id: str = Field(..., min_length=1, description="Related document identifier.")
    data: dict[str, Any] = Field(..., description="AI pipeline output (JSON).")


class AuditRecordRequest(BaseModel):
    """Request body for persisting an audit trail entry."""

    document_id: str = Field(..., min_length=1, description="Related document identifier.")
    event: str = Field(..., min_length=1, description="Machine-readable event name.")
    event_type: str = Field(
        default="processing",
        description="Audit category (e.g. 'processing', 'security', 'fraud').",
    )
    data: dict[str, Any] = Field(
        default_factory=dict,
        description="Event-specific payload.",
    )


class PipelineTransitionRequest(BaseModel):
    """Request body for moving a document between pipeline stages."""

    s3_key: str = Field(..., min_length=1, description="Current S3 object key.")
    target_stage: str = Field(
        ...,
        min_length=1,
        description="Target stage: 'processed' or 'failed'.",
    )
    error_info: dict[str, Any] | None = Field(
        None,
        description="Error metadata (required when target_stage='failed').",
    )
