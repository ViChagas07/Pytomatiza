"""Mock Integration Providers — Development-only stubs for external APIs.

These providers return realistic mock responses for Slack, Jira, Discord, etc.
so you can demo workflows without real credentials. Enable with MOCK_INTEGRATIONS=true.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from pytomatiza.config import settings
from pytomatiza.domain.entities.integration_token import IntegrationToken
from pytomatiza.domain.services.integrations.provider import (
    IntegrationAction,
    IntegrationHealth,
    IntegrationProvider,
)

logger = logging.getLogger(__name__)


@dataclass
class MockProviderBase(IntegrationProvider):
    """Base class for mock providers with common behavior."""

    service_name: str
    label: str
    icon: str
    category: str

    def _mock_token(self, user_id: UUID | None = None) -> IntegrationToken | None:
        """Return a fake token for development."""
        if user_id is None:
            return None
        return IntegrationToken(
            id=uuid.uuid4(),
            user_id=user_id,
            provider=self.service_name,
            service=self.service_name,
            access_token=f"mock_{self.service_name}_token_{uuid.uuid4().hex[:8]}",
            refresh_token=None,
            expires_at=None,
            scope="mock",
            external_account_id=f"mock_{self.service_name}_account",
            external_account_name=f"Mock {self.label} Account",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

    async def authenticate(self, user_id: UUID, **kwargs: Any) -> IntegrationToken:
        """Mock authentication — always succeeds in dev mode."""
        logger.info("Mock auth for %s user=%s", self.service_name, user_id)
        return self._mock_token(user_id)

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        """Mock health check — always connected in dev mode."""
        token = self._mock_token(user_id)
        if token is None:
            return IntegrationHealth(
                service=self.service_name,
                connected=False,
                status="disconnected",
                message=f"{self.label} não conectado (modo mock: faça login para simular)",
            )
        return IntegrationHealth(
            service=self.service_name,
            connected=True,
            status="connected",
            message=f"✓ Mock {self.label} conectado (desenvolvimento)",
            details={
                "mode": "mock",
                "account": token.external_account_name,
                "note": "Respostas simuladas — não há chamada real de API",
            },
        )

    async def execute_action(
        self, action: str, params: dict[str, Any], user_id: UUID | None = None
    ) -> IntegrationAction:
        """Execute a mock action — returns realistic fake data."""
        logger.info("Mock execute %s.%s for user=%s", self.service_name, action, user_id)

        # Simulate network delay for realism
        import asyncio
        await asyncio.sleep(0.1)

        return IntegrationAction(
            success=True,
            action=action,
            result=self._mock_response(action, params),
            error=None,
        )

    def _mock_response(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        """Override in subclasses to provide service-specific mock responses."""
        return {"mock": True, "action": action, "params": params}


class MockSlackProvider(MockProviderBase):
    """Mock Slack provider — simulates channels, messages, users."""

    def __init__(self) -> None:
        super().__init__(
            service_name="slack",
            label="Slack",
            icon="slack",
            category="communication",
        )

    def _mock_response(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        if action == "send_message":
            return {
                "ok": True,
                "channel": params.get("channel", "C1234567890"),
                "ts": f"{datetime.now().timestamp():.6f}",
                "message": {
                    "type": "message",
                    "user": "U123MOCKBOT",
                    "text": params.get("text", "Mensagem mock"),
                    "ts": f"{datetime.now().timestamp():.6f}",
                },
                "_mock": True,
                "_note": "Mensagem simulada — não foi enviada ao Slack real",
            }

        if action == "list_channels":
            return {
                "ok": True,
                "channels": [
                    {"id": "C1234567890", "name": "general", "is_channel": True, "is_private": False},
                    {"id": "C1234567891", "name": "random", "is_channel": True, "is_private": False},
                    {"id": "C1234567892", "name": "dev-team", "is_channel": True, "is_private": True},
                    {"id": "C1234567893", "name": "alertas", "is_channel": True, "is_private": False},
                ],
                "_mock": True,
            }

        if action == "get_user":
            return {
                "ok": True,
                "user": {
                    "id": "U123MOCKUSER",
                    "name": "usuario.mock",
                    "real_name": "Usuário Mock",
                    "profile": {"display_name": "Usuário Mock", "email": "mock@localhost"},
                },
                "_mock": True,
            }

        return {"ok": False, "error": f"unknown_action: {action}", "_mock": True}


class MockJiraProvider(MockProviderBase):
    """Mock Jira provider — simulates issues, projects, transitions."""

    def __init__(self) -> None:
        super().__init__(
            service_name="jira",
            label="Jira",
            icon="jira",
            category="project_management",
        )

    def _mock_response(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        issue_key = params.get("issue_key", "MOCK-123")

        if action == "create_issue":
            return {
                "id": "10000",
                "key": f"MOCK-{uuid.uuid4().hex[:4].upper()}",
                "self": "https://mock.atlassian.net/rest/api/2/issue/10000",
                "_mock": True,
                "_note": "Issue criado em mock — não existe no Jira real",
            }

        if action == "get_issue":
            return {
                "id": "10000",
                "key": issue_key,
                "fields": {
                    "summary": params.get("summary", "Tarefa mock do Pytomatiza+"),
                    "description": params.get("description", "Descrição simulada para demonstração"),
                    "status": {"name": "To Do", "statusCategory": {"name": "To Do"}},
                    "issuetype": {"name": "Task"},
                    "project": {"key": "MOCK", "name": "Mock Project"},
                    "assignee": {"displayName": "Usuário Mock", "emailAddress": "mock@localhost"},
                    "created": datetime.now(timezone.utc).isoformat(),
                },
                "_mock": True,
            }

        if action == "transition_issue":
            return {
                "ok": True,
                "transition": {"name": params.get("transition", "Done")},
                "_mock": True,
            }

        if action == "add_comment":
            return {
                "id": "10000",
                "body": params.get("comment", "Comentário mock"),
                "author": {"displayName": "Pytomatiza+ Bot"},
                "created": datetime.now(timezone.utc).isoformat(),
                "_mock": True,
            }

        if action == "search_issues":
            return {
                "total": 3,
                "issues": [
                    {"key": "MOCK-1", "fields": {"summary": "Issue mock 1", "status": {"name": "Done"}}},
                    {"key": "MOCK-2", "fields": {"summary": "Issue mock 2", "status": {"name": "In Progress"}}},
                    {"key": "MOCK-3", "fields": {"summary": "Issue mock 3", "status": {"name": "To Do"}}},
                ],
                "_mock": True,
            }

        return {"error": f"unknown_action: {action}", "_mock": True}


class MockDiscordProvider(MockProviderBase):
    """Mock Discord provider — simulates channels, messages, webhooks."""

    def __init__(self) -> None:
        super().__init__(
            service_name="discord",
            label="Discord",
            icon="discord",
            category="communication",
        )

    def _mock_response(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        if action == "send_message":
            return {
                "id": str(uuid.uuid4().int >> 64),
                "type": 0,
                "content": params.get("content", "Mensagem mock do Pytomatiza+"),
                "channel_id": params.get("channel_id", "123456789012345678"),
                "author": {
                    "id": "123456789012345678",
                    "username": "PytomatizaBot",
                    "discriminator": "0001",
                    "bot": True,
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "_mock": True,
                "_note": "Mensagem simulada — não foi enviada ao Discord real",
            }

        if action == "get_channels":
            return [
                {"id": "123456789012345678", "name": "geral", "type": 0},
                {"id": "123456789012345679", "name": "dev", "type": 0},
                {"id": "123456789012345680", "name": "alertas", "type": 5},
            ]

        if action == "create_webhook":
            return {
                "id": str(uuid.uuid4().int >> 64),
                "name": params.get("name", "Pytomatiza+ Webhook"),
                "channel_id": params.get("channel_id", "123456789012345678"),
                "token": f"mock_webhook_token_{uuid.uuid4().hex}",
                "url": f"https://discord.com/api/webhooks/mock/{uuid.uuid4().hex}",
                "_mock": True,
            }

        return {"error": f"unknown_action: {action}", "_mock": True}


class MockTrelloProvider(MockProviderBase):
    """Mock Trello provider — simulates boards, lists, cards."""

    def __init__(self) -> None:
        super().__init__(
            service_name="trello",
            label="Trello",
            icon="trello",
            category="project_management",
        )

    def _mock_response(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        if action == "create_card":
            return {
                "id": f"mock_card_{uuid.uuid4().hex[:8]}",
                "name": params.get("name", "Cartão mock"),
                "desc": params.get("desc", "Descrição simulada"),
                "idList": params.get("idList", "mock_list_1"),
                "url": "https://trello.com/c/mockcard",
                "_mock": True,
                "_note": "Cartão simulado — não existe no Trello real",
            }

        if action == "get_boards":
            return [
                {"id": "mock_board_1", "name": "Projeto Pytomatiza+", "url": "https://trello.com/b/mock1"},
                {"id": "mock_board_2", "name": "Backlog", "url": "https://trello.com/b/mock2"},
            ]

        if action == "get_lists":
            return [
                {"id": "mock_list_1", "name": "Backlog"},
                {"id": "mock_list_2", "name": "Em Andamento"},
                {"id": "mock_list_3", "name": "Revisão"},
                {"id": "mock_list_4", "name": "Concluído"},
            ]

        return {"error": f"unknown_action: {action}", "_mock": True}


class MockZoomProvider(MockProviderBase):
    """Mock Zoom provider — simulates meetings, recordings."""

    def __init__(self) -> None:
        super().__init__(
            service_name="zoom",
            label="Zoom",
            icon="zoom",
            category="communication",
        )

    def _mock_response(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        if action == "create_meeting":
            return {
                "id": 123456789,
                "uuid": str(uuid.uuid4()),
                "topic": params.get("topic", "Reunião Mock Pytomatiza+"),
                "start_time": params.get("start_time", datetime.now(timezone.utc).isoformat()),
                "duration": params.get("duration", 30),
                "join_url": "https://mock.zoom.us/j/123456789",
                "password": "mock123",
                "_mock": True,
                "_note": "Reunião simulada — não existe no Zoom real",
            }

        if action == "get_recordings":
            return {
                "meetings": [
                    {
                        "id": 123456789,
                        "topic": "Reunião Mock Anterior",
                        "start_time": "2024-01-15T10:00:00Z",
                        "recording_files": [
                            {"download_url": "https://mock.zoom.us/rec/mock.mp4", "file_type": "MP4"},
                        ],
                    }
                ],
                "_mock": True,
            }

        return {"error": f"unknown_action: {action}", "_mock": True}


class MockGoogleDriveProvider(MockProviderBase):
    """Mock Google Drive provider — simulates files, folders."""

    def __init__(self) -> None:
        super().__init__(
            service_name="google_drive",
            label="Google Drive",
            icon="googledrive",
            category="storage",
        )

    def _mock_response(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        if action == "upload_file":
            return {
                "id": f"mock_file_{uuid.uuid4().hex[:12]}",
                "name": params.get("name", "arquivo_mock.pdf"),
                "mimeType": params.get("mimeType", "application/pdf"),
                "size": "102400",
                "webViewLink": "https://drive.google.com/file/d/mock_file/view",
                "_mock": True,
                "_note": "Upload simulado — arquivo não foi enviado ao Google Drive real",
            }

        if action == "list_files":
            return {
                "files": [
                    {"id": "mock1", "name": "Relatório Q1.pdf", "mimeType": "application/pdf"},
                    {"id": "mock2", "name": "Planilha Orçamento.xlsx", "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
                    {"id": "mock3", "name": "Apresentação.pptx", "mimeType": "application/vnd.openxmlformats-officedocument.presentationml.presentation"},
                ],
                "_mock": True,
            }

        return {"error": f"unknown_action: {action}", "_mock": True}


class MockGmailProvider(MockProviderBase):
    """Mock Gmail provider — simulates emails, drafts, labels."""

    def __init__(self) -> None:
        super().__init__(
            service_name="gmail",
            label="Gmail",
            icon="gmail",
            category="communication",
        )

    def _mock_response(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        if action == "send_email":
            return {
                "id": f"mock_msg_{uuid.uuid4().hex[:12]}",
                "threadId": f"mock_thread_{uuid.uuid4().hex[:12]}",
                "labelIds": ["SENT"],
                "_mock": True,
                "_note": "Email simulado — não foi enviado via Gmail real",
            }

        if action == "create_draft":
            return {
                "id": f"mock_draft_{uuid.uuid4().hex[:12]}",
                "message": {
                    "id": f"mock_msg_{uuid.uuid4().hex[:12]}",
                    "threadId": f"mock_thread_{uuid.uuid4().hex[:12]}",
                },
                "_mock": True,
            }

        if action == "search_messages":
            return {
                "messages": [
                    {"id": "mock1", "threadId": "thread1", "snippet": "Email mock 1..."},
                    {"id": "mock2", "threadId": "thread2", "snippet": "Email mock 2..."},
                ],
                "resultSizeEstimate": 2,
                "_mock": True,
            }

        return {"error": f"unknown_action: {action}", "_mock": True}


class MockWhatsAppProvider(MockProviderBase):
    """Mock WhatsApp Business provider — simulates messages, templates."""

    def __init__(self) -> None:
        super().__init__(
            service_name="whatsapp",
            label="WhatsApp Business",
            icon="whatsapp",
            category="communication",
        )

    def _mock_response(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        if action == "send_message":
            return {
                "messages": [{
                    "id": f"wamid.mock_{uuid.uuid4().hex[:12]}",
                }],
                "_mock": True,
                "_note": "Mensagem WhatsApp simulada — não foi enviada via Meta API real",
            }

        if action == "send_template":
            return {
                "messages": [{
                    "id": f"wamid.mock_{uuid.uuid4().hex[:12]}",
                }],
                "_mock": True,
            }

        return {"error": f"unknown_action: {action}", "_mock": True}


class MockTelegramProvider(MockProviderBase):
    """Mock Telegram provider — simulates bot messages, updates."""

    def __init__(self) -> None:
        super().__init__(
            service_name="telegram",
            label="Telegram",
            icon="telegram",
            category="communication",
        )

    def _mock_response(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        if action == "send_message":
            return {
                "ok": True,
                "result": {
                    "message_id": 12345,
                    "date": int(datetime.now().timestamp()),
                    "chat": {"id": params.get("chat_id", 123456789), "type": "private"},
                    "text": params.get("text", "Mensagem mock"),
                },
                "_mock": True,
                "_note": "Mensagem Telegram simulada — não foi enviada via Bot API real",
            }

        return {"error": f"unknown_action: {action}", "_mock": True}


# ── Registry of all mock providers ─────────────────────────────────────────

_MOCK_PROVIDERS: dict[str, type[MockProviderBase]] = {
    "slack": MockSlackProvider,
    "jira": MockJiraProvider,
    "discord": MockDiscordProvider,
    "trello": MockTrelloProvider,
    "zoom": MockZoomProvider,
    "google_drive": MockGoogleDriveProvider,
    "gmail": MockGmailProvider,
    "whatsapp": MockWhatsAppProvider,
    "telegram": MockTelegramProvider,
}


def get_mock_provider(service: str) -> MockProviderBase | None:
    """Get a mock provider instance if MOCK_INTEGRATIONS is enabled."""
    if not settings.MOCK_INTEGRATIONS:
        return None
    provider_cls = _MOCK_PROVIDERS.get(service)
    if provider_cls:
        return provider_cls()
    return None


def list_mock_providers() -> list[str]:
    """List all available mock provider names."""
    return list(_MOCK_PROVIDERS.keys())