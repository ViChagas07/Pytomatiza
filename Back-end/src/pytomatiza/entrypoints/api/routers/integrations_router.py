"""Integrations router — health checks, status, and action execution."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status

from pytomatiza.application.services.integrations import get_integration_service
from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user

router = APIRouter()


@router.get("/integrations")
async def list_integrations(
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    """List all available integrations with metadata."""
    svc = get_integration_service()
    return {"integrations": svc.list_available_integrations()}


@router.get("/integrations/health")
async def integrations_health(
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    """Run health checks on all integrations."""
    svc = get_integration_service()
    results = await svc.health_check_all(user_id=current_user.id)
    return {"integrations": results}


@router.get("/integrations/{service}/health")
async def integration_health(
    service: str,
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    """Health check for a single integration."""
    svc = get_integration_service()
    provider = svc.get(service)
    if provider is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Integration '{service}' not found")
    health = await provider.health_check(user_id=current_user.id)
    return {"service": health.service, "connected": health.connected, "status": health.status, "message": health.message, "details": health.details}


@router.post("/integrations/{service}/execute")
async def integration_execute(
    service: str,
    action: str,
    params: dict[str, Any] = {},
    current_user: Annotated[User, Depends(get_current_user)] = None,
) -> dict[str, Any]:
    """Execute an action on a specific integration."""
    svc = get_integration_service()
    provider = svc.get(service)
    if provider is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Integration '{service}' not found")
    result = await provider.execute_action(action, params, user_id=current_user.id)
    return {"success": result.success, "action": result.action, "result": result.result, "error": result.error}
