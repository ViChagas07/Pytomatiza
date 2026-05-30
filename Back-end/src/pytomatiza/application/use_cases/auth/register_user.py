"""RegisterUserUseCase — handles account registration with email verification.

Single responsibility: coordinate registration of a new user, including
persistence, welcome email dispatch via Resend, and JWT token generation.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from pytomatiza.application.dtos.auth_dtos import RegisterUserCommand, TokenResponse
from pytomatiza.application.services.email_service import EmailService
from pytomatiza.application.services.password_hasher import PasswordHasher
from pytomatiza.application.services.token_service import TokenService
from pytomatiza.domain.entities.user import User
from pytomatiza.domain.events.user_registered import UserRegistered
from pytomatiza.domain.exceptions.auth_exceptions import EmailAlreadyRegistered
from pytomatiza.domain.repositories.user_repository import UserRepository
from pytomatiza.domain.value_objects.email import Email


class RegisterUserUseCase:
    """Handle new user registration.

    Validates uniqueness, creates a User entity, persists it, dispatches
    the welcome email, and returns JWT tokens for immediate authentication.
    """

    def __init__(
        self,
        user_repo: UserRepository,
        email_service: EmailService,
        token_service: TokenService,
        password_hasher: PasswordHasher,
    ) -> None:
        self._user_repo = user_repo
        self._email_service = email_service
        self._token_service = token_service
        self._password_hasher = password_hasher

    async def execute(self, command: RegisterUserCommand) -> TokenResponse:
        """Execute the registration use case.

        Raises:
            EmailAlreadyRegistered: if the email is already in use.
        """
        existing = await self._user_repo.find_by_email(command.email)
        if existing is not None:
            raise EmailAlreadyRegistered(
                f"Email {command.email!r} is already registered."
            )

        hashed = self._password_hasher.hash(command.password)
        user = User(
            id=uuid.uuid4(),
            email=Email(command.email),
            hashed_password=hashed,
            name=command.name,
            is_active=True,
            is_verified=False,
            oauth_provider=None,
            created_at=datetime.now(timezone.utc),
        )
        user.verify_email()
        saved_user = await self._user_repo.save(user)

        for event in saved_user.pull_events():
            if isinstance(event, UserRegistered):
                await self._email_service.send_welcome_email(
                    to=str(saved_user.email),
                    name=saved_user.name,
                )

        return self._token_service.generate_tokens(str(saved_user.id))
