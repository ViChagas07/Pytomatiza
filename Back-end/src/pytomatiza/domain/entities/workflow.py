"""Workflow domain entity — a pipeline of steps built from natural language."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pytomatiza.domain.events.workflow_completed import (
    WorkflowApproved,
    WorkflowCompleted,
    WorkflowCreated,
)


class WorkflowStatus(StrEnum):
    """Lifecycle states of a workflow."""

    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    DENIED = "denied"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Workflow:
    """A user-defined automation workflow consisting of sequential steps.

    Workflows are typically created from natural language instructions
    parsed by an NLP agent and must be approved before execution.
    """

    id: UUID
    name: str
    description: str
    natural_language_prompt: str
    steps: list[dict]  # each step: {"tool": str, "action": str, "params": dict}
    status: WorkflowStatus
    owner_id: UUID
    agent_id: UUID | None
    created_at: datetime
    updated_at: datetime
    _events: list = field(default_factory=list, repr=False, compare=False)

    def submit_for_approval(self) -> None:
        """Transition from draft to pending approval."""
        if self.status != WorkflowStatus.DRAFT:
            raise ValueError(
                f"Cannot submit workflow in status {self.status.value!r}."
            )
        self.status = WorkflowStatus.PENDING_APPROVAL

    def approve(self, approved_by: UUID) -> None:
        """Approve the workflow so it can be executed."""
        if self.status != WorkflowStatus.PENDING_APPROVAL:
            raise ValueError(
                f"Cannot approve workflow in status {self.status.value!r}."
            )
        self.status = WorkflowStatus.APPROVED
        self._events.append(
            WorkflowApproved(workflow_id=self.id, approved_by=approved_by)
        )

    def deny(self) -> None:
        """Deny the workflow."""
        if self.status != WorkflowStatus.PENDING_APPROVAL:
            raise ValueError(
                f"Cannot deny workflow in status {self.status.value!r}."
            )
        self.status = WorkflowStatus.DENIED

    def start_execution(self) -> None:
        """Mark the workflow as running."""
        if self.status != WorkflowStatus.APPROVED:
            raise ValueError(
                f"Cannot execute workflow in status {self.status.value!r}."
            )
        self.status = WorkflowStatus.RUNNING

    def complete(self, result_status: str) -> None:
        """Mark the workflow as completed (success or failure)."""
        if self.status != WorkflowStatus.RUNNING:
            raise ValueError(
                f"Cannot complete workflow in status {self.status.value!r}."
            )
        if result_status == "success":
            self.status = WorkflowStatus.COMPLETED
        else:
            self.status = WorkflowStatus.FAILED
        self._events.append(
            WorkflowCompleted(
                workflow_id=self.id,
                user_id=self.owner_id,
                result_status=result_status,
            )
        )

    def pull_events(self) -> list:
        """Return and clear collected domain events."""
        events, self._events = self._events, []
        return events
