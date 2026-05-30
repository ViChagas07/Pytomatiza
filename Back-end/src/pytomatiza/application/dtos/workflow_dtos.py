"""Workflow DTOs — command/query/response models for workflow endpoints."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CreateNLPWorkflowCommand(BaseModel):
    """Natural language prompt to create a workflow."""

    prompt: str = Field(min_length=3, max_length=2000)
    name: str = Field(min_length=1, max_length=120, default="")


class WorkflowResponse(BaseModel):
    """Public workflow data returned to clients."""

    id: UUID
    name: str
    description: str
    natural_language_prompt: str
    steps: list[dict[str, object]]
    status: str
    owner_id: UUID
    agent_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkflowApprovalCommand(BaseModel):
    """Payload for approving or denying a workflow."""

    approved: bool


class WorkflowListResponse(BaseModel):
    """Paginated list of workflows."""

    items: list[WorkflowResponse]
    total: int
    page: int
    per_page: int
    pages: int
