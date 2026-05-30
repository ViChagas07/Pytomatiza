"""ResetPasswordUseCase — password reset flow (request + confirm).

Step 1: request generates a short-lived token and emails it via Resend.
Step 2: confirm validates the token and updates the password.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import redis.asyncio as aioredis

from pytomatiza.application.dtos.auth_dtos import MessageResponse
from pytomatiza.application.services.email_service import EmailService
from pytomatiza.application.services.password_hasher import PasswordHasher
from pytomatiza.config import settings
from pytomatiza.domain.exceptions.auth_exceptions import (
    PasswordResetTokenExpired,
    PasswordResetTokenInvalid,
)
from pytomatiza.domain.repositories.user_repository import UserRepository


class ResetPasswordUseCase:
    """Handle password reset request and confirmation.

    The reset token is stored in Redis with a configurable TTL. Once used,
    the token is consumed and cannot be reused.
    """

    RESET_TOKEN_PREFIX = "pwdreset:"

    def __init__(
        self,
        user_repo: UserRepository,
        email_service: EmailService,
        password_hasher: PasswordHasher,
        redis: aioredis.Redis,
    ) -> None:
        self._user_repo = user_repo
        self._email_service = email_service
        self._password_hasher = password_hasher
        self._redis = redis

    async def request_reset(self, email: str) -> MessageResponse:
        """Generate a reset token and send it via email.

        Always returns a success message to prevent email enumeration.
        """
        user = await self._user_repo.find_by_email(email)
        if user is not None:
            token = str(uuid.uuid4())
            key = f"{self.RESET_TOKEN_PREFIX}{token}"
            await self._redis.setex(
                key,
                settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES * 60,
                str(user.id),
            )
            reset_link = (
                f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
            )
            await self._email_service.send_password_reset_email(
                to=str(user.email),
                reset_link=reset_link,
            )
        return MessageResponse(
            message="If the email exists, a password reset link has been sent."
        )

    async def confirm_reset(self, token: str, new_password: str) -> MessageResponse:
        """Validate the reset token and update the user's password."""
        key = f"{self.RESET_TOKEN_PREFIX}{token}"
        user_id_str = await self._redis.get(key)
        if user_id_str is None:
            raise PasswordResetTokenInvalid(
                "Invalid or expired password reset token."
            )
        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError as exc:
            raise PasswordResetTokenInvalid(
                "Invalid or expired password reset token."
            ) from exc

        user = await self._user_repo.find_by_id(user_id)
        if user is None:
            raise PasswordResetTokenInvalid("User not found.")

        user.change_password(self._password_hasher.hash(new_password))
        await self._user_repo.save(user)
        await self._redis.delete(key)

        return MessageResponse(message="Password has been reset successfully.")
