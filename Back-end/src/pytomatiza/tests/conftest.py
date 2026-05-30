"""Pytest configuration — shared fixtures for all test modules."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from pytomatiza.domain.entities.agent import Agent, AgentStatus
from pytomatiza.domain.entities.user import User
from pytomatiza.domain.entities.workflow import Workflow, WorkflowStatus
from pytomatiza.domain.value_objects.email import Email


@pytest.fixture
def sample_user() -> User:
    """Return a sample User entity for testing."""
    return User(
        id=uuid.uuid4(),
        email=Email("test@example.com"),
        hashed_password="hashed_secret",
        name="Test User",
        is_active=True,
        is_verified=True,
        oauth_provider=None,
        created_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def sample_agent(sample_user: User) -> Agent:
    """Return a sample Agent entity for testing."""
    return Agent(
        id=uuid.uuid4(),
        name="Test Agent",
        description="A test automation agent",
        agent_type="report_generator",
        status=AgentStatus.INACTIVE,
        config={"model": "gpt-4o"},
        owner_id=sample_user.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def sample_workflow(sample_user: User) -> Workflow:
    """Return a sample Workflow entity for testing."""
    return Workflow(
        id=uuid.uuid4(),
        name="Test Workflow",
        description="A test workflow",
        natural_language_prompt="Send a daily report email",
        steps=[{"tool": "email_sender", "action": "send", "params": {}}],
        status=WorkflowStatus.DRAFT,
        owner_id=sample_user.id,
        agent_id=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def mock_user_repository() -> AsyncMock:
    """Return a mock UserRepository for use case testing."""
    mock = AsyncMock()
    mock.find_by_id = AsyncMock(return_value=None)
    mock.find_by_email = AsyncMock(return_value=None)
    mock.save = AsyncMock()
    mock.delete = AsyncMock()
    return mock


@pytest.fixture
def mock_agent_repository() -> AsyncMock:
    """Return a mock AgentRepository for use case testing."""
    mock = AsyncMock()
    mock.find_by_id = AsyncMock(return_value=None)
    mock.list_by_owner = AsyncMock(return_value=[])
    mock.save = AsyncMock()
    return mock


@pytest.fixture
def mock_workflow_repository() -> AsyncMock:
    """Return a mock WorkflowRepository for use case testing."""
    mock = AsyncMock()
    mock.find_by_id = AsyncMock(return_value=None)
    mock.list_by_owner = AsyncMock(return_value=[])
    mock.save = AsyncMock()
    mock.delete = AsyncMock()
    return mock


@pytest.fixture
def mock_email_service() -> AsyncMock:
    """Return a mock EmailService for use case testing."""
    mock = AsyncMock()
    mock.send_welcome_email = AsyncMock()
    mock.send_password_reset_email = AsyncMock()
    mock.send_login_notification_email = AsyncMock()
    mock.send_verification_email = AsyncMock()
    return mock


@pytest.fixture
def mock_token_service() -> MagicMock:
    """Return a mock TokenService for use case testing."""
    mock = MagicMock()
    mock.generate_tokens = MagicMock(return_value=None)
    mock.decode_token = MagicMock(return_value={"sub": str(uuid.uuid4()), "type": "access"})
    return mock


@pytest.fixture
def mock_password_hasher() -> MagicMock:
    """Return a mock PasswordHasher for use case testing."""
    mock = MagicMock()
    mock.hash = MagicMock(return_value="hashed_password")
    mock.verify = MagicMock(return_value=True)
    return mock