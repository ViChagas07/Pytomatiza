"""Agents router — list and activate/deactivate AI automation agents."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.application.dtos.agent_dtos import (
    ActivateAgentCommand,
    AgentListResponse,
    AgentResponse,
    RunAgentCommand,
)
from pytomatiza.application.use_cases.agents.activate_agent import (
    ActivateAgentUseCase,
)
from pytomatiza.application.use_cases.agents.list_agents import ListAgentsUseCase
from pytomatiza.application.use_cases.agents.run_agent import RunAgentUseCase
from pytomatiza.domain.entities.automation_run import AutomationRun, RunStatus
from pytomatiza.domain.entities.user import User
from pytomatiza.domain.exceptions.base import EntityNotFound
from pytomatiza.entrypoints.api.deps import get_current_user, get_db
from pytomatiza.infrastructure.repositories.sqlalchemy_agent_repository import (
    SQLAlchemyAgentRepository,
)
from pytomatiza.infrastructure.repositories.sqlalchemy_automation_run_repository import (
    SQLAlchemyAutomationRunRepository,
)

router = APIRouter()


@router.get("", response_model=AgentListResponse)
async def list_agents(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
) -> AgentListResponse:
    """List all agents owned by the authenticated user."""
    use_case = ListAgentsUseCase(agent_repo=SQLAlchemyAgentRepository(db))
    return await use_case.execute(owner_id=current_user.id, page=page, per_page=per_page)


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AgentResponse:
    """Get a single agent by ID (must be owned by the current user)."""
    repo = SQLAlchemyAgentRepository(db)
    agent = await repo.find_by_id(agent_id)
    if agent is None or agent.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found.",
        )
    return AgentResponse.model_validate(agent, from_attributes=True)


@router.patch("/{agent_id}/activate", response_model=AgentResponse)
async def activate_agent(
    agent_id: UUID,
    command: ActivateAgentCommand,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AgentResponse:
    """Activate or deactivate an agent owned by the current user."""
    repo = SQLAlchemyAgentRepository(db)
    agent = await repo.find_by_id(agent_id)
    if agent is None or agent.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found.",
        )
    use_case = ActivateAgentUseCase(agent_repo=repo)
    try:
        return await use_case.execute(agent_id=agent_id, command=command)
    except EntityNotFound as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{agent_id}/run", response_model=AgentResponse)
async def run_agent(
    agent_id: UUID,
    command: RunAgentCommand,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AgentResponse:
    """Trigger an agent execution run with a natural‑language prompt.

    The agent analyses the prompt against its capabilities.  If the
    request is out of scope the agent refuses and, when another agent
    type can handle it, recommends that alternative.
    """
    repo = SQLAlchemyAgentRepository(db)
    agent = await repo.find_by_id(agent_id)
    if agent is None or agent.owner_id != current_user.id:
        if current_user is not None:
            run_repo = SQLAlchemyAutomationRunRepository(db)
            run = AutomationRun(
                id=uuid4(),
                workflow_id=None,
                agent_id=agent_id,
                user_id=current_user.id,
                status=RunStatus.FAILED,
                input_payload={"prompt": command.prompt},
                output_result=None,
                error_message="Agent not found.",
                started_at=datetime.now(timezone.utc),
                finished_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
            )
            await run_repo.save(run)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found.",
        )
    use_case = RunAgentUseCase(agent_repo=repo)
    result = await use_case.execute(agent_id=agent_id, command=command)
    run_repo = SQLAlchemyAutomationRunRepository(db)
    run = AutomationRun(
        id=uuid4(),
        workflow_id=None,
        agent_id=agent_id,
        user_id=current_user.id,
        status=RunStatus.SUCCESS if result.accepted else RunStatus.FAILED,
        input_payload={"prompt": command.prompt},
        output_result={"response": result.response_text} if result.accepted else None,
        error_message=result.refusal_reason if not result.accepted else None,
        started_at=datetime.now(timezone.utc),
        finished_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
    )
    await run_repo.save(run)
    return result


@router.post("/{agent_id}/pause", response_model=AgentResponse)
async def pause_agent(
    agent_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AgentResponse:
    """Pause a running agent."""
    repo = SQLAlchemyAgentRepository(db)
    agent = await repo.find_by_id(agent_id)
    if agent is None or agent.owner_id != current_user.id:
        if current_user is not None:
            run_repo = SQLAlchemyAutomationRunRepository(db)
            run = AutomationRun(
                id=uuid4(),
                workflow_id=None,
                agent_id=agent_id,
                user_id=current_user.id,
                status=RunStatus.FAILED,
                input_payload={"action": "pause"},
                output_result=None,
                error_message="Agent not found.",
                started_at=datetime.now(timezone.utc),
                finished_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
            )
            await run_repo.save(run)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found.",
        )
    # TODO: Integrate with CrewAI agent pause mechanism
    agent.deactivate()
    await repo.save(agent)
    run_repo = SQLAlchemyAutomationRunRepository(db)
    run = AutomationRun(
        id=uuid4(),
        workflow_id=None,
        agent_id=agent_id,
        user_id=current_user.id,
        status=RunStatus.SUCCESS,
        input_payload={"action": "pause"},
        output_result=None,
        error_message=None,
        started_at=datetime.now(timezone.utc),
        finished_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
    )
    await run_repo.save(run)
    return AgentResponse.model_validate(agent, from_attributes=True)


@router.post("/{agent_id}/resume", response_model=AgentResponse)
async def resume_agent(
    agent_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AgentResponse:
    """Resume a paused agent."""
    repo = SQLAlchemyAgentRepository(db)
    agent = await repo.find_by_id(agent_id)
    if agent is None or agent.owner_id != current_user.id:
        if current_user is not None:
            run_repo = SQLAlchemyAutomationRunRepository(db)
            run = AutomationRun(
                id=uuid4(),
                workflow_id=None,
                agent_id=agent_id,
                user_id=current_user.id,
                status=RunStatus.FAILED,
                input_payload={"action": "resume"},
                output_result=None,
                error_message="Agent not found.",
                started_at=datetime.now(timezone.utc),
                finished_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
            )
            await run_repo.save(run)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found.",
        )
    # TODO: Integrate with CrewAI agent resume mechanism
    agent.activate()
    await repo.save(agent)
    run_repo = SQLAlchemyAutomationRunRepository(db)
    run = AutomationRun(
        id=uuid4(),
        workflow_id=None,
        agent_id=agent_id,
        user_id=current_user.id,
        status=RunStatus.SUCCESS,
        input_payload={"action": "resume"},
        output_result=None,
        error_message=None,
        started_at=datetime.now(timezone.utc),
        finished_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
    )
    await run_repo.save(run)
    return AgentResponse.model_validate(agent, from_attributes=True)
