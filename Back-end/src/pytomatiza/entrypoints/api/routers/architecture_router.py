"""Architecture router — AI‑powered diagram generation."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.application.dtos.architecture_dtos import (
    ArchitectureResponse,
    GenerateArchitectureCommand,
)
from pytomatiza.application.services.architecture import ArchitectureService
from pytomatiza.domain.entities.automation_run import AutomationRun, RunStatus
from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user, get_db
from pytomatiza.infrastructure.repositories.sqlalchemy_automation_run_repository import (
    SQLAlchemyAutomationRunRepository,
)

router = APIRouter()


@router.post("/architecture/generate", response_model=ArchitectureResponse)
async def generate_architecture(
    command: GenerateArchitectureCommand,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> ArchitectureResponse:
    """Generate an architecture diagram from a natural language description.

    Uses Google Gemini to produce a Mermaid.js diagram that can be
    rendered client‑side and exported to PNG/SVG/PDF/Terraform.
    """
    service = ArchitectureService()
    try:
        result = await service.generate(command)
        if current_user is not None and db is not None:
            run_repo = SQLAlchemyAutomationRunRepository(db)
            run = AutomationRun(
                id=uuid4(),
                workflow_id=None,
                agent_id=None,
                user_id=current_user.id,
                status=RunStatus.SUCCESS,
                input_payload={"description": command.description},
                output_result={"title": result.title},
                error_message=None,
                started_at=datetime.now(timezone.utc),
                finished_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
            )
            await run_repo.save(run)
        return result
    except Exception as exc:
        if current_user is not None and db is not None:
            run_repo = SQLAlchemyAutomationRunRepository(db)
            run = AutomationRun(
                id=uuid4(),
                workflow_id=None,
                agent_id=None,
                user_id=current_user.id,
                status=RunStatus.FAILED,
                input_payload={"description": command.description},
                output_result=None,
                error_message=str(exc),
                started_at=datetime.now(timezone.utc),
                finished_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
            )
            await run_repo.save(run)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diagram generation failed: {exc}",
        ) from exc
