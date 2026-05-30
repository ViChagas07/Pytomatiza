"""Agent DTOs — command/query/response models for agent endpoints."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AgentResponse(BaseModel):
    """Public agent data returned to clients."""

    id: UUID
    name: str
    description: str
    agent_type: str
    status: str
    config: dict[str, object]
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ActivateAgentCommand(BaseModel):
    """Payload to activate or deactivate an agent."""

    active: bool


class AgentListResponse(BaseModel):
    """Paginated list of agents."""

    items: list[AgentResponse]
    total: int
    page: int
    per_page: int
    pages: int
