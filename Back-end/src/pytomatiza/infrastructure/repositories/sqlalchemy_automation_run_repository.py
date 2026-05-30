"""SQLAlchemyAutomationRunRepository — concrete AutomationRunRepository."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.domain.entities.automation_run import AutomationRun, RunStatus
from pytomatiza.infrastructure.db.models.automation_run_model import AutomationRunModel


class SQLAlchemyAutomationRunRepository:
    """Persist and retrieve AutomationRun entities via SQLAlchemy + asyncpg."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_id(self, run_id: UUID) -> AutomationRun | None:
        result = await self._session.execute(
            select(AutomationRunModel).where(AutomationRunModel.id == run_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model is not None else None

    async def find_all(
        self,
        user_id: UUID | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[AutomationRun], int]:
        base_stmt = select(AutomationRunModel)
        count_stmt = select(func.count(AutomationRunModel.id))

        if user_id is not None:
            base_stmt = base_stmt.where(AutomationRunModel.user_id == user_id)
            count_stmt = count_stmt.where(AutomationRunModel.user_id == user_id)

        count_result = await self._session.execute(count_stmt)
        total = count_result.scalar() or 0

        base_stmt = (
            base_stmt.order_by(AutomationRunModel.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(base_stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models], total

    async def save(self, run: AutomationRun) -> AutomationRun:
        model = await self._session.get(AutomationRunModel, run.id)
        if model is None:
            model = self._to_model(run)
            self._session.add(model)
        else:
            self._update_model(model, run)
        await self._session.flush()
        return self._to_entity(model)

    async def delete(self, run_id: UUID) -> None:
        model = await self._session.get(AutomationRunModel, run_id)
        if model is not None:
            await self._session.delete(model)

    # ── Mappers ─────────────────────────────────────────────────────────

    @staticmethod
    def _to_entity(model: AutomationRunModel) -> AutomationRun:
        return AutomationRun(
            id=model.id,
            workflow_id=model.workflow_id,
            agent_id=model.agent_id,
            user_id=model.user_id,
            status=RunStatus(model.status),
            input_payload=model.input_payload,
            output_result=model.output_result,
            error_message=model.error_message,
            started_at=model.started_at,
            finished_at=model.finished_at,
            created_at=model.created_at,
        )

    @staticmethod
    def _to_model(run: AutomationRun) -> AutomationRunModel:
        return AutomationRunModel(
            id=run.id,
            workflow_id=run.workflow_id,
            agent_id=run.agent_id,
            user_id=run.user_id,
            status=run.status.value,
            input_payload=run.input_payload,
            output_result=run.output_result,
            error_message=run.error_message,
            started_at=run.started_at,
            finished_at=run.finished_at,
            created_at=run.created_at,
        )

    @staticmethod
    def _update_model(model: AutomationRunModel, run: AutomationRun) -> None:
        model.status = run.status.value
        model.input_payload = run.input_payload
        model.output_result = run.output_result
        model.error_message = run.error_message
        model.started_at = run.started_at
        model.finished_at = run.finished_at
