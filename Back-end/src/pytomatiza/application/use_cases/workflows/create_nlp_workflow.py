"""CreateNLPWorkflowUseCase — generates a workflow from a natural language prompt.

Uses LangChain + OpenAI to parse the NL instruction into a sequence of
automation steps (tools + actions + parameters).
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from pytomatiza.application.dtos.workflow_dtos import (
    CreateNLPWorkflowCommand,
    WorkflowResponse,
)
from pytomatiza.config import settings
from pytomatiza.domain.entities.workflow import Workflow, WorkflowStatus
from pytomatiza.domain.repositories.agent_repository import AgentRepository
from pytomatiza.domain.repositories.workflow_repository import WorkflowRepository


class CreateNLPWorkflowUseCase:
    """Parse a natural language prompt into a structured workflow using an LLM.

    The LLM is asked to produce a JSON array of workflow steps. The result
    is saved as a PENDING_APPROVAL workflow for the user to review.
    """

    _PROMPT_TEMPLATE = ChatPromptTemplate.from_messages([
        ("system", """You are a workflow automation parser for Pytomatiza+.
Given a natural language description, generate a list of automation steps.
Each step must be a JSON object with these keys:
  - "tool": the automation tool name (e.g., "email_sender", "report_generator", "data_transformer", "web_scraper", "notion_sync", "google_sheets", "slack_notifier")
  - "action": the specific action (e.g., "send", "generate", "transform", "scrape", "sync", "notify")
  - "params": a dict of parameters for that action

Return ONLY the JSON array (no markdown, no explanation). Example:
[{{"tool": "email_sender", "action": "send", "params": {{"to": "team@acme.com", "subject": "Daily report", "body": "..."}}}}]"""),
        ("human", "{prompt}"),
    ])

    def __init__(
        self,
        workflow_repo: WorkflowRepository,
        agent_repo: AgentRepository,
    ) -> None:
        self._workflow_repo = workflow_repo
        self._agent_repo = agent_repo

    async def execute(
        self,
        command: CreateNLPWorkflowCommand,
        user_id: uuid.UUID,
    ) -> WorkflowResponse:
        """Parse the NL prompt into steps and persist the workflow.

        The workflow is created with PENDING_APPROVAL status.
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
        """Use LangChain + OpenAI to parse the NL prompt into workflow steps."""
        llm = ChatOpenAI(
            model=settings.CREWAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=0.1,
        )
        chain = self._PROMPT_TEMPLATE | llm
        response = await chain.ainvoke({"prompt": prompt})
        raw_text = response.content if hasattr(response, "content") else str(response)
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
