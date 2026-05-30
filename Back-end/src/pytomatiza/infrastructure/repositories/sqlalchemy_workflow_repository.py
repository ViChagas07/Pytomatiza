"""SQLAlchemyWorkflowRepository — concrete implementation of WorkflowRepository."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.domain.entities.workflow import Workflow, WorkflowStatus
from pytomatiza.infrastructure.db.models.workflow_model import WorkflowModel


class SQLAlchemyWorkflowRepository:
    """Persist and retrieve Workflow entities via SQLAlchemy + asyncpg."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_id(self, workflow_id: UUID) -> Workflow | None:
        result = await self._session.execute(
            select(WorkflowModel).where(WorkflowModel.id == workflow_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model is not None else None

    async def find_all(
        self,
        owner_id: UUID | None = None,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Workflow], int]:
        base_stmt = select(WorkflowModel)
        count_stmt = select(func.count(WorkflowModel.id))

        if owner_id is not None:
            base_stmt = base_stmt.where(WorkflowModel.owner_id == owner_id)
            count_stmt = count_stmt.where(WorkflowModel.owner_id == owner_id)
        if status is not None:
            base_stmt = base_stmt.where(WorkflowModel.status == status)
            count_stmt = count_stmt.where(WorkflowModel.status == status)

        count_result = await self._session.execute(count_stmt)
        total = count_result.scalar() or 0

        base_stmt = base_stmt.order_by(WorkflowModel.created_at.desc()).limit(limit).offset(offset)
        result = await self._session.execute(base_stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models], total

    async def save(self, workflow: Workflow) -> Workflow:
        model = await self._session.get(WorkflowModel, workflow.id)
        if model is None:
            model = self._to_model(workflow)
            self._session.add(model)
        else:
            self._update_model(model, workflow)
        await self._session.flush()
        # Return the original entity to preserve domain events.
        return workflow

    async def delete(self, workflow_id: UUID) -> None:
        model = await self._session.get(WorkflowModel, workflow_id)
        if model is not None:
            await self._session.delete(model)

    # ── Mappers ─────────────────────────────────────────────────────────

    @staticmethod
    def _to_entity(model: WorkflowModel) -> Workflow:
        return Workflow(
            id=model.id,
            name=model.name,
            description=model.description,
            natural_language_prompt=model.natural_language_prompt,
            steps=model.steps,
            status=WorkflowStatus(model.status),
            owner_id=model.owner_id,
            agent_id=model.agent_id,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def _to_model(workflow: Workflow) -> WorkflowModel:
        return WorkflowModel(
            id=workflow.id,
            name=workflow.name,
            description=workflow.description,
            natural_language_prompt=workflow.natural_language_prompt,
            steps=workflow.steps,
            status=workflow.status.value,
            owner_id=workflow.owner_id,
            agent_id=workflow.agent_id,
            created_at=workflow.created_at,
            updated_at=workflow.updated_at,
        )

    @staticmethod
    def _update_model(model: WorkflowModel, workflow: Workflow) -> None:
        model.name = workflow.name
        model.description = workflow.description
        model.natural_language_prompt = workflow.natural_language_prompt
        model.steps = workflow.steps
        model.status = workflow.status.value
        model.agent_id = workflow.agent_id
