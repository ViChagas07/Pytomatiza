"""Amazon S3 integration service.

Provides a clean, production-grade abstraction over S3 operations:
file upload, download, pre-signed URL generation, AI pipeline state
transitions, audit trail storage, and path management.

All operations go through the shared AWS client factory and use
centralized path building from ``pytomatiza.core.s3_paths``.

Key features:
- Seven S3 logical prefixes: uploads, processed, failed, reports,
  ai-analysis, temp, audit.
- Full AI document pipeline: upload → process → store analysis →
  generate report → audit trail.
- Content-type detection for uploads.
- All blocking boto3 calls offloaded via ``asyncio.to_thread()``.
- Comprehensive error handling with domain exceptions.
- Structured logging compatible with CloudWatch.
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from botocore.exceptions import ClientError as BotoClientError

from pytomatiza.config import settings
from pytomatiza.core.s3_paths import S3Paths, S3Prefix
from pytomatiza.domain.exceptions.base import StorageException
from pytomatiza.infrastructure.aws.aws_client import get_aws_client_factory

logger = logging.getLogger("pytomatiza.aws.s3")

# Maps common file extensions → MIME content types for PutObject
_CONTENT_TYPE_MAP: dict[str, str] = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".tiff": "image/tiff",
    ".bmp": "image/bmp",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".json": "application/json",
}


# ──────────────────────────────────────────────────────────────────────
# S3 Service
# ──────────────────────────────────────────────────────────────────────


class S3Service:
    """Encapsulates all S3 operations used by Pytomatiza+.

    Instantiate once (preferably via dependency injection) and reuse.

    Usage::

        s3 = S3Service()

        # Upload a document
        result = await s3.upload_file(
            file_data=b"...",
            original_filename="invoice.pdf",
            user_id="user-123",
        )

        # Store AI analysis JSON
        key = await s3.store_ai_analysis(
            user_id="user-123",
            document_id="doc-456",
            data={"entities": [...], "summary": "..."},
        )

        # Write an audit trail entry
        await s3.store_audit_record(
            user_id="user-123",
            document_id="doc-456",
            event="document_processed",
            data={"status": "success", "duration_ms": 1200},
        )
    """

    def __init__(self, bucket: str | None = None) -> None:
        self._bucket: str = bucket or settings.S3_BUCKET
        if not self._bucket:
            raise StorageException(
                "S3_BUCKET is not configured — cannot initialise S3Service."
            )
        self._client_factory = get_aws_client_factory()
        self._paths = S3Paths()
        logger.info("S3Service initialised — bucket=%r", self._bucket)

    # ══════════════════════════════════════════════════════════════════
    # URI & key helpers
    # ══════════════════════════════════════════════════════════════════

    def _s3_uri(self, s3_key: str) -> str:
        """Build a full s3:// URI for a given key."""
        return f"s3://{self._bucket}/{s3_key}"

    def _key_from_uri(self, uri: str) -> str:
        """Extract the S3 key from an s3:// URI."""
        prefix = f"s3://{self._bucket}/"
        if uri.startswith(prefix):
            return uri[len(prefix):]
        return uri

    # ══════════════════════════════════════════════════════════════════
    # Basic CRUD operations
    # ══════════════════════════════════════════════════════════════════

    async def upload_file(
        self,
        file_data: bytes,
        original_filename: str,
        user_id: str,
        *,
        metadata: dict[str, str] | None = None,
    ) -> dict[str, str]:
        """Upload a file into the ``uploads/`` prefix.

        Returns:
            Dict with keys ``bucket``, ``key``, ``s3_uri``, ``content_type``.
        """
        suffix = Path(original_filename).suffix.lower()
        if suffix not in settings.ALLOWED_UPLOAD_EXTENSIONS:
            raise StorageException(
                f"File extension {suffix!r} is not allowed. "
                f"Allowed: {sorted(settings.ALLOWED_UPLOAD_EXTENSIONS)}",
            )

        content_type = _CONTENT_TYPE_MAP.get(suffix, "application/octet-stream")
        s3_key = self._paths.upload(user_id=user_id, filename=original_filename)

        try:
            client = self._client_factory.s3
            extra_args: dict[str, Any] = {"ContentType": content_type}
            if metadata:
                extra_args["Metadata"] = metadata

            await asyncio.to_thread(
                client.put_object,
                Bucket=self._bucket,
                Key=s3_key,
                Body=file_data,
                **extra_args,
            )
        except BotoClientError as exc:
            logger.exception("S3 upload failed for key=%r", s3_key)
            raise StorageException(f"Failed to upload file to S3: {exc}") from exc

        result = {
            "bucket": self._bucket,
            "key": s3_key,
            "s3_uri": self._s3_uri(s3_key),
            "content_type": content_type,
        }
        logger.info("S3 upload succeeded: %s", result["s3_uri"])
        return result

    # ------------------------------------------------------------------

    async def download_file(self, s3_key: str) -> bytes:
        """Download an object's raw bytes from S3."""
        try:
            client = self._client_factory.s3
            response = await asyncio.to_thread(
                client.get_object,
                Bucket=self._bucket,
                Key=s3_key,
            )
            body: bytes = response["Body"].read()
            logger.debug("S3 download succeeded: key=%r (%d bytes)", s3_key, len(body))
            return body
        except BotoClientError as exc:
            logger.exception("S3 download failed for key=%r", s3_key)
            raise StorageException(f"Failed to download file from S3: {exc}") from exc

    # ------------------------------------------------------------------

    async def upload_json(
        self,
        s3_key: str,
        data: dict[str, Any] | list[Any],
        *,
        metadata: dict[str, str] | None = None,
    ) -> str:
        """Upload a JSON-serialisable payload to S3.

        Returns the ``s3://`` URI of the stored object.
        """
        try:
            body = json.dumps(data, default=str, indent=2).encode("utf-8")
            client = self._client_factory.s3
            extra_args: dict[str, Any] = {"ContentType": "application/json"}
            if metadata:
                extra_args["Metadata"] = metadata

            await asyncio.to_thread(
                client.put_object,
                Bucket=self._bucket,
                Key=s3_key,
                Body=body,
                **extra_args,
            )
            uri = self._s3_uri(s3_key)
            logger.info("JSON uploaded to S3: %s", uri)
            return uri
        except BotoClientError as exc:
            logger.exception("S3 JSON upload failed for key=%r", s3_key)
            raise StorageException(f"Failed to upload JSON to S3: {exc}") from exc

    # ------------------------------------------------------------------

    async def download_json(self, s3_key: str) -> dict[str, Any] | list[Any]:
        """Download and parse a JSON object from S3."""
        raw = await self.download_file(s3_key)
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise StorageException(
                f"Failed to parse JSON from S3 key {s3_key!r}: {exc}"
            ) from exc

    # ------------------------------------------------------------------

    async def delete_file(self, s3_key: str) -> None:
        """Delete an object from the S3 bucket."""
        try:
            client = self._client_factory.s3
            await asyncio.to_thread(
                client.delete_object,
                Bucket=self._bucket,
                Key=s3_key,
            )
            logger.info("S3 object deleted: %s", self._s3_uri(s3_key))
        except BotoClientError as exc:
            logger.exception("S3 deletion failed for key=%r", s3_key)
            raise StorageException(f"Failed to delete file from S3: {exc}") from exc

    # ------------------------------------------------------------------

    async def file_exists(self, s3_key: str) -> bool:
        """Check whether an object exists in the bucket."""
        try:
            client = self._client_factory.s3
            await asyncio.to_thread(
                client.head_object,
                Bucket=self._bucket,
                Key=s3_key,
            )
            return True
        except BotoClientError:
            return False

    # ------------------------------------------------------------------

    async def generate_presigned_url(
        self,
        s3_key: str,
        expiration_seconds: int = 3600,
    ) -> str:
        """Generate a time-limited pre-signed download URL."""
        try:
            client = self._client_factory.s3
            url = await asyncio.to_thread(
                client.generate_presigned_url,
                "get_object",
                Params={"Bucket": self._bucket, "Key": s3_key},
                ExpiresIn=expiration_seconds,
            )
            logger.debug("Pre-signed URL generated for key=%r", s3_key)
            return url
        except BotoClientError as exc:
            logger.exception("Pre-signed URL generation failed for key=%r", s3_key)
            raise StorageException(f"Failed to generate pre-signed URL: {exc}") from exc

    # ══════════════════════════════════════════════════════════════════
    # Object lifecycle — copy / move between prefixes
    # ══════════════════════════════════════════════════════════════════

    async def copy_object(
        self,
        source_key: str,
        destination_key: str,
        *,
        metadata: dict[str, str] | None = None,
    ) -> str:
        """Copy an S3 object to a new key within the same bucket (server-side).

        Returns the destination ``s3://`` URI.
        """
        try:
            client = self._client_factory.s3
            copy_source = {"Bucket": self._bucket, "Key": source_key}

            kwargs: dict[str, Any] = {
                "Bucket": self._bucket,
                "CopySource": copy_source,
                "Key": destination_key,
            }
            if metadata is not None:
                kwargs["Metadata"] = metadata
                kwargs["MetadataDirective"] = "REPLACE"

            await asyncio.to_thread(client.copy_object, **kwargs)
            uri = self._s3_uri(destination_key)
            logger.info(
                "S3 copy: %s → %s",
                self._s3_uri(source_key),
                uri,
            )
            return uri
        except BotoClientError as exc:
            logger.exception("S3 copy failed: %r → %r", source_key, destination_key)
            raise StorageException(f"Failed to copy S3 object: {exc}") from exc

    async def move_object(
        self,
        source_key: str,
        destination_key: str,
        *,
        metadata: dict[str, str] | None = None,
    ) -> str:
        """Move an object by copying then deleting the source.

        Returns the destination ``s3://`` URI.
        """
        uri = await self.copy_object(source_key, destination_key, metadata=metadata)
        await self.delete_file(source_key)
        logger.info("S3 move completed: %r → %s", source_key, uri)
        return uri

    # ------------------------------------------------------------------

    async def list_objects(
        self,
        prefix: str,
        *,
        max_keys: int = 100,
    ) -> list[dict[str, Any]]:
        """List S3 objects under a given prefix.

        Returns list of dicts with keys: ``key``, ``size``, ``last_modified``, ``s3_uri``.
        """
        try:
            client = self._client_factory.s3
            response = await asyncio.to_thread(
                client.list_objects_v2,
                Bucket=self._bucket,
                Prefix=prefix,
                MaxKeys=max_keys,
            )

            objects: list[dict[str, Any]] = []
            for obj in response.get("Contents", []):
                key = obj.get("Key", "")
                objects.append({
                    "key": key,
                    "size": obj.get("Size", 0),
                    "last_modified": obj.get("LastModified"),
                    "s3_uri": self._s3_uri(key),
                })

            logger.debug("Listed %d objects under prefix=%r", len(objects), prefix)
            return objects
        except BotoClientError as exc:
            logger.exception("S3 list failed for prefix=%r", prefix)
            raise StorageException(f"Failed to list S3 objects: {exc}") from exc

    # ══════════════════════════════════════════════════════════════════
    # AI document pipeline methods
    # ══════════════════════════════════════════════════════════════════

    async def upload_to_prefix(
        self,
        file_data: bytes,
        user_id: str,
        prefix: S3Prefix,
        filename: str,
        *,
        metadata: dict[str, str] | None = None,
    ) -> dict[str, str]:
        """Upload a file to any S3 prefix using the path builder.

        Returns dict with ``bucket``, ``key``, ``s3_uri``, ``content_type``.
        """
        suffix = Path(filename).suffix.lower()
        content_type = _CONTENT_TYPE_MAP.get(suffix, "application/octet-stream")

        if prefix == S3Prefix.UPLOADS:
            s3_key = self._paths.upload(user_id=user_id, filename=filename)
        elif prefix == S3Prefix.TEMP:
            s3_key = self._paths.temp(user_id=user_id, filename=filename)
        elif prefix == S3Prefix.REPORTS:
            doc_id = Path(filename).stem
            s3_key = self._paths.report(user_id=user_id, document_id=doc_id)
        else:
            s3_key = self._paths.for_prefix(prefix=prefix, user_id=user_id, filename=filename)

        try:
            client = self._client_factory.s3
            extra_args: dict[str, Any] = {"ContentType": content_type}
            if metadata:
                extra_args["Metadata"] = metadata

            await asyncio.to_thread(
                client.put_object,
                Bucket=self._bucket,
                Key=s3_key,
                Body=file_data,
                **extra_args,
            )
        except BotoClientError as exc:
            logger.exception("S3 upload to prefix %s failed", prefix.value)
            raise StorageException(f"Failed to upload to S3 prefix {prefix.value}: {exc}") from exc

        result = {
            "bucket": self._bucket,
            "key": s3_key,
            "s3_uri": self._s3_uri(s3_key),
            "content_type": content_type,
        }
        logger.info("Uploaded to %s: %s", prefix.value, result["s3_uri"])
        return result

    # ------------------------------------------------------------------

    async def move_to_processed(
        self,
        original_key: str,
        *,
        metadata: dict[str, str] | None = None,
    ) -> str:
        """Move a successfully processed document to ``processed/``.

        Note: user_id is extracted from the original key by ``S3Paths.processed()``.
        Callers must validate ownership before invoking this method.

        Returns the new ``s3://`` URI.
        """
        destination_key = self._paths.processed(original_key=original_key)
        uri = await self.move_object(original_key, destination_key, metadata=metadata)
        logger.info(
            "Document moved to processed: %s → %s",
            self._s3_uri(original_key),
            uri,
        )
        return uri

    async def move_to_failed(
        self,
        original_key: str,
        *,
        error_metadata: dict[str, str] | None = None,
    ) -> str:
        """Move a failed document to ``failed/`` with error metadata.

        Note: user_id is extracted from the original key by ``S3Paths.failed()``.
        Callers must validate ownership before invoking this method.

        Returns the new ``s3://`` URI.
        """
        destination_key = self._paths.failed(original_key=original_key)
        metadata = {"x-failed-at": datetime.now(UTC).isoformat(), **(error_metadata or {})}
        uri = await self.move_object(original_key, destination_key, metadata=metadata)
        logger.warning(
            "Document moved to failed: %s → %s",
            self._s3_uri(original_key),
            uri,
        )
        return uri

    # ------------------------------------------------------------------

    async def store_ai_analysis(
        self,
        user_id: str,
        document_id: str,
        data: dict[str, Any],
        *,
        metadata: dict[str, str] | None = None,
    ) -> str:
        """Store AI/ML pipeline output into ``ai-analysis/``.

        Returns the ``s3://`` URI of the stored analysis.
        """
        s3_key = self._paths.ai_analysis(user_id=user_id, document_id=document_id)
        uri = await self.upload_json(s3_key, data, metadata=metadata)
        logger.info("AI analysis stored: %s (document=%r)", uri, document_id)
        return uri

    async def store_report(
        self,
        user_id: str,
        document_id: str,
        file_data: bytes,
        *,
        metadata: dict[str, str] | None = None,
    ) -> str:
        """Store a generated report (PDF, XLSX, etc.) into ``reports/``.

        Returns the ``s3://`` URI of the stored report.
        """
        s3_key = self._paths.report(user_id=user_id, document_id=document_id)
        try:
            client = self._client_factory.s3
            extra_args: dict[str, Any] = {"ContentType": "application/pdf"}
            if metadata:
                extra_args["Metadata"] = metadata

            await asyncio.to_thread(
                client.put_object,
                Bucket=self._bucket,
                Key=s3_key,
                Body=file_data,
                **extra_args,
            )
        except BotoClientError as exc:
            logger.exception("S3 report upload failed for doc=%r", document_id)
            raise StorageException(f"Failed to store report: {exc}") from exc

        uri = self._s3_uri(s3_key)
        logger.info("Report stored: %s (document=%r)", uri, document_id)
        return uri

    # ══════════════════════════════════════════════════════════════════
    # Audit trail storage
    # ══════════════════════════════════════════════════════════════════

    async def store_audit_record(
        self,
        user_id: str,
        document_id: str,
        event: str,
        data: dict[str, Any],
        *,
        event_type: str = "processing",
    ) -> str:
        """Persist a structured audit trail record into ``audit/``.

        The stored JSON includes a mandatory envelope:
        - ``event``, ``event_type``, ``document_id``, ``user_id``
        - ``timestamp`` (UTC ISO 8601)
        - ``data`` (event-specific payload)

        Returns the ``s3://`` URI of the stored audit record.
        """
        s3_key = self._paths.audit_event(
            user_id=user_id,
            document_id=document_id,
            event_type=event_type,
        )

        record: dict[str, Any] = {
            "event": event,
            "event_type": event_type,
            "document_id": document_id,
            "user_id": user_id,
            "timestamp": datetime.now(UTC).isoformat(),
            "data": data,
        }

        uri = await self.upload_json(s3_key, record)
        logger.info(
            "Audit record stored: event=%r type=%r document=%r",
            event,
            event_type,
            document_id,
        )
        return uri

    async def list_audit_events(
        self,
        user_id: str,
        *,
        max_keys: int = 50,
    ) -> list[dict[str, Any]]:
        """List audit events for a user from the ``audit/`` prefix.

        Returns list of S3 object metadata dicts.
        """
        prefix = self._paths.user_prefix(user_id, S3Prefix.AUDIT)
        return await self.list_objects(prefix=prefix, max_keys=max_keys)

    async def get_audit_record(self, s3_key: str) -> dict[str, Any]:
        """Download and parse a single audit record from S3."""
        data = await self.download_json(s3_key)
        if not isinstance(data, dict):
            raise StorageException(
                f"Audit record at {s3_key!r} is not a JSON object."
            )
        return data
