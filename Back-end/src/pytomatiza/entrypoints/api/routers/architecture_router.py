"""Architecture router — AI‑powered diagram generation."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from pytomatiza.application.dtos.architecture_dtos import (
    ArchitectureResponse,
    GenerateArchitectureCommand,
)
from pytomatiza.application.services.architecture import ArchitectureService
from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user

router = APIRouter()


@router.post("/architecture/generate", response_model=ArchitectureResponse)
async def generate_architecture(
    command: GenerateArchitectureCommand,
    current_user: Annotated[User, Depends(get_current_user)],
) -> ArchitectureResponse:
    """Generate an architecture diagram from a natural language description.

    Uses Google Gemini to produce a Mermaid.js diagram that can be
    rendered client‑side and exported to PNG/SVG/PDF/Terraform.
    """
    service = ArchitectureService()
    try:
        return await service.generate(command)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diagram generation failed: {exc}",
        ) from exc
