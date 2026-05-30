"""AutomationRun domain entity — records of automation execution runs."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import StrEnum
from uuid import UUID


class RunStatus(StrEnum):
    """Possible statuses for an automation run."""

    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class AutomationRun:
    """A record of a single execution of an agent or workflow.

    Tracks the lifecycle of an automation execution from trigger to result.
    """

    id: UUID
    workflow_id: UUID | None
    agent_id: UUID | None
    user_id: UUID
    status: RunStatus
    input_payload: dict[str, object] | None
    output_result: dict[str, object] | None
    error_message: str | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime

    def start(self) -> None:
        self.status = RunStatus.RUNNING
        self.started_at = datetime.now(timezone.utc)

    def succeed(self, output: dict[str, object]) -> None:
        self.status = RunStatus.SUCCESS
        self.output_result = output
        self.finished_at = datetime.now(timezone.utc)

    def fail(self, error_message: str) -> None:
        self.status = RunStatus.FAILED
        self.error_message = error_message
        self.finished_at = datetime.now(timezone.utc)

    def cancel(self) -> None:
        self.status = RunStatus.CANCELLED
        self.finished_at = datetime.now(timezone.utc)
