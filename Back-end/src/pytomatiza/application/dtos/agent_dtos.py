"""Agent DTOs — command/query/response models for agent endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class AgentRecommendation(BaseModel):
    """Alternative agent suggestion returned when the current agent cannot
    handle the user's request."""

    agent_type: str
    label: str
    reason: str  # e.g. "Este agente pode processar planilhas e gerar relatórios."
    tools: list[str] = []


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

    # ── Run‑result metadata (populated by RunAgentUseCase) ──────────
    accepted: bool | None = None
    """Whether the agent accepted the user's request."""
    refusal_reason: str | None = None
    """Human‑readable explanation when *accepted* is False."""
    recommendation: AgentRecommendation | None = None
    """Suggested alternative agent when the request is out of scope."""

    model_config = {"from_attributes": True}


class RunAgentCommand(BaseModel):
    """Payload to trigger an agent execution with a natural‑language prompt."""

    prompt: str = ""
    """What the user wants the agent to do (e.g. 'Gerar um relatório de vendas').
    When empty the agent runs its default behaviour without capability checks."""


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
