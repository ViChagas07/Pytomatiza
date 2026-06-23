"""Workflow Engine Factory — wires the execution engine with all step executors."""

from __future__ import annotations

import logging

from pytomatiza.application.services.workflow.agent_registry import AgentRegistry
from pytomatiza.application.services.workflow.engine import WorkflowExecutionEngine
from pytomatiza.application.services.workflow.pipeline_context import PipelineContext
from pytomatiza.domain.repositories.automation_run_repository import (
    AutomationRunRepository,
)
from pytomatiza.domain.repositories.workflow_repository import WorkflowRepository
from pytomatiza.infrastructure.workflow.ocr_step import OCRStepExecutor
from pytomatiza.infrastructure.workflow.openai_step import OpenAIStepExecutor

logger = logging.getLogger(__name__)

_engine: WorkflowExecutionEngine | None = None
_registry: AgentRegistry | None = None


def get_agent_registry() -> AgentRegistry:
    """Return the singleton AgentRegistry with all executors pre‑registered."""
    global _registry
    if _registry is not None:
        return _registry

    _registry = AgentRegistry()
    _registry.register(OCRStepExecutor())
    _registry.register(OpenAIStepExecutor())

    # Integration step executors
    from pytomatiza.infrastructure.workflow.integration_steps import (
        discord_step,
        facebook_step,
        gmail_step,
        google_calendar_step,
        google_drive_step,
        google_meet_step,
        google_sheets_step,
        jira_step,
        slack_step,
        telegram_step,
        trello_step,
        whatsapp_step,
        zoom_step,
    )
    _registry.register(discord_step)
    _registry.register(facebook_step)
    _registry.register(gmail_step)
    _registry.register(google_calendar_step)
    _registry.register(google_drive_step)
    _registry.register(google_meet_step)
    _registry.register(google_sheets_step)
    _registry.register(jira_step)
    _registry.register(slack_step)
    _registry.register(telegram_step)
    _registry.register(trello_step)
    _registry.register(whatsapp_step)
    _registry.register(zoom_step)

    logger.info("AgentRegistry initialised with %d executors", len(_registry.list_tools()))
    return _registry


def get_execution_engine(
    workflow_repo: WorkflowRepository,
    run_repo: AutomationRunRepository,
) -> WorkflowExecutionEngine:
    """Build a WorkflowExecutionEngine with all registered step executors."""
    return WorkflowExecutionEngine(
        workflow_repo=workflow_repo,
        run_repo=run_repo,
        registry=get_agent_registry(),
    )
