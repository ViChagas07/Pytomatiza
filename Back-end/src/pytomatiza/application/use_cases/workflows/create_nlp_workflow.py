"""CreateNLPWorkflowUseCase — generates a workflow from a natural language prompt.

Uses the configured LLM provider (Gemini, Ollama, …) to parse the NL
instruction into a sequence of automation steps (tools + actions + params).
The provider is selected at runtime via ``settings.LLM_PROVIDER``.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from pytomatiza.application.dtos.workflow_dtos import (
    CreateNLPWorkflowCommand,
    WorkflowResponse,
)
from pytomatiza.domain.entities.workflow import Workflow, WorkflowStatus
from pytomatiza.domain.repositories.agent_repository import AgentRepository
from pytomatiza.domain.repositories.workflow_repository import WorkflowRepository
from pytomatiza.infrastructure.ai.provider_factory import get_llm_provider


class CreateNLPWorkflowUseCase:
    """Parse a natural language prompt into a structured workflow using an LLM.

    The LLM is asked to produce a JSON array of workflow steps. The result
    is saved as a DRAFT workflow for the user to review.
    """

    _SYSTEM_PROMPT = """You are a workflow automation parser for Pytomatiza+.
Given a natural language description, generate a list of automation steps.
Each step must be a JSON object with these keys:
  - "tool": the automation tool name
  - "action": the specific action
  - "params": a dict of parameters for that action

Available tools and their actions:
  - "email_sender"        → send, reply, forward
  - "report_generator"    → generate, schedule
  - "data_transformer"    → transform, filter, merge
  - "web_scraper"         → scrape, extract
  - "notion_sync"         → sync, create_page
  - "google_sheets"       → read, write, append, sync
  - "slack_notifier"      → send_message, send_file, notify
  - "ocr_processor"       → extract, extract_text
  - "openai"              → summarize, extract, classify, generate
  - "discord"             → send_message, send_webhook, send_alert
  - "telegram"            → send_message, send_document, send_alert
  - "whatsapp"            → send_message, notify
  - "facebook"            → create_post, publish
  - "trello"              → create_card, move_card, update_card
  - "jira"                → create_issue, create_bug, create_task, update_issue

Return ONLY the JSON array (no markdown, no explanation). Example:
[{"tool": "email_sender", "action": "send", "params": {"to": "team@acme.com", "subject": "Daily report", "body": "..."}}]"""

    def __init__(
        self,
        workflow_repo: WorkflowRepository,
        agent_repo: AgentRepository,
        llm_provider: object | None = None,
    ) -> None:
        self._workflow_repo = workflow_repo
        self._agent_repo = agent_repo
        # Lazy-load the provider so the use case can be instantiated
        # in tests without a live API key.
        self._llm_provider = llm_provider

    @property
    def _llm(self) -> object:
        if self._llm_provider is None:
            self._llm_provider = get_llm_provider()
        return self._llm_provider

    async def execute(
        self,
        command: CreateNLPWorkflowCommand,
        user_id: uuid.UUID,
    ) -> WorkflowResponse:
        """Parse the NL prompt into steps and persist the workflow.

        The workflow is created with DRAFT status (pending approval).
        """
        steps = await self._parse_prompt(command.prompt)
        workflow = Workflow(
            id=uuid.uuid4(),
            name=command.name or self._generate_name(command.prompt),
            description=command.prompt,
            natural_language_prompt=command.prompt,
            steps=steps,
            status=WorkflowStatus.DRAFT,
            owner_id=user_id,
            agent_id=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        workflow.submit_for_approval()
        saved_workflow = await self._workflow_repo.save(workflow)
        return WorkflowResponse.model_validate(saved_workflow, from_attributes=True)

    async def _parse_prompt(self, prompt: str) -> list[dict]:
        """Send the prompt to the configured LLM provider and parse the JSON response."""
        raw_text = await self._llm.generate(
            system_prompt=self._SYSTEM_PROMPT,
            user_prompt=prompt,
        )
        try:
            steps = json.loads(raw_text)
        except json.JSONDecodeError:
            steps = self._parse_fallback(prompt)
        if not isinstance(steps, list):
            steps = []
        return steps

    @staticmethod
    def _generate_name(prompt: str) -> str:
        """Generate a short name from the prompt (first 80 chars)."""
        return prompt[:80].strip() + ("..." if len(prompt) > 80 else "")

    @staticmethod
    def _parse_fallback(prompt: str) -> list[dict]:
        """Fallback parser when the LLM response is malformed."""
        return [
            {
                "tool": "data_transformer",
                "action": "process",
                "params": {"prompt": prompt},
            }
        ]
