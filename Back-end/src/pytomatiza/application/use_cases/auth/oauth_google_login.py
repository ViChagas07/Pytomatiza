"""OAuthGoogleLoginUseCase — handles Google OIDC authentication via authlib.

Creates or retrieves a user from Google ID token claims, marking OAuth origin.
Validates the ID token against Google's official tokeninfo endpoint.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import httpx

from pytomatiza.application.dtos.auth_dtos import TokenResponse
from pytomatiza.application.services.token_service import TokenService
from pytomatiza.config import settings
from pytomatiza.domain.entities.user import User
from pytomatiza.domain.repositories.user_repository import UserRepository
from pytomatiza.domain.value_objects.email import Email

_GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


class OAuthGoogleLoginUseCase:
    """Authenticate or register a user via Google OIDC.

    Given a Google ID token, validate it with Google's tokeninfo endpoint,
    then either look up an existing user by email or create a new one.
    Returns JWT tokens for session management.
    """

    def __init__(
        self,
        user_repo: UserRepository,
        token_service: TokenService,
    ) -> None:
        self._user_repo = user_repo
        self._token_service = token_service

    async def execute(self, id_token: str) -> TokenResponse:
        """Execute Google OAuth login.

        Args:
            id_token: The raw Google ID token string from the frontend.

        Returns:
            TokenResponse with access and refresh tokens.

        Raises:
            ValueError: if the ID token is invalid or audience mismatch.
        """
        claims = await self._validate_google_id_token(id_token)
        email = claims["email"]
        name = claims.get("name", email.split("@")[0])

        user = await self._user_repo.find_by_email(email)
        if user is not None:
            return self._token_service.generate_tokens(str(user.id))

        new_user = User(
            id=uuid.uuid4(),
            email=Email(email),
            hashed_password=None,
            name=name,
            is_active=True,
            is_verified=True,  # Google already verified the email
            oauth_provider="google",
            created_at=datetime.now(timezone.utc),
        )
        saved_user = await self._user_repo.save(new_user)
        return self._token_service.generate_tokens(str(saved_user.id))

    @staticmethod
    async def _validate_google_id_token(id_token: str) -> dict:
        """Validate a Google-issued ID token via Google's tokeninfo endpoint.

        This performs audience validation against our GOOGLE_CLIENT_ID.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                _GOOGLE_TOKENINFO_URL,
                params={"id_token": id_token},
            )
            if response.status_code != 200:
                raise ValueError(
                    f"Google token validation failed: {response.text}"
                )
            claims = response.json()

        # Verify the audience matches our client ID
        if claims.get("aud") != settings.GOOGLE_CLIENT_ID:
            raise ValueError("ID token audience does not match client ID.")

        # Verify email is verified by Google
        if not claims.get("email_verified", False):
            raise ValueError("Google account email is not verified.")

        return claims
