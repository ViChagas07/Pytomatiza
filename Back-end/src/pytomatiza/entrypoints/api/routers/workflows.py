"""Workflows router — create, list, approve, and deny automation workflows."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.application.dtos.workflow_dtos import (
    CreateNLPWorkflowCommand,
    WorkflowApprovalCommand,
    WorkflowListResponse,
    WorkflowResponse,
)
from pytomatiza.application.use_cases.workflows.approve_workflow import (
    ApproveWorkflowUseCase,
)
from pytomatiza.application.use_cases.workflows.create_nlp_workflow import (
    CreateNLPWorkflowUseCase,
)
from pytomatiza.application.use_cases.workflows.execute_workflow import (
    ExecuteWorkflowUseCase,
)
from pytomatiza.application.services.workflow.factory import get_execution_engine
from pytomatiza.domain.entities.user import User
from pytomatiza.domain.exceptions.base import BusinessRuleViolation, EntityNotFound
from pytomatiza.entrypoints.api.deps import get_current_user, get_db
from pytomatiza.infrastructure.monitoring.prometheus_setup import AUTOMATION_RUN_COUNT
from pytomatiza.infrastructure.repositories.sqlalchemy_agent_repository import (
    SQLAlchemyAgentRepository,
)
from pytomatiza.infrastructure.repositories.sqlalchemy_automation_run_repository import (
    SQLAlchemyAutomationRunRepository,
)
from pytomatiza.infrastructure.repositories.sqlalchemy_workflow_repository import (
    SQLAlchemyWorkflowRepository,
)

router = APIRouter()


@router.get("", response_model=WorkflowListResponse)
async def list_workflows(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
) -> WorkflowListResponse:
    """List workflows with pagination. Optionally filter by status."""
    repo = SQLAlchemyWorkflowRepository(db)
    workflows, total = await repo.find_all(
        owner_id=current_user.id,
        status=status_filter,
        limit=per_page,
        offset=(page - 1) * per_page,
    )
    return WorkflowListResponse(
        items=[WorkflowResponse.model_validate(w, from_attributes=True) for w in workflows],
        total=total,
        page=page,
        per_page=per_page,
        pages=max(1, (total + per_page - 1) // per_page),
    )


@router.post("/nlp", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_nlp_workflow(
    command: CreateNLPWorkflowCommand,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkflowResponse:
    """Create a workflow from a natural language instruction."""
    use_case = CreateNLPWorkflowUseCase(
        workflow_repo=SQLAlchemyWorkflowRepository(db),
        agent_repo=SQLAlchemyAgentRepository(db),
    )
    result = await use_case.execute(command=command, user_id=current_user.id)
    AUTOMATION_RUN_COUNT.labels(agent_type="nlp_parser", status="created").inc()
    return result


@router.post("/{workflow_id}/approve", response_model=WorkflowResponse)
async def approve_workflow(
    workflow_id: UUID,
    command: WorkflowApprovalCommand,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkflowResponse:
    """Approve a pending workflow."""
    use_case = ApproveWorkflowUseCase(workflow_repo=SQLAlchemyWorkflowRepository(db))
    try:
        result = await use_case.execute(
            workflow_id=workflow_id,
            command=command,
            user_id=current_user.id,
        )
        AUTOMATION_RUN_COUNT.labels(agent_type="workflow_approval", status="approved").inc()
        return result
    except EntityNotFound as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except BusinessRuleViolation as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc


@router.post("/{workflow_id}/deny", response_model=WorkflowResponse)
async def deny_workflow(
    workflow_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkflowResponse:
    """Deny a pending workflow."""
    command = WorkflowApprovalCommand(approved=False)
    use_case = ApproveWorkflowUseCase(workflow_repo=SQLAlchemyWorkflowRepository(db))
    try:
        result = await use_case.execute(
            workflow_id=workflow_id,
            command=command,
            user_id=current_user.id,
        )
        AUTOMATION_RUN_COUNT.labels(agent_type="workflow_approval", status="denied").inc()
        return result
    except EntityNotFound as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except BusinessRuleViolation as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc


@router.post("/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Execute an approved workflow.

    The execution runs synchronously for now; for long‑running workflows
    use BackgroundTasks or a task queue in production.
    """
    workflow_repo = SQLAlchemyWorkflowRepository(db)
    run_repo = SQLAlchemyAutomationRunRepository(db)
    engine = get_execution_engine(workflow_repo, run_repo)

    use_case = ExecuteWorkflowUseCase(
        workflow_repo=workflow_repo,
        run_repo=run_repo,
        engine=engine,
    )

    result = await use_case.execute(
        workflow_id=workflow_id,
        user_id=current_user.id,
    )

    if result.get("status") == "success":
        AUTOMATION_RUN_COUNT.labels(agent_type="workflow_execution", status="success").inc()
    else:
        AUTOMATION_RUN_COUNT.labels(agent_type="workflow_execution", status="failed").inc()

    return result


@router.delete("/{workflow_id}", status_code=status.HTTP_200_OK)
async def delete_workflow(
    workflow_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Delete a workflow owned by the current user."""
    repo = SQLAlchemyWorkflowRepository(db)
    workflow = await repo.find_by_id(workflow_id)
    if workflow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    if workflow.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your workflow")
    await repo.delete(workflow_id)
    return {"message": "Workflow deleted", "id": str(workflow_id)}
