"""Logs router — execution history from automation_runs and workflows."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.application.dtos.logs_dtos import LogEntry, LogsListResponse, LogsStatsResponse
from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user, get_db
from pytomatiza.infrastructure.db.models.automation_run_model import AutomationRunModel
from pytomatiza.infrastructure.db.models.workflow_model import WorkflowModel

router = APIRouter()


@router.get("/logs", response_model=LogsListResponse)
async def list_logs(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
) -> LogsListResponse:
    """Paginated execution log from automation runs."""
    query = select(AutomationRunModel).where(AutomationRunModel.user_id == current_user.id)
    if status_filter:
        query = query.where(AutomationRunModel.status == status_filter)
    query = query.order_by(desc(AutomationRunModel.created_at))

    count_q = select(func.count(AutomationRunModel.id)).where(AutomationRunModel.user_id == current_user.id)
    if status_filter:
        count_q = count_q.where(AutomationRunModel.status == status_filter)
    total = (await db.execute(count_q)).scalar() or 0

    runs = (await db.execute(query.offset((page - 1) * per_page).limit(per_page))).scalars().all()

    items: list[LogEntry] = []
    for run in runs:
        wf_name = ""
        if run.workflow_id:
            wf = await db.get(WorkflowModel, run.workflow_id)
            if wf:
                wf_name = wf.name
        duration = 0.0
        if run.started_at and run.finished_at:
            duration = (run.finished_at - run.started_at).total_seconds() * 1000
        items.append(LogEntry(
            id=str(run.id),
            workflow_name=wf_name,
            workflow_id=str(run.workflow_id) if run.workflow_id else "",
            agent_type=str(run.agent_id) if run.agent_id else "",
            status=str(run.status.value) if hasattr(run.status, 'value') else str(run.status),
            started_at=run.started_at,
            finished_at=run.finished_at,
            error_message=run.error_message,
            duration_ms=round(duration, 1),
        ))

    return LogsListResponse(items=items, total=total, page=page, per_page=per_page, pages=max(1, (total + per_page - 1) // per_page))


@router.get("/logs/stats", response_model=LogsStatsResponse)
async def logs_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LogsStatsResponse:
    """Aggregated execution statistics."""
    total = (await db.execute(select(func.count(AutomationRunModel.id)).where(AutomationRunModel.user_id == current_user.id))).scalar() or 0
    success = (await db.execute(select(func.count(AutomationRunModel.id)).where(AutomationRunModel.user_id == current_user.id, AutomationRunModel.status == "success"))).scalar() or 0
    yesterday = datetime.now(timezone.utc) - timedelta(hours=24)
    errors_24h = (await db.execute(select(func.count(AutomationRunModel.id)).where(AutomationRunModel.user_id == current_user.id, AutomationRunModel.status == "failed", AutomationRunModel.created_at >= yesterday))).scalar() or 0
    pending = (await db.execute(select(func.count(WorkflowModel.id)).where(WorkflowModel.owner_id == current_user.id, WorkflowModel.status == "pending_approval"))).scalar() or 0

    return LogsStatsResponse(
        total_executions=total,
        success_rate=round((success / total * 100), 1) if total > 0 else 100.0,
        errors_24h=errors_24h,
        pending_approvals=pending,
    )


@router.get("/logs/approvals", response_model=LogsListResponse)
async def pending_approvals(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LogsListResponse:
    """List workflows pending approval."""
    wfs = (await db.execute(select(WorkflowModel).where(WorkflowModel.owner_id == current_user.id, WorkflowModel.status == "pending_approval").order_by(desc(WorkflowModel.created_at)))).scalars().all()
    items = [LogEntry(id=str(w.id), workflow_name=w.name, workflow_id=str(w.id), status="pending_approval") for w in wfs]
    return LogsListResponse(items=items, total=len(items), page=1, per_page=len(items), pages=1)
