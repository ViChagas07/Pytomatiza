"""Auth router — registration, login, OAuth, token refresh, logout, password reset."""

from __future__ import annotations

import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.application.dtos.auth_dtos import (
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
def _build_google_auth_url(scopes: str, state: str = "") -> str:
    """Build a Google OAuth authorization URL with the given scopes."""
    import urllib.parse

    params: dict[str, str] = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": scopes,
        "access_type": "offline",
        "prompt": "consent",
    }
    if state:
        params["state"] = state

    return (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + urllib.parse.urlencode(params)
    )


@router.get("/google", response_model=None)
async def google_oauth_redirect() -> dict[str, str]:
    """Return the Google OAuth authorization URL for authentication."""
    authorization_url = _build_google_auth_url(settings.GOOGLE_OIDC_SCOPES)
    return {"authorization_url": authorization_url}


@router.get("/google/drive", response_model=None)
async def google_drive_oauth_redirect() -> dict[str, str]:
    """Return the Google OAuth authorization URL with Drive scopes."""
    scopes = f"{settings.GOOGLE_OIDC_SCOPES} {settings.GOOGLE_DRIVE_SCOPES}"
    authorization_url = _build_google_auth_url(scopes, state="service:drive")
    return {"authorization_url": authorization_url}


@router.get("/google/photos", response_model=None)
async def google_photos_oauth_redirect() -> dict[str, str]:
    """Return the Google OAuth authorization URL with Photos scopes."""
    scopes = f"{settings.GOOGLE_OIDC_SCOPES} {settings.GOOGLE_PHOTOS_SCOPES}"
    authorization_url = _build_google_auth_url(scopes, state="service:photos")
    return {"authorization_url": authorization_url}


@router.get("/google/gmail", response_model=None)
async def google_gmail_oauth_redirect() -> dict[str, str]:
    """Return the Google OAuth authorization URL with Gmail scopes."""
    scopes = f"{settings.GOOGLE_OIDC_SCOPES} {settings.GOOGLE_GMAIL_SCOPES}"
    authorization_url = _build_google_auth_url(scopes, state="service:gmail")
    return {"authorization_url": authorization_url}


@router.get("/google/callback", response_model=None)
async def google_oauth_callback(
    db: Annotated[AsyncSession, Depends(get_db)],
    code: str = Query(...),
    state: str = Query(default=""),
) -> TokenResponse | RedirectResponse:
    """Handle the Google OAuth callback."""
    import httpx

    from pytomatiza.domain.entities.oauth_token import OAuthToken
    from pytomatiza.infrastructure.repositories.sqlalchemy_oauth_token_repository import (
        SQLAlchemyOAuthTokenRepository,
    )

    is_service_integration = state.startswith("service:")
    service_name = state.split(":", 1)[1] if is_service_integration else ""

    async with httpx.AsyncClient() as http_client:
        token_response = await http_client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_response.status_code != 200:
            if is_service_integration:
                return RedirectResponse(
                    f"{settings.FRONTEND_URL}/api/integrations/google/callback?"
                    f"success=false&error=auth_failed&service={service_name}"
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange Google authorization code.",
            )

        tokens: dict[str, Any] = token_response.json()
        id_token: str | None = tokens.get("id_token")
        if id_token is None:
            if is_service_integration:
                return RedirectResponse(
                    f"{settings.FRONTEND_URL}/api/integrations/google/callback?"
                    f"success=false&error=no_id_token&service={service_name}"
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No ID token in Google response.",
            )

    use_case = OAuthGoogleLoginUseCase(
        user_repo=SQLAlchemyUserRepository(db),
        token_service=JWTTokenService(),
    )
    try:
        jwt_token_response = await use_case.execute(id_token=id_token)
    except ValueError as exc:
        if is_service_integration:
            return RedirectResponse(
                f"{settings.FRONTEND_URL}/api/integrations/google/callback?"
                f"success=false&error=login_failed&service={service_name}"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    jwt_service = JWTTokenService()
    jwt_payload: dict[str, Any] = jwt_service.decode_token(jwt_token_response.access_token)
    raw_sub = jwt_payload.get("sub", "")
    stored_user_id = uuid.UUID(str(raw_sub))  # uuid importado no topo

    access_token: str | None = tokens.get("access_token")
    refresh_token: str | None = tokens.get("refresh_token")
    raw_expires = tokens.get("expires_in", 3600)
    expires_in: int = int(raw_expires) if isinstance(raw_expires, (int, float)) else 3600
    granted_scopes: str = str(tokens.get("scope", ""))

    if access_token:
        token_repo = SQLAlchemyOAuthTokenRepository(db)
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

        granted_scope_set = set(granted_scopes.split())
        drive_scope_set = set(settings.GOOGLE_DRIVE_SCOPES.split())
        photos_scope_set = set(settings.GOOGLE_PHOTOS_SCOPES.split())
        gmail_scope_set = set(settings.GOOGLE_GMAIL_SCOPES.split())

        if granted_scope_set & drive_scope_set:
            await token_repo.upsert(
                OAuthToken(
                    id=uuid4(),
                    user_id=stored_user_id,
                    provider="google",
                    service="drive",
                    access_token=access_token,
                    refresh_token=refresh_token,
                    token_type=str(tokens.get("token_type", "Bearer")),
                    scopes=granted_scopes,
                    expires_at=expires_at,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )

        if granted_scope_set & photos_scope_set:
            await token_repo.upsert(
                OAuthToken(
                    id=uuid4(),
                    user_id=stored_user_id,
                    provider="google",
                    service="photos",
                    access_token=access_token,
                    refresh_token=refresh_token,
                    token_type=str(tokens.get("token_type", "Bearer")),
                    scopes=granted_scopes,
                    expires_at=expires_at,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )

        if granted_scope_set & gmail_scope_set:
            await token_repo.upsert(
                OAuthToken(
                    id=uuid4(),
                    user_id=stored_user_id,
                    provider="google",
                    service="gmail",
                    access_token=access_token,
                    refresh_token=refresh_token,
                    token_type=str(tokens.get("token_type", "Bearer")),
                    scopes=granted_scopes,
                    expires_at=expires_at,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )

    if is_service_integration:
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/api/integrations/google/callback?"
            f"success=true&service={service_name}"
        )

    return jwt_token_response


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