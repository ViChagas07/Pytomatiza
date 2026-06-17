"""OpenAI / LLM Step Executor — summarises, classifies, transforms text."""

from __future__ import annotations

import logging
from typing import Any

from pytomatiza.domain.services.workflow.step_executor import StepExecutor
from pytomatiza.infrastructure.ai.provider_factory import get_llm_provider

logger = logging.getLogger(__name__)


class OpenAIStepExecutor:
    """Workflow step that invokes the configured LLM for text processing."""

    tool_name = "openai"

    _SUMMARIZE_PROMPT = "Resuma o seguinte texto em até 3 frases, em português:\n\n{text}"
    _EXTRACT_PROMPT = "Extraia informações estruturadas do seguinte texto como JSON:\n\n{text}"
    _CLASSIFY_PROMPT = "Classifique o seguinte texto em uma categoria:\n\n{text}"

    def __init__(self, llm_provider: object | None = None) -> None:
        self._llm = llm_provider

    @property
    def _provider(self) -> object:
        if self._llm is None:
            self._llm = get_llm_provider()
        return self._llm

    async def execute(
        self,
        action: str,
        params: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        text = params.get("text") or context.get("ocr_text") or context.get("last_output") or ""
        if not text:
            text = params.get("prompt", "")

        if not text:
            return {"status": "failed", "error": "No text provided for LLM processing"}

        system_prompt = params.get("system_prompt", "")
        user_prompt = params.get("user_prompt", text)

        if action == "summarize" and not system_prompt:
            system_prompt = "Você é um assistente que resume textos em português."
            user_prompt = self._SUMMARIZE_PROMPT.format(text=text[:8000])
        elif action == "extract" and not system_prompt:
            system_prompt = "Você é um extrator de dados estruturados. Retorne APENAS JSON."
            user_prompt = self._EXTRACT_PROMPT.format(text=text[:8000])

        try:
            result = await self._provider.generate(
                system_prompt=system_prompt or "You are a helpful assistant.",
                user_prompt=user_prompt,
            )
            return {"status": "success", "output": result}
        except Exception as exc:
            logger.exception("LLM step failed")
            return {"status": "failed", "error": str(exc)}
