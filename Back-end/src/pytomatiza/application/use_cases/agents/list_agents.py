"""ListAgentsUseCase — returns all agents owned by the current user."""

from __future__ import annotations

from uuid import UUID

from pytomatiza.application.dtos.agent_dtos import AgentListResponse, AgentResponse
from pytomatiza.domain.repositories.agent_repository import AgentRepository


class ListAgentsUseCase:
    """List agents available to the authenticated user.

    Returns a paginated list (currently returns all — pagination can be added
    when the agent catalog grows).
    """

    def __init__(self, agent_repo: AgentRepository) -> None:
        self._agent_repo = agent_repo

    async def execute(self, owner_id: UUID, page: int = 1, per_page: int = 20) -> AgentListResponse:
        """Return all agents owned by the given user."""
        agents = await self._agent_repo.find_all(owner_id=owner_id)
        return AgentListResponse(
            items=[AgentResponse.model_validate(a, from_attributes=True) for a in agents],
            total=len(agents),
            page=page,
            per_page=per_page,
            pages=max(1, (len(agents) + per_page - 1) // per_page),
        )
