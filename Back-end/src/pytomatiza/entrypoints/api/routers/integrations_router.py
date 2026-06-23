"""Integrations router — health checks, status, action execution, and disconnect."""

from __future__ import annotations

import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.application.services.integrations import get_integration_service
from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user, get_db
from pytomatiza.infrastructure.repositories.integration_token_repository import (
    IntegrationTokenRepository,
)

logger = logging.getLogger("pytomatiza.api.integrations")

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
    try:
        svc = get_integration_service()
        results = await svc.health_check_all(user_id=current_user.id)
        return {"integrations": results, "user_id": str(current_user.id)}
    except Exception as exc:
        logger.error("health_check_all failed for user %s: %s", current_user.id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to retrieve integration health.",
        ) from exc


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


@router.delete("/integrations/{service}/disconnect")
async def integration_disconnect(
    service: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Disconnect an integration by deleting the user's token.

    The ``service`` URL parameter is the IntegrationService name (e.g.
    ``google_drive``, ``discord``). It maps to the ``provider`` column
    in ``integration_tokens`` via a lookup dict.
    """
    # Map IntegrationService names to the `provider` column in
    # integration_tokens. Google sub‑services all share provider="google".
    _PROVIDER_MAP: dict[str, str] = {
        "slack": "slack",
        "discord": "discord",
        "telegram": "telegram",
        "trello": "trello",
        "jira": "jira",
        "zoom": "zoom",
        "google_drive": "google",
        "gmail": "google",
        "google_calendar": "google",
        "google_sheets": "google",
        "google_meet": "google",
        "google_maps": "google",
        "whatsapp": "whatsapp",
        "facebook": "facebook",
    }

    svc = get_integration_service()
    provider_obj = svc.get(service)
    if provider_obj is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration '{service}' not found",
        )

    # Attempt server-side revocation (if the provider supports it)
    try:
        await provider_obj.revoke(current_user.id)
    except Exception as exc:
        logger.warning("revoke failed for %s user=%s: %s", service, current_user.id, exc)

    # Delete the token(s) from integration_tokens
    db_provider = _PROVIDER_MAP.get(service, service)
    repo = IntegrationTokenRepository(db)
    deleted = await repo.delete_by_user_and_provider(current_user.id, db_provider)

    return {"disconnected": deleted, "service": service, "provider": db_provider}
