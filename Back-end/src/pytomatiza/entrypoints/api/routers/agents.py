"""Agents router — list and activate/deactivate AI automation agents."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.application.dtos.agent_dtos import (
    ActivateAgentCommand,
    AgentListResponse,
    AgentResponse,
)
from pytomatiza.application.use_cases.agents.activate_agent import (
    ActivateAgentUseCase,
)
from pytomatiza.application.use_cases.agents.list_agents import ListAgentsUseCase
from pytomatiza.domain.entities.user import User
from pytomatiza.domain.exceptions.base import EntityNotFound
from pytomatiza.entrypoints.api.deps import get_current_user, get_db
from pytomatiza.infrastructure.repositories.sqlalchemy_agent_repository import (
    SQLAlchemyAgentRepository,
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
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AgentResponse:
    """Trigger an agent execution run."""
    repo = SQLAlchemyAgentRepository(db)
    agent = await repo.find_by_id(agent_id)
    if agent is None or agent.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found.",
        )
    # TODO: Integrate with CrewAI agent runner
    # For now, just acknowledge the run request
    return AgentResponse.model_validate(agent, from_attributes=True)


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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found.",
        )
    # TODO: Integrate with CrewAI agent pause mechanism
    agent.deactivate()
    await repo.save(agent)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found.",
        )
    # TODO: Integrate with CrewAI agent resume mechanism
    agent.activate()
    await repo.save(agent)
    return AgentResponse.model_validate(agent, from_attributes=True)
