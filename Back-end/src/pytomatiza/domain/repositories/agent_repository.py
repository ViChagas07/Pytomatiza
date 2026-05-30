"""AgentRepository interface — structural Protocol."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from pytomatiza.domain.entities.agent import Agent


class AgentRepository(Protocol):
    """Data access contract for Agent entities."""

    async def find_by_id(self, agent_id: UUID) -> Agent | None: ...

    async def find_all(self, owner_id: UUID | None = None) -> list[Agent]: ...

    async def save(self, agent: Agent) -> Agent: ...

    async def delete(self, agent_id: UUID) -> None: ...
