"""Communication router — send messages via registered integration providers."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.application.services.integrations import get_integration_service
from pytomatiza.domain.entities.automation_run import AutomationRun, RunStatus
from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user, get_db
from pytomatiza.infrastructure.repositories.sqlalchemy_automation_run_repository import (
    SQLAlchemyAutomationRunRepository,
)

router = APIRouter()


@router.post("/communication/send")
async def send_message(
    service: str,
    action: str,
    params: dict = {},
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> dict:
    """Send a message via any connected integration (discord, telegram, gmail, etc.)."""
    svc = get_integration_service()
    provider = svc.get(service)
    if provider is None:
        if current_user is not None and db is not None:
            run_repo = SQLAlchemyAutomationRunRepository(db)
            run = AutomationRun(
                id=uuid4(),
                workflow_id=None,
                agent_id=None,
                user_id=current_user.id,
                status=RunStatus.FAILED,
                input_payload={"service": service, "action": action, "params": params},
                output_result=None,
                error_message=f"Service '{service}' not found",
                started_at=datetime.now(timezone.utc),
                finished_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
            )
            await run_repo.save(run)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Service '{service}' not found")
    result = await provider.execute_action(action, params, user_id=current_user.id)
    if current_user is not None and db is not None:
        run_repo = SQLAlchemyAutomationRunRepository(db)
        run = AutomationRun(
            id=uuid4(),
            workflow_id=None,
            agent_id=None,
            user_id=current_user.id,
            status=RunStatus.SUCCESS if result.success else RunStatus.FAILED,
            input_payload={"service": service, "action": action, "params": params},
            output_result={"result": result.result} if result.success else None,
            error_message=result.error if not result.success else None,
            started_at=datetime.now(timezone.utc),
            finished_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
        )
        await run_repo.save(run)
    return {"success": result.success, "action": result.action, "result": result.result, "error": result.error}


@router.get("/communication/channels")
async def list_channels(
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """List all available communication channels with status."""
    svc = get_integration_service()
    health = await svc.health_check_all(user_id=current_user.id)
    channels = ["discord", "telegram", "whatsapp", "gmail"]
    result = {}
    for ch in channels:
        result[ch] = health.get(ch, {"connected": False, "status": "disconnected", "message": "Not configured"})
    return {"channels": result}
