"""Workflow Step Executors for third‑party integrations.

Each executor delegates to the concrete IntegrationProvider.
Registered in AgentRegistry so the WorkflowExecutionEngine can
execute integration steps (e.g. 'discord.send_message').
"""

from __future__ import annotations

import logging
from typing import Any

from pytomatiza.application.services.integrations import get_integration_service
from pytomatiza.domain.services.workflow.step_executor import StepExecutor

logger = logging.getLogger(__name__)


class IntegrationStepExecutor:
    """Generic step executor that routes to any registered integration provider."""

    def __init__(self, tool_name: str) -> None:
        self.tool_name = tool_name

    async def execute(self, action: str, params: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        svc = get_integration_service()
        provider = svc.get(self.tool_name)
        if provider is None:
            return {"status": "failed", "error": f"Integration '{self.tool_name}' not found"}

        # Enrich params with context (previous step outputs)
        enriched = dict(params)
        if "message" not in enriched and "content" not in enriched:
            last_output = context.get("last_output") or context.get("ocr_text") or context.get("summarized_text")
            if last_output:
                enriched["content"] = str(last_output)[:2000]

        result = await provider.execute_action(action, enriched)
        if result.success:
            return {"status": "success", "output": result.result}
        return {"status": "failed", "error": result.error or "Unknown error"}


# ── Pre‑built executors for each integration ─────────────────────

discord_step = IntegrationStepExecutor("discord")
telegram_step = IntegrationStepExecutor("telegram")
whatsapp_step = IntegrationStepExecutor("whatsapp")
facebook_step = IntegrationStepExecutor("facebook")
trello_step = IntegrationStepExecutor("trello")
jira_step = IntegrationStepExecutor("jira")
