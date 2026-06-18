"""Media router — image transformation operations via Pillow."""

from __future__ import annotations

import io
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from PIL import Image, ImageFilter

from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user

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

    return StreamingResponse(buf, media_type=mime, headers={"Content-Disposition": f"attachment; filename=transformed.{format.lower()}"})
