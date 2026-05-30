"""Dashboard router — aggregated stats for the Pytomatiza+ frontend."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user, get_db
from pytomatiza.infrastructure.db.models.agent_model import AgentModel
from pytomatiza.infrastructure.db.models.automation_run_model import AutomationRunModel
from pytomatiza.infrastructure.db.models.workflow_model import WorkflowModel

router = APIRouter()


class DashboardStatsResponse(BaseModel):
    """Aggregated dashboard statistics for the current user."""

    activeAgents: int
    automationsToday: int
    successRate: float
    pendingApprovals: int

    model_config = {"from_attributes": True}


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DashboardStatsResponse:
    """Return dashboard statistics for the authenticated user.

    Aggregates:
    - Active agents count
    - Automations executed today
    - Overall success rate (percentage)
    - Workflows pending approval
    """

    # Count active agents
    active_agents_result = await db.execute(
        select(func.count(AgentModel.id)).where(
            AgentModel.owner_id == current_user.id,
            AgentModel.status == "active",
        )
    )
    active_agents = active_agents_result.scalar() or 0

    # Count automations created today (UTC)
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    automations_today_result = await db.execute(
        select(func.count(AutomationRunModel.id)).where(
            AutomationRunModel.user_id == current_user.id,
            AutomationRunModel.created_at >= today_start,
        )
    )
    automations_today = automations_today_result.scalar() or 0

    # Calculate success rate: successful / total finished (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc)
    thirty_days_ago = thirty_days_ago.replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    # Use a simpler approach — subtract 30 days
    from datetime import timedelta
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

    total_finished_result = await db.execute(
        select(func.count(AutomationRunModel.id)).where(
            AutomationRunModel.user_id == current_user.id,
            AutomationRunModel.created_at >= thirty_days_ago,
            AutomationRunModel.status.in_(["success", "failed"]),
        )
    )
    total_finished = total_finished_result.scalar() or 0

    successful_result = await db.execute(
        select(func.count(AutomationRunModel.id)).where(
            AutomationRunModel.user_id == current_user.id,
            AutomationRunModel.created_at >= thirty_days_ago,
            AutomationRunModel.status == "success",
        )
    )
    successful = successful_result.scalar() or 0

    success_rate = round((successful / total_finished * 100), 1) if total_finished > 0 else 100.0

    # Count pending workflow approvals
    pending_approvals_result = await db.execute(
        select(func.count(WorkflowModel.id)).where(
            WorkflowModel.owner_id == current_user.id,
            WorkflowModel.status == "pending_approval",
        )
    )
    pending_approvals = pending_approvals_result.scalar() or 0

    return DashboardStatsResponse(
        activeAgents=active_agents,
        automationsToday=automations_today,
        successRate=success_rate,
        pendingApprovals=pending_approvals,
    )
