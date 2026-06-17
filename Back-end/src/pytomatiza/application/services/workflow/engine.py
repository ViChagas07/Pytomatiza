"""Workflow Execution Engine — orchestrates step‑by‑step workflow execution.

Loads a workflow, resolves each step to its StepExecutor via the
AgentRegistry, executes them in sequence with a shared PipelineContext,
and returns the final result.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from pytomatiza.application.services.workflow.agent_registry import AgentRegistry
from pytomatiza.application.services.workflow.pipeline_context import PipelineContext
from pytomatiza.domain.entities.automation_run import AutomationRun, RunStatus
from pytomatiza.domain.entities.workflow import Workflow, WorkflowStatus
from pytomatiza.domain.repositories.automation_run_repository import (
    AutomationRunRepository,
)
from pytomatiza.domain.repositories.workflow_repository import WorkflowRepository

logger = logging.getLogger(__name__)


class WorkflowExecutionEngine:
    """Executes a workflow step‑by‑step, tracking every AutomationRun."""

    def __init__(
        self,
        workflow_repo: WorkflowRepository,
        run_repo: AutomationRunRepository,
        registry: AgentRegistry,
    ) -> None:
        self._workflow_repo = workflow_repo
        self._run_repo = run_repo
        self._registry = registry

    async def execute(
        self,
        workflow_id: UUID,
        user_id: UUID,
    ) -> dict[str, Any]:
        """Execute an approved workflow and return the result dict.

        Creates an AutomationRun that tracks the entire execution lifecycle.
        """
        # ── 1. Load & validate ────────────────────────────────────
        workflow = await self._workflow_repo.find_by_id(workflow_id)
        if workflow is None:
            return {"status": "failed", "error": f"Workflow {workflow_id} not found"}

        if workflow.status != WorkflowStatus.APPROVED:
            return {
                "status": "failed",
                "error": f"Workflow is {workflow.status.value}, not approved",
            }

        if workflow.owner_id != user_id:
            return {"status": "failed", "error": "Workflow does not belong to user"}

        if not workflow.steps:
            return {"status": "failed", "error": "Workflow has no steps"}

        # ── 2. Start execution ────────────────────────────────────
        workflow.start_execution()
        workflow.updated_at = datetime.now(timezone.utc)
        await self._workflow_repo.save(workflow)

        run = AutomationRun(
            id=uuid4(),
            workflow_id=workflow_id,
            agent_id=workflow.agent_id,
            user_id=user_id,
            status=RunStatus.RUNNING,
            input_payload={"steps": workflow.steps},
            output_result=None,
            error_message=None,
            started_at=datetime.now(timezone.utc),
            finished_at=None,
            created_at=datetime.now(timezone.utc),
        )
        run = await self._run_repo.save(run)

        # ── 3. Execute steps ──────────────────────────────────────
        context = PipelineContext(
            workflow_id=str(workflow_id), user_id=str(user_id)
        )
        overall_status = "success"

        for idx, step in enumerate(workflow.steps):
            tool = step.get("tool", "")
            action = step.get("action", "execute")
            params = step.get("params", {})

            logger.info(
                "Executing step %d/%d — tool=%s action=%s",
                idx + 1, len(workflow.steps), tool, action,
            )

            executor = self._registry.resolve(tool)
            if executor is None:
                result = {
                    "status": "failed",
                    "error": f"No executor registered for tool '{tool}'",
                }
                overall_status = "failed"
            else:
                try:
                    result = await executor.execute(action, params, context.all_outputs)
                except Exception as exc:
                    logger.exception("Step %d failed: %s", idx + 1, exc)
                    result = {"status": "failed", "error": str(exc)}
                    overall_status = "failed"

            context.log_step(idx + 1, tool, action, result)

            if result.get("status") == "failed":
                overall_status = "failed"
                break  # stop on first failure

        # ── 4. Finalise ───────────────────────────────────────────
        workflow.complete(overall_status)
        workflow.updated_at = datetime.now(timezone.utc)
        await self._workflow_repo.save(workflow)

        if overall_status == "success":
            run = run.succeed({"outputs": context.all_outputs, "steps": context.step_log})
        else:
            run = run.fail(
                context.step_log[-1].get("error", "Unknown error")
                if context.step_log
                else "Execution failed"
            )
        run.finished_at = datetime.now(timezone.utc)
        await self._run_repo.save(run)

        # ── 5. Emit events ────────────────────────────────────────
        self._dispatch_events(workflow, run)

        return {
            "status": overall_status,
            "workflow_id": str(workflow_id),
            "run_id": str(run.id),
            "steps": context.step_log,
            "outputs": context.all_outputs,
        }

    def _dispatch_events(self, workflow: Workflow, run: AutomationRun) -> None:
        """Collect and log domain events from the workflow entity."""
        events = workflow.pull_events()
        for event in events:
            logger.info(
                "Domain event: %s workflow=%s run=%s",
                type(event).__name__,
                workflow.id,
                run.id,
            )
