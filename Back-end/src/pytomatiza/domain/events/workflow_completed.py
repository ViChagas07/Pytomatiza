"""Domain events for workflow lifecycle."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from pytomatiza.domain.events.user_registered import DomainEvent


@dataclass(frozen=True)
class WorkflowCreated(DomainEvent):
    """Emitted when a new workflow is created."""

    workflow_id: UUID
    agent_id: UUID
    user_id: UUID
    status: str


@dataclass(frozen=True)
class WorkflowApproved(DomainEvent):
    """Emitted when a pending workflow is approved."""

    workflow_id: UUID
    approved_by: UUID


@dataclass(frozen=True)
class WorkflowCompleted(DomainEvent):
    """Emitted when an automation workflow finishes execution."""

    workflow_id: UUID
    user_id: UUID
    result_status: str  # "success" | "failure"
    completed_at: datetime = datetime.now(timezone.utc)
