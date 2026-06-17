"""ExecuteWorkflowUseCase — runs an approved workflow through the execution engine."""

from __future__ import annotations

from uuid import UUID

from pytomatiza.application.services.workflow.engine import WorkflowExecutionEngine
from pytomatiza.domain.repositories.automation_run_repository import (
    AutomationRunRepository,
)
from pytomatiza.domain.repositories.workflow_repository import WorkflowRepository


class ExecuteWorkflowUseCase:
    """Execute an approved workflow step‑by‑step and return the result."""

    def __init__(
        self,
        workflow_repo: WorkflowRepository,
        run_repo: AutomationRunRepository,
        engine: WorkflowExecutionEngine,
    ) -> None:
        self._workflow_repo = workflow_repo
        self._run_repo = run_repo
        self._engine = engine

    async def execute(
        self,
        workflow_id: UUID,
        user_id: UUID,
    ) -> dict:
        """Run the workflow and return a structured result dict."""
        return await self._engine.execute(
            workflow_id=workflow_id,
            user_id=user_id,
        )
