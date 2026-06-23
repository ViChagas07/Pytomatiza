"""OAuth Router — generic ``/auth/{provider}/connect`` and ``/auth/{provider}/callback``.

Each OAuth-capable provider registers its ``OAuthProviderConfig`` in the
``OAUTH_REGISTRY`` dict. The two endpoints below handle the entire
authorization code flow dynamically, without per-provider duplication.
"""

from __future__ import annotations

import logging
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.application.services.oauth_flow_service import OAuthFlowService
from pytomatiza.config import settings
from pytomatiza.domain.entities.user import User
from pytomatiza.domain.services.integrations.oauth_config import (
    OAuthProviderConfig,
)
from pytomatiza.entrypoints.api.deps import (
    get_current_user,
    get_db,
    get_redis_client,
)
from pytomatiza.infrastructure.repositories.integration_token_repository import (
    IntegrationTokenRepository,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Registry ─────────────────────────────────────────────────────────
# Providers register themselves here at module load time.
# Structure: {provider_name: OAuthProviderConfig}
OAUTH_REGISTRY: dict[str, OAuthProviderConfig] = {}


def register_oauth_provider(config: OAuthProviderConfig) -> None:
    """Register an OAuth provider so the generic router can serve it."""
    if config.provider in OAUTH_REGISTRY:
        logger.warning(
            "Overwriting OAuth registry entry for '%s'", config.provider
        )
    OAUTH_REGISTRY[config.provider] = config
    logger.info(
        "Registered OAuth provider '%s/%s'",
        config.provider,
        config.service,
    )


# ── Connect endpoint ─────────────────────────────────────────────────

@router.get("/auth/{provider}/connect")
async def oauth_connect(
    provider: str,
    current_user: Annotated[User, Depends(get_current_user)],
    redis: Annotated[Any, Depends(get_redis_client)],
) -> dict[str, str]:
    """Step 1 — Generate an OAuth authorization URL for the given provider.

    Returns ``{"authorization_url": "https://..."}``. The frontend should
    redirect the user's browser to this URL.
    """
    config = OAUTH_REGISTRY.get(provider)
    if config is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"OAuth provider '{provider}' is not registered. "
                   f"Available: {list(OAUTH_REGISTRY.keys())}",
        )

    flow = OAuthFlowService(config, redis)
    url = await flow.build_authorize_url(str(current_user.id))
    return {"authorization_url": url}


# ── Callback endpoint ────────────────────────────────────────────────

@router.get("/auth/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str = Query(...),
    state: str = Query(...),
    current_user: Annotated[User, Depends(get_current_user)] = None,  # may not be authenticated yet
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    redis: Annotated[Any, Depends(get_redis_client)] = None,
) -> dict[str, Any] | RedirectResponse:
    """Step 2 — Handle the OAuth callback for any registered provider.

    Exchanges the authorization code for tokens, fetches account info,
    and persists the connection.
    """
    config = OAUTH_REGISTRY.get(provider)
    if config is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"OAuth provider '{provider}' is not registered.",
        )

    # We need the user_id from the state stored in Redis.
    # The user might not have a session cookie at this point (popup window),
    # so we try to recover the user_id from the stored state.
    stored_user_id = await redis.get(f"oauth:state:{state}")
    if stored_user_id is None:
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/api/integrations/callback?"
            f"success=false&error=invalid_state&provider={provider}"
        )

    flow = OAuthFlowService(config, redis)

    try:
        # Exchange code for tokens
        token_response = await flow.exchange_code(
            code=code,
            state=state,
            user_id=stored_user_id,
        )

        # Fetch account info
        userinfo = await flow.fetch_account_info(token_response.access_token)
        account_id = flow.extract_account_id(userinfo)
        account_name = flow.extract_account_name(userinfo)

        # Persist
        repo = IntegrationTokenRepository(db)
        await flow.save_token(
            token_response=token_response,
            user_id=stored_user_id,
            repo=repo,
            external_account_id=account_id,
            external_account_name=account_name,
            extra_metadata={"userinfo": userinfo} if userinfo else None,
        )

    except ValueError as exc:
        logger.warning("OAuth callback failed for %s: %s", provider, exc)
        # Try to delete the state if still present
        await redis.delete(f"oauth:state:{state}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    # Redirect to frontend with success
    return RedirectResponse(
        f"{settings.FRONTEND_URL}/api/integrations/callback?"
        f"success=true&provider={provider}&service={config.service}"
    )
