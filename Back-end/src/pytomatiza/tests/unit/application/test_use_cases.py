"""Unit tests for application use cases."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from pytomatiza.application.dtos.auth_dtos import LoginCommand, RegisterUserCommand
from pytomatiza.application.dtos.agent_dtos import ActivateAgentCommand
from pytomatiza.application.use_cases.agents.activate_agent import ActivateAgentUseCase
from pytomatiza.application.use_cases.auth.login_user import LoginUserUseCase
from pytomatiza.application.use_cases.auth.register_user import RegisterUserUseCase
from pytomatiza.domain.exceptions.auth_exceptions import (
    AccountNotVerified,
    EmailAlreadyRegistered,
    InvalidCredentials,
)
from pytomatiza.domain.exceptions.base import EntityNotFound


class TestRegisterUserUseCase:
    """Tests for the RegisterUserUseCase."""

    async def test_register_success(
        self,
        mock_user_repository,
        mock_email_service,
        mock_token_service,
        mock_password_hasher,
    ) -> None:
        mock_user_repository.find_by_email.return_value = None
        mock_password_hasher.hash.return_value = "hashed_pwd"
        mock_token_service.generate_tokens.return_value = MagicMock()

        use_case = RegisterUserUseCase(
            user_repo=mock_user_repository,
            email_service=mock_email_service,
            token_service=mock_token_service,
            password_hasher=mock_password_hasher,
        )
        command = RegisterUserCommand(
            name="John Doe",
            email="john@example.com",
            password="securepass123",
        )
        result = await use_case.execute(command)

        assert mock_token_service.generate_tokens.called
        mock_email_service.send_welcome_email.assert_awaited_once()

    async def test_register_duplicate_email(
        self,
        mock_user_repository,
        mock_email_service,
        mock_token_service,
        mock_password_hasher,
    ) -> None:
        from pytomatiza.domain.entities.user import User
        from pytomatiza.domain.value_objects.email import Email
        import uuid
        from datetime import datetime, timezone

        existing = User(
            id=uuid.uuid4(),
            email=Email("john@example.com"),
            hashed_password="x",
            name="Existing",
            is_active=True,
            is_verified=True,
            oauth_provider=None,
            created_at=datetime.now(timezone.utc),
        )
        mock_user_repository.find_by_email.return_value = existing

        use_case = RegisterUserUseCase(
            user_repo=mock_user_repository,
            email_service=mock_email_service,
            token_service=mock_token_service,
            password_hasher=mock_password_hasher,
        )
        command = RegisterUserCommand(
            name="John Doe",
            email="john@example.com",
            password="securepass123",
        )
        with pytest.raises(EmailAlreadyRegistered):
            await use_case.execute(command)


class TestLoginUserUseCase:
    """Tests for the LoginUserUseCase."""

    async def test_login_success(
        self,
        mock_user_repository,
        mock_email_service,
        mock_token_service,
        mock_password_hasher,
        sample_user,
    ) -> None:
        mock_user_repository.find_by_email.return_value = sample_user
        mock_password_hasher.verify.return_value = True
        mock_token_service.generate_tokens.return_value = MagicMock()

        use_case = LoginUserUseCase(
            user_repo=mock_user_repository,
            email_service=mock_email_service,
            token_service=mock_token_service,
            password_hasher=mock_password_hasher,
        )
        command = LoginCommand(email="test@example.com", password="correct")
        result = await use_case.execute(command)

        assert mock_token_service.generate_tokens.called

    async def test_login_invalid_credentials(
        self,
        mock_user_repository,
        mock_email_service,
        mock_token_service,
        mock_password_hasher,
    ) -> None:
        mock_user_repository.find_by_email.return_value = None

        use_case = LoginUserUseCase(
            user_repo=mock_user_repository,
            email_service=mock_email_service,
            token_service=mock_token_service,
            password_hasher=mock_password_hasher,
        )
        command = LoginCommand(email="wrong@example.com", password="wrong")
        with pytest.raises(InvalidCredentials):
            await use_case.execute(command)


class TestActivateAgentUseCase:
    """Tests for the ActivateAgentUseCase."""

    async def test_activate_agent_success(
        self, mock_agent_repository, sample_agent
    ) -> None:
        mock_agent_repository.find_by_id.return_value = sample_agent
        mock_agent_repository.save.return_value = sample_agent

        use_case = ActivateAgentUseCase(agent_repo=mock_agent_repository)
        command = ActivateAgentCommand(active=True)
        result = await use_case.execute(agent_id=sample_agent.id, command=command)

        assert result.status == "active"

    async def test_activate_nonexistent_agent(
        self, mock_agent_repository
    ) -> None:
        import uuid

        mock_agent_repository.find_by_id.return_value = None

        use_case = ActivateAgentUseCase(agent_repo=mock_agent_repository)
        command = ActivateAgentCommand(active=True)
        with pytest.raises(EntityNotFound):
            await use_case.execute(agent_id=uuid.uuid4(), command=command)
