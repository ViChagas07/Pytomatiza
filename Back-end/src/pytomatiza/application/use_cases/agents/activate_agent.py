"""ActivateAgentUseCase — toggles an agent between active and inactive state."""

from __future__ import annotations

from uuid import UUID

from pytomatiza.application.dtos.agent_dtos import ActivateAgentCommand, AgentResponse
from pytomatiza.domain.entities.agent import AgentStatus
from pytomatiza.domain.exceptions.base import EntityNotFound
from pytomatiza.domain.repositories.agent_repository import AgentRepository


class ActivateAgentUseCase:
    """Activate or deactivate a specific agent owned by the current user."""

    def __init__(self, agent_repo: AgentRepository) -> None:
        self._agent_repo = agent_repo

    async def execute(self, agent_id: UUID, command: ActivateAgentCommand) -> AgentResponse:
        """Toggle agent activation status."""
        agent = await self._agent_repo.find_by_id(agent_id)
        if agent is None:
            raise EntityNotFound(f"Agent {agent_id!r} not found.")

        if command.active:
            agent.activate()
        else:
            agent.deactivate()

        saved_agent = await self._agent_repo.save(agent)
        return AgentResponse.model_validate(saved_agent, from_attributes=True)
