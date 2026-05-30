"""Storage / S3 router — complete AI document pipeline."""

from __future__ import annotations

import logging
import re
from functools import lru_cache
from typing import Annotated, Any
from datetime import datetime
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from pytomatiza.application.dtos.storage_dtos import (
    AIAnalysisResponse,
    AIAnalysisUploadRequest,
    LambdaTriggerResponse,
    PipelineTransitionRequest,
    PipelineTransitionResponse,
    PresignedURLRequest,
    PresignedURLResponse,
    ReportResponse,
    S3FileInfoResponse,
    S3ListResponse,
    S3ObjectListItem,
    S3UploadResponse,
)
from pytomatiza.config import settings
from pytomatiza.domain.entities.user import User
from pytomatiza.domain.exceptions.base import (
    NotificationException,
    ProcessingException,
    StorageException,
)
from pytomatiza.entrypoints.api.deps import get_current_user
from pytomatiza.infrastructure.aws import (
    LambdaService,
    S3Service,
    SNSService,
)

logger = logging.getLogger("pytomatiza.api.storage")

router = APIRouter()

_MAX_UPLOAD_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
_CATEGORY_PATTERN = re.compile(r"^[a-zA-Z0-9_\-]+$")


# ── Dependency injection ───────────────────────────────────────────────


@lru_cache(maxsize=1)
def _get_s3_service() -> S3Service:
    return S3Service()


@lru_cache(maxsize=1)
def _get_lambda_service() -> LambdaService | None:
    try:
        return LambdaService()
    except ProcessingException:
        return None


@lru_cache(maxsize=1)
def _get_sns_service() -> SNSService | None:
    try:
        return SNSService()
    except NotificationException:
        return None


# ── Helpers ────────────────────────────────────────────────────────────


def _validate_s3_key_ownership(s3_key: str, user_id: str) -> None:
    if not s3_key.startswith(f"{user_id}/"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you can only access your own files.",
        )


def _validate_safe_name(value: str) -> None:
    if not _CATEGORY_PATTERN.match(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid value. Use only alphanumeric characters, "
                "underscores, and hyphens (no slashes or dots)."
            ),
        )


def _validate_pipeline_stage(stage: str) -> None:
    if stage not in ("processed", "failed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target stage must be 'processed' or 'failed'.",
        )


async def _read_file_chunked(file: UploadFile) -> bytes:
    chunk_size = 1024 * 1024
    chunks: list[bytes] = []
    total_read = 0
    while total_read <= _MAX_UPLOAD_BYTES:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        chunks.append(chunk)
        total_read += len(chunk)
    else:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit.",
        )
    return b"".join(chunks)


def _extract_key_from_uri(uri: str) -> str:
    prefix = f"s3://{settings.S3_BUCKET}/"
    return uri[len(prefix):] if uri.startswith(prefix) else uri


# ══════════════════════════════════════════════════════════════════════
# Upload endpoints
# ══════════════════════════════════════════════════════════════════════


@router.post(
    "/upload",
    response_model=S3UploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_file(
    current_user: Annotated[User, Depends(get_current_user)],
    file: Annotated[UploadFile, File(description="File to upload.")],
    s3: Annotated[S3Service, Depends(_get_s3_service)],
    lam: Annotated[LambdaService | None, Depends(_get_lambda_service)],
    sns: Annotated[SNSService | None, Depends(_get_sns_service)],
    trigger_processing: Annotated[bool, Query()] = True,
) -> S3UploadResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided.")

    file_data = await _read_file_chunked(file)

    try:
        result: dict[str, Any] = await s3.upload_file(
            file_data=file_data,
            original_filename=file.filename,
            user_id=str(current_user.id),
        )
    except StorageException as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    if trigger_processing and lam is not None:
        try:
            await lam.invoke_document_processor(
                s3_key=result["key"],
                user_id=str(current_user.id),
            )
        except ProcessingException:
            logger.warning("Lambda trigger failed for key=%r", result["key"])

    if sns is not None:
        try:
            await sns.notify_document_processed(
                user_id=str(current_user.id),
                document_key=result["key"],
                status="uploaded",
            )
        except NotificationException:
            logger.warning("SNS notification failed for key=%r", result["key"])

    return S3UploadResponse(
        bucket=str(result["bucket"]),
        key=str(result["key"]),
        s3_uri=str(result["s3_uri"]),
        content_type=str(result["content_type"]),
        filename=file.filename,
    )


@router.post(
    "/upload-and-process",
    response_model=LambdaTriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_and_process(
    current_user: Annotated[User, Depends(get_current_user)],
    file: Annotated[UploadFile, File(description="File to upload and process.")],
    s3: Annotated[S3Service, Depends(_get_s3_service)],
    lam: Annotated[LambdaService | None, Depends(_get_lambda_service)],
) -> LambdaTriggerResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided.")

    file_data = await _read_file_chunked(file)

    try:
        result: dict[str, Any] = await s3.upload_file(
            file_data=file_data,
            original_filename=file.filename,
            user_id=str(current_user.id),
        )
    except StorageException as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    if lam is None:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Lambda processing is not configured.",
        )

    try:
        await lam.invoke_document_processor(
            s3_key=str(result["key"]),
            user_id=str(current_user.id),
        )
    except ProcessingException as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to trigger document processing: {exc}",
        ) from exc

    return LambdaTriggerResponse(
        status="processing",
        s3_key=str(result["key"]),
        message=f"Document uploaded to {result['s3_uri']} and processing started.",
    )


# ══════════════════════════════════════════════════════════════════════
# Generic S3 object operations
# ══════════════════════════════════════════════════════════════════════


@router.post("/presigned-url", response_model=PresignedURLResponse)
async def get_presigned_url(
    body: PresignedURLRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    s3: Annotated[S3Service, Depends(_get_s3_service)],
) -> PresignedURLResponse:
    _validate_s3_key_ownership(body.s3_key, str(current_user.id))

    try:
        url = await s3.generate_presigned_url(
            s3_key=body.s3_key,
            expiration_seconds=body.expiration_seconds,
        )
    except StorageException as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return PresignedURLResponse(
        url=url,
        key=body.s3_key,
        expires_in_seconds=body.expiration_seconds,
    )


@router.get("/file-info", response_model=S3FileInfoResponse)
async def get_file_info(
    current_user: Annotated[User, Depends(get_current_user)],
    s3: Annotated[S3Service, Depends(_get_s3_service)],
    s3_key: Annotated[str, Query(description="S3 object key.")],
) -> S3FileInfoResponse:
    _validate_s3_key_ownership(s3_key, str(current_user.id))

    exists = await s3.file_exists(s3_key)
    return S3FileInfoResponse(
        bucket=settings.S3_BUCKET,
        key=s3_key,
        s3_uri=f"s3://{settings.S3_BUCKET}/{s3_key}",
        exists=exists,
    )


@router.delete("/files", status_code=status.HTTP_200_OK)
async def delete_file(
    current_user: Annotated[User, Depends(get_current_user)],
    s3: Annotated[S3Service, Depends(_get_s3_service)],
    s3_key: Annotated[str, Query(description="S3 object key to delete.")],
) -> None:
    _validate_s3_key_ownership(s3_key, str(current_user.id))

    try:
        await s3.delete_file(s3_key)
    except StorageException as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/list", response_model=S3ListResponse)
async def list_objects(
    current_user: Annotated[User, Depends(get_current_user)],
    s3: Annotated[S3Service, Depends(_get_s3_service)],
    prefix: Annotated[str, Query(description="S3 prefix to list.")],
    max_keys: Annotated[int, Query(ge=1, le=1000)] = 100,
) -> S3ListResponse:
    _validate_s3_key_ownership(prefix, str(current_user.id))

    try:
        objects: list[dict[str, Any]] = await s3.list_objects(
            prefix=prefix, max_keys=max_keys
        )
    except StorageException as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return S3ListResponse(
        items=[
            S3ObjectListItem(
                key=str(o["key"]),
                size=int(o["size"]) if o.get("size") is not None else 0,
                last_modified=o.get("last_modified") if isinstance(o.get("last_modified"), datetime) else None,
                s3_uri=str(o["s3_uri"]),
            )
            for o in objects
        ],
        prefix=prefix,
        count=len(objects),
    )


# ══════════════════════════════════════════════════════════════════════
# AI pipeline — state transitions
# ══════════════════════════════════════════════════════════════════════


@router.post("/pipeline/transition", response_model=PipelineTransitionResponse)
async def pipeline_transition(
    body: PipelineTransitionRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    s3: Annotated[S3Service, Depends(_get_s3_service)],
) -> PipelineTransitionResponse:
    _validate_s3_key_ownership(body.s3_key, str(current_user.id))
    _validate_pipeline_stage(body.target_stage)

    try:
        if body.target_stage == "processed":
            uri = await s3.move_to_processed(original_key=body.s3_key)
        else:
            if not body.error_info:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="error_info is required when target_stage is 'failed'.",
                )
            error_meta: dict[str, str] = {
                "x-error-reason": str(body.error_info.get("reason", "unknown"))
            }
            uri = await s3.move_to_failed(
                original_key=body.s3_key,
                error_metadata=error_meta,
            )
    except StorageException as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return PipelineTransitionResponse(
        source_key=body.s3_key,
        destination_uri=uri,
        stage=body.target_stage,
    )


# ══════════════════════════════════════════════════════════════════════
# AI analysis
# ══════════════════════════════════════════════════════════════════════


@router.post(
    "/ai-analysis",
    response_model=AIAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
)
async def store_ai_analysis(
    body: AIAnalysisUploadRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    s3: Annotated[S3Service, Depends(_get_s3_service)],
) -> AIAnalysisResponse:
    _validate_safe_name(body.document_id)

    try:
        uri = await s3.store_ai_analysis(
            user_id=str(current_user.id),
            document_id=body.document_id,
            data=body.data,
        )
    except StorageException as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return AIAnalysisResponse(
    s3_uri=uri,
    document_id=body.document_id,
    key=_extract_key_from_uri(uri),
    content=None,
)


@router.get("/ai-analysis", response_model=AIAnalysisResponse)
async def get_ai_analysis(
    current_user: Annotated[User, Depends(get_current_user)],
    s3: Annotated[S3Service, Depends(_get_s3_service)],
    s3_key: Annotated[str, Query(description="S3 key of the analysis JSON.")],
) -> AIAnalysisResponse:
    _validate_s3_key_ownership(s3_key, str(current_user.id))

    try:
        raw: dict[str, Any] | list[Any] = await s3.download_json(s3_key)
    except StorageException as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    content: dict[str, Any] = raw if isinstance(raw, dict) else {"items": raw}

    return AIAnalysisResponse(
        s3_uri=f"s3://{settings.S3_BUCKET}/{s3_key}",
        document_id=s3_key.split("/")[-1].replace("_analysis.json", ""),
        key=s3_key,
        content=content,
    )


# ══════════════════════════════════════════════════════════════════════
# Reports
# ══════════════════════════════════════════════════════════════════════


@router.post(
    "/reports",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_report(
    current_user: Annotated[User, Depends(get_current_user)],
    file: Annotated[UploadFile, File(description="Report file to upload.")],
    s3: Annotated[S3Service, Depends(_get_s3_service)],
    document_id: Annotated[str, Query(description="Related document identifier.")],
) -> ReportResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided.")

    _validate_safe_name(document_id)
    file_data = await _read_file_chunked(file)

    try:
        uri = await s3.store_report(
            user_id=str(current_user.id),
            document_id=document_id,
            file_data=file_data,
        )
    except StorageException as exc:
     raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return ReportResponse(
    s3_uri=uri,
    document_id=document_id,
    key=_extract_key_from_uri(uri),
    content_type=file.content_type or "application/octet-stream",
)