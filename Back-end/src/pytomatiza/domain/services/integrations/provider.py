"""Integration Provider Protocol — contract for third‑party service integrations."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable
from uuid import UUID


@dataclass(frozen=True)
class IntegrationHealth:
    """Health status of a third‑party integration."""
    service: str
    connected: bool
    status: str  # "connected" | "disconnected" | "error"
    message: str = ""
    details: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class IntegrationAction:
    """Result of an integration action execution."""
    success: bool
    action: str
    result: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


@runtime_checkable
class IntegrationProvider(Protocol):
    """Contract for all third‑party service integrations."""

    @property
    def service_name(self) -> str: ...

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth: ...

    async def execute_action(self, action: str, params: dict[str, Any], user_id: UUID | None = None) -> IntegrationAction: ...

    async def validate_credentials(self) -> bool: ...
