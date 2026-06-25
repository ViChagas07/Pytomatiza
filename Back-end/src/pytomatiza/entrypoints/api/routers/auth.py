"""Auth router — registration, login, OAuth, token refresh, logout, password reset."""

from __future__ import annotations

import logging
import time
import traceback
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.application.dtos.auth_dtos import (
    GoogleIDTokenCommand,
    LoginCommand,
    LogoutCommand,
    PasswordResetConfirmCommand,
    PasswordResetRequestCommand,
    RefreshTokenCommand,
    RegisterUserCommand,
    TokenResponse,
    UserResponse,
)
from pytomatiza.application.use_cases.auth.login_user import LoginUserUseCase
from pytomatiza.application.use_cases.auth.oauth_google_login import OAuthGoogleLoginUseCase
from pytomatiza.application.use_cases.auth.register_user import RegisterUserUseCase
from pytomatiza.application.use_cases.auth.reset_password import ResetPasswordUseCase
from pytomatiza.config import settings
from pytomatiza.domain.entities.user import User
from pytomatiza.domain.exceptions.auth_exceptions import (
    AccountNotVerified,
    EmailAlreadyRegistered,
    InvalidCredentials,
)
from pytomatiza.entrypoints.api.deps import get_current_user, get_db, get_redis_client
from pytomatiza.infrastructure.email.resend_email_service import ResendEmailService
from pytomatiza.infrastructure.repositories.sqlalchemy_user_repository import (
    SQLAlchemyUserRepository,
)
from pytomatiza.infrastructure.repositories.sqlalchemy_oauth_token_repository import (
    SQLAlchemyOAuthTokenRepository,
)
from pytomatiza.infrastructure.security.jwt_token_service import JWTTokenService
from pytomatiza.infrastructure.security.password_hasher import PasswordHasher

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    command: RegisterUserCommand,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Register a new user account and return JWT tokens."""
    use_case = RegisterUserUseCase(
        user_repo=SQLAlchemyUserRepository(db),
        email_service=ResendEmailService(),
        token_service=JWTTokenService(),
        password_hasher=PasswordHasher(),
    )
    try:
        return await use_case.execute(command)
    except EmailAlreadyRegistered as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post("/login", response_model=TokenResponse)
async def login(
    command: LoginCommand,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Authenticate with email and password, return JWT tokens."""
    use_case = LoginUserUseCase(
        user_repo=SQLAlchemyUserRepository(db),
        email_service=ResendEmailService(),
        token_service=JWTTokenService(),
        password_hasher=PasswordHasher(),
    )
    try:
        return await use_case.execute(command)
    except InvalidCredentials as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except AccountNotVerified as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    command: RefreshTokenCommand,
    redis: Any = Depends(get_redis_client),
) -> TokenResponse:
    """Refresh an access token using a valid refresh token."""
    
    token_service = JWTTokenService()

    try:
        payload: dict[str, Any] = token_service.decode_token(
            command.refresh_token
        )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type.",
            )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        ) from exc

    raw_jti = payload.get("jti", "")
    jti: str = str(raw_jti)
    blacklisted: str | None = await redis.get(f"blacklist:token:{jti}")
    if blacklisted is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked.",
        )

    raw_sub = payload.get("sub", "")
    user_id: str = str(raw_sub)
    return token_service.generate_tokens(user_id)


@router.post("/logout", response_model=None)
async def logout(
    command: LogoutCommand,
    redis: Any = Depends(get_redis_client),
) -> dict[str, str]:
    """Logout by blacklisting the refresh token in Redis."""

    token_service = JWTTokenService()

    try:
        payload: dict[str, Any] = token_service.decode_token(
            command.refresh_token
        )

        raw_jti = payload.get("jti", "")
        jti: str = str(raw_jti)

        raw_exp = payload.get("exp", 0)
        exp: int = int(raw_exp) if isinstance(
            raw_exp,
            (int, float)
        ) else 0

        ttl = max(0, exp - int(time.time()))

        await redis.setex(
            f"blacklist:token:{jti}",
            ttl,
            "revoked"
        )

    except Exception:
        pass

    return {"message": "Logged out successfully."}


@router.post("/password-reset", response_model=None)
async def request_password_reset(
    command: PasswordResetRequestCommand,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Any = Depends(get_redis_client),
) -> dict[str, str]:

    use_case = ResetPasswordUseCase(
        user_repo=SQLAlchemyUserRepository(db),
        email_service=ResendEmailService(),
        password_hasher=PasswordHasher(),
        redis=redis,
    )

    await use_case.request_reset(command.email)

    return {"message": "If an account with that email exists, a password reset link has been sent."}

@router.post("/password-reset/confirm", response_model=None)
async def confirm_password_reset(
    command: PasswordResetConfirmCommand,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Any = Depends(get_redis_client),
) -> dict[str, str]:

    use_case = ResetPasswordUseCase(
        user_repo=SQLAlchemyUserRepository(db),
        email_service=ResendEmailService(),
        password_hasher=PasswordHasher(),
        redis=redis,
    )

    result = await use_case.confirm_reset(
        command.token,
        command.new_password,
    )

    return result.model_dump()


@router.post("/google/token", response_model=TokenResponse)
async def google_token_exchange(
    command: GoogleIDTokenCommand,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Exchange a Google id_token (from NextAuth) for a Pytomatiza+ JWT pair.

    This endpoint is called server-side by the NextAuth jwt() callback
    immediately after the user completes Google OAuth. It validates the
    Google id_token, creates the user account if it does not exist,
    and returns { access_token, refresh_token } for the backend.

    This is NOT a browser-facing redirect — it is a server-to-server call.
    """
    try:
        use_case = OAuthGoogleLoginUseCase(
            user_repo=SQLAlchemyUserRepository(db),
            token_service=JWTTokenService(),
        )
        return await use_case.execute(id_token=command.id_token)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(
            "google_token_exchange FAILED: %s\n%s",
            exc,
            traceback.format_exc(),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error: {exc}",
        ) from exc


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Return the authenticated user's profile."""
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=str(current_user.email),
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
    )


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    name: str | None = None,
    email: str | None = None,
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> UserResponse:
    """Update the authenticated user's profile (name and/or email)."""
    from pytomatiza.domain.value_objects.email import Email

    repo = SQLAlchemyUserRepository(db)
    if name is not None and name.strip():
        current_user.name = name.strip()
    if email is not None and email.strip():
        current_user.email = Email(email.strip())
    updated = await repo.save(current_user)
    return UserResponse(
        id=updated.id, name=updated.name, email=str(updated.email),
        is_verified=updated.is_verified, created_at=updated.created_at,
    )


@router.delete("/me", status_code=200)
async def delete_current_user_account(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Any = Depends(get_redis_client),
) -> dict:
    """Permanently delete the authenticated user's account and all associated data."""
    user_id = current_user.id

    # Deactivate first (prevents new logins)
    current_user.deactivate()
    repo = SQLAlchemyUserRepository(db)
    await repo.save(current_user)

    # Delete OAuth tokens
    token_repo = SQLAlchemyOAuthTokenRepository(db)
    for service in ("google", "drive", "photos", "gmail"):
        try:
            await token_repo.delete_by_user_and_service(user_id, "google", service)  # type: ignore[arg-type]
        except Exception:
            pass

    # Blacklist all tokens for this user
    from pytomatiza.infrastructure.security.jwt_token_service import JWTTokenService
    token_service = JWTTokenService()
    access_token, _ = token_service.generate_tokens(str(user_id))
    payload = token_service.decode_token(access_token)
    jti = str(payload.get("jti", ""))
    if jti:
        await redis.setex(f"blacklist:token:{jti}", 3600, "account_deleted")

    # Delete user from database
    await repo.delete(user_id)

    return {"message": "Account permanently deleted", "user_id": str(user_id)}


@router.get("/me/export", response_model=dict)
async def export_user_data(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Export all user data in a portable format (GDPR/LGPD portability right)."""
    from sqlalchemy import select
    from pytomatiza.infrastructure.db.models.agent_model import AgentModel
    from pytomatiza.infrastructure.db.models.automation_run_model import AutomationRunModel
    from pytomatiza.infrastructure.db.models.workflow_model import WorkflowModel

    agents = (await db.execute(select(AgentModel).where(AgentModel.owner_id == current_user.id))).scalars().all()
    workflows = (await db.execute(select(WorkflowModel).where(WorkflowModel.owner_id == current_user.id))).scalars().all()
    runs = (await db.execute(select(AutomationRunModel).where(AutomationRunModel.user_id == current_user.id).limit(100))).scalars().all()

    return {
        "user": {
            "id": str(current_user.id),
            "name": current_user.name,
            "email": str(current_user.email),
            "is_verified": current_user.is_verified,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        },
        "agents": [{"id": str(a.id), "name": a.name, "agent_type": a.agent_type, "status": a.status} for a in agents],
        "workflows": [{"id": str(w.id), "name": w.name, "status": str(w.status), "steps": len(w.steps)} for w in workflows],
        "automation_runs": [{"id": str(r.id), "workflow_id": str(r.workflow_id) if r.workflow_id else None, "status": str(r.status), "created_at": r.created_at.isoformat() if r.created_at else None} for r in runs],
        "exported_at": datetime.now(timezone.utc).isoformat(),
    }