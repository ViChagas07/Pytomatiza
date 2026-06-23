"""Workflow Step Executors for third‑party integrations.

Each executor delegates to the concrete IntegrationProvider, passing the
calling user's ``user_id`` (extracted from the PipelineContext metadata) so
that the provider loads the correct per-user token from the database.

All executors are registered in ``factory.py`` via ``AgentRegistry``.
"""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from pytomatiza.application.services.integrations import get_integration_service

logger = logging.getLogger(__name__)


class IntegrationStepExecutor:
    """Generic step executor that routes to any registered integration provider.

    The ``execute()`` method extracts ``__user_id__`` from the pipeline
    context metadata and forwards it to the provider so per‑user tokens
    are used — never global credentials.
    """

    def __init__(self, tool_name: str) -> None:
        self.tool_name = tool_name

    async def execute(
        self,
        action: str,
        params: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        svc = get_integration_service()
        provider = svc.get(self.tool_name)
        if provider is None:
            return {"status": "failed", "error": f"Integration '{self.tool_name}' not found"}

        # ── Extract user_id from pipeline context metadata ──────────
        user_id: UUID | None = None
        uid_str = context.get("__user_id__")
        if uid_str:
            try:
                user_id = UUID(uid_str) if isinstance(uid_str, str) else uid_str
            except (ValueError, AttributeError):
                logger.warning("Invalid __user_id__ in pipeline context: %s", uid_str)

        # ── Enrich params with context (previous step outputs) ──────
        enriched = dict(params)
        if "message" not in enriched and "content" not in enriched:
            last_output = context.get("last_output") or context.get("ocr_text") or context.get("summarized_text")
            if last_output:
                enriched["content"] = str(last_output)[:2000]

        result = await provider.execute_action(action, enriched, user_id=user_id)
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
slack_step = IntegrationStepExecutor("slack")
zoom_step = IntegrationStepExecutor("zoom")
google_drive_step = IntegrationStepExecutor("google_drive")
gmail_step = IntegrationStepExecutor("gmail")
google_calendar_step = IntegrationStepExecutor("google_calendar")
google_meet_step = IntegrationStepExecutor("google_meet")
google_sheets_step = IntegrationStepExecutor("google_sheets")
