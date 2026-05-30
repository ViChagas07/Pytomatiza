"""AutomationRun DTOs — response models for automation run endpoints."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AutomationRunResponse(BaseModel):
    """Public automation run data returned to clients."""

    id: UUID
    workflow_id: UUID | None
    agent_id: UUID | None
    user_id: UUID
    status: str
    input_payload: dict[str, object] | None
    output_result: dict[str, object] | None
    error_message: str | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AutomationRunListResponse(BaseModel):
    """Paginated list of automation runs."""

    items: list[AutomationRunResponse]
    total: int
    page: int
    per_page: int
    pages: int
