"""Automations router — list recent automation runs."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.application.dtos.automation_run_dtos import (
    AutomationRunListResponse,
    AutomationRunResponse,
)
from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user, get_db
from pytomatiza.infrastructure.repositories.sqlalchemy_automation_run_repository import (
    SQLAlchemyAutomationRunRepository,
)

router = APIRouter()


@router.get("/runs", response_model=AutomationRunListResponse)
async def list_automation_runs(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
) -> AutomationRunListResponse:
    """List recent automation runs for the authenticated user."""
    repo = SQLAlchemyAutomationRunRepository(db)
    runs, total = await repo.find_all(
        user_id=current_user.id,
        limit=per_page,
        offset=(page - 1) * per_page,
    )
    return AutomationRunListResponse(
        items=[
            AutomationRunResponse.model_validate(r, from_attributes=True) for r in runs
        ],
        total=total,
        page=page,
        per_page=per_page,
        pages=max(1, (total + per_page - 1) // per_page),
    )
