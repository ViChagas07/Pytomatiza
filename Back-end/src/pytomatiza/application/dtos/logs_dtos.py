"""Logs DTOs."""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class LogEntry(BaseModel):
    id: str
    workflow_name: str = ""
    workflow_id: str = ""
    agent_type: str = ""
    status: str
    started_at: datetime | None = None
    finished_at: datetime | None = None
    error_message: str | None = None
    duration_ms: float = 0.0


class LogsListResponse(BaseModel):
    items: list[LogEntry]
    total: int
    page: int
    per_page: int
    pages: int


class LogsStatsResponse(BaseModel):
    total_executions: int
    success_rate: float
    errors_24h: int
    pending_approvals: int
    avg_duration_ms: float = 0.0
