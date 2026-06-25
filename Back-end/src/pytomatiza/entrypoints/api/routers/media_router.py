"""Media router — image transformation operations via Pillow."""

from __future__ import annotations

import io
import logging
from datetime import datetime, timezone
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from PIL import Image, ImageFilter
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.domain.entities.automation_run import AutomationRun, RunStatus
from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user, get_db
from pytomatiza.infrastructure.repositories.sqlalchemy_automation_run_repository import (
    SQLAlchemyAutomationRunRepository,
)

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_MEDIA = {"image/png", "image/jpeg", "image/webp", "image/gif"}


@router.post("/media/transform")
async def transform_media(
    file: Annotated[UploadFile, File()],
    action: str = "resize",
    width: int = 800,
    height: int = 600,
    quality: int = 85,
    format: str = "png",
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
):
    """Resize, convert format, compress, or apply filters to an image."""
    if file.content_type not in ALLOWED_MEDIA:
        raise HTTPException(status_code=415, detail=f"Unsupported media type: {file.content_type}")

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB)")

    img = Image.open(io.BytesIO(content))

    if action == "resize":
        img = img.resize((width, height), Image.LANCZOS)
    elif action == "compress":
        pass  # quality handled at save
    elif action == "grayscale":
        img = img.convert("L")
    elif action == "blur":
        img = img.filter(ImageFilter.GaussianBlur(radius=min(width, height) * 0.02))
    elif action == "sharpen":
        img = img.filter(ImageFilter.SHARPEN)

    fmt = format.upper() if format.upper() in ("PNG", "JPEG", "WEBP") else "PNG"
    mime = f"image/{format.lower()}" if format.lower() != "jpg" else "image/jpeg"

    buf = io.BytesIO()
    save_kwargs = {"format": fmt}
    if fmt == "JPEG":
        save_kwargs["quality"] = quality
    img.save(buf, **save_kwargs)
    buf.seek(0)

    # ── Save execution record ─────────────────────────────────────
    if current_user is not None and db is not None:
        run_repo = SQLAlchemyAutomationRunRepository(db)
        run = AutomationRun(
            id=uuid4(),
            workflow_id=None,
            agent_id=None,
            user_id=current_user.id,
            status=RunStatus.SUCCESS,
            input_payload={"action": action, "filename": file.filename or "unknown"},
            output_result={"format": fmt},
            error_message=None,
            started_at=datetime.now(timezone.utc),
            finished_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
        )
        await run_repo.save(run)

    return StreamingResponse(buf, media_type=mime, headers={"Content-Disposition": f"attachment; filename=transformed.{format.lower()}"})
