"""SQLAlchemyAgentRepository — concrete implementation of AgentRepository."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.domain.entities.agent import Agent, AgentStatus
from pytomatiza.infrastructure.db.models.agent_model import AgentModel


class SQLAlchemyAgentRepository:
    """Persist and retrieve Agent entities via SQLAlchemy + asyncpg."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_id(self, agent_id: UUID) -> Agent | None:
        result = await self._session.execute(
            select(AgentModel).where(AgentModel.id == agent_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model is not None else None

    async def find_all(self, owner_id: UUID | None = None) -> list[Agent]:
        stmt = select(AgentModel).order_by(AgentModel.created_at.desc())
        if owner_id is not None:
            stmt = stmt.where(AgentModel.owner_id == owner_id)
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def save(self, agent: Agent) -> Agent:
        model = await self._session.get(AgentModel, agent.id)
        if model is None:
            model = self._to_model(agent)
            self._session.add(model)
        else:
            self._update_model(model, agent)
        await self._session.flush()
        return self._to_entity(model)

    async def delete(self, agent_id: UUID) -> None:
        model = await self._session.get(AgentModel, agent_id)
        if model is not None:
            await self._session.delete(model)

    # ── Mappers ─────────────────────────────────────────────────────────

    @staticmethod
    def _to_entity(model: AgentModel) -> Agent:
        return Agent(
            id=model.id,
            name=model.name,
            description=model.description,
            agent_type=model.agent_type,
            status=AgentStatus(model.status),
            config=model.config,
            owner_id=model.owner_id,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def _to_model(agent: Agent) -> AgentModel:
        return AgentModel(
            id=agent.id,
            name=agent.name,
            description=agent.description,
            agent_type=agent.agent_type,
            status=agent.status.value,
            config=agent.config,
            owner_id=agent.owner_id,
            created_at=agent.created_at,
            updated_at=agent.updated_at,
        )

    @staticmethod
    def _update_model(model: AgentModel, agent: Agent) -> None:
        model.name = agent.name
        model.description = agent.description
        model.agent_type = agent.agent_type
        model.status = agent.status.value
        model.config = agent.config
