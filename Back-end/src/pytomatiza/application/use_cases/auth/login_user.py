"""LoginUserUseCase — handles credentials-based authentication.

Validates email/password, checks account state, sends login notification email,
and returns JWT tokens.
"""

from __future__ import annotations

from pytomatiza.application.dtos.auth_dtos import LoginCommand, TokenResponse
from pytomatiza.application.services.email_service import EmailService
from pytomatiza.application.services.password_hasher import PasswordHasher
from pytomatiza.application.services.token_service import TokenService
from pytomatiza.domain.exceptions.auth_exceptions import (
    AccountNotVerified,
    InvalidCredentials,
)
from pytomatiza.domain.repositories.user_repository import UserRepository


class LoginUserUseCase:
    """Authenticate a user by email and password.

    Checks that the credentials match and the account is active + verified,
    then issues a JWT token pair and sends a login notification email.
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

    async def execute(self, command: LoginCommand) -> TokenResponse:
        """Execute the login use case.

        Raises:
            InvalidCredentials: if the email or password is wrong.
            AccountNotVerified: if the account email has not been verified.
        """
        user = await self._user_repo.find_by_email(command.email)
        if user is None:
            raise InvalidCredentials("Invalid email or password.")

        if not self._password_hasher.verify(command.password, user.hashed_password or ""):
            raise InvalidCredentials("Invalid email or password.")

        if not user.is_active:
            raise InvalidCredentials("Account is deactivated.")

        if not user.is_verified and user.oauth_provider is None:
            raise AccountNotVerified("Please verify your email before logging in.")

        await self._email_service.send_login_notification_email(
            to=str(user.email),
            name=user.name,
        )

        return self._token_service.generate_tokens(str(user.id))
