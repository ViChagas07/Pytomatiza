"""Agent domain entity — represents an AI automation agent managed by CrewAI."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from uuid import UUID


class AgentStatus(StrEnum):
    """Possible statuses for an automation agent."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    CONFIGURING = "configuring"
    ERROR = "error"


@dataclass
class Agent:
    """An AI-powered automation agent capable of executing tasks.

    Agents are backed by CrewAI + LangChain and can be activated/deactivated
    by users who have purchased them.
    """

    id: UUID
    name: str
    description: str
    agent_type: str  # e.g. "report_generator", "email_responder", "data_transformer"
    status: AgentStatus
    config: dict[str, object]  # CrewAI-specific configuration
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    def activate(self) -> None:
        """Set the agent status to active."""
        if self.status == AgentStatus.CONFIGURING:
            raise ValueError("Cannot activate an agent that is still configuring.")
        self.status = AgentStatus.ACTIVE

    def deactivate(self) -> None:
        """Set the agent status to inactive."""
        self.status = AgentStatus.INACTIVE

    def mark_error(self) -> None:
        """Mark the agent as having encountered an error."""
        self.status = AgentStatus.ERROR
