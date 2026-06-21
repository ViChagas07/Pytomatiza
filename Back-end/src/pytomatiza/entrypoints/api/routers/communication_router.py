"""Communication router — send messages via registered integration providers."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from pytomatiza.application.services.integrations import get_integration_service
from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user

router = APIRouter()


@router.post("/communication/send")
async def send_message(
    service: str,
    action: str,
    params: dict = {},
    current_user: Annotated[User, Depends(get_current_user)] = None,
) -> dict:
    """Send a message via any connected integration (discord, telegram, gmail, etc.)."""
    svc = get_integration_service()
    provider = svc.get(service)
    if provider is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Service '{service}' not found")
    result = await provider.execute_action(action, params, user_id=current_user.id)
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
