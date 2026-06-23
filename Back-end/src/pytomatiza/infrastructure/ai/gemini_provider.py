"""GeminiProvider — Google Gemini integration for production LLM inference.

Uses the google-genai SDK (google.genai). All configuration flows
from the central Settings object — never hard-code API keys or model names.
"""

from __future__ import annotations

import logging

from google import genai
from google.genai import types as genai_types

from pytomatiza.config import settings

logger = logging.getLogger("pytomatiza.ai.gemini")


class GeminiProvider:
    """LLM provider backed by Google Gemini models (gemini-2.5-flash, etc.).

    Thread-safe after initialisation. The client is long-lived
    and should be reused across requests to avoid re-authentication.
    """

    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.GOOGLE_GEMINI_API_KEY)
        self._model = settings.GOOGLE_GEMINI_MODEL

        logger.info(
            "Gemini provider initialised (model=%s, temperature=%s, max_tokens=%s)",
            settings.GOOGLE_GEMINI_MODEL,
            settings.AI_TEMPERATURE,
            settings.AI_MAX_TOKENS,
        )

    async def generate(
        self,
        system_prompt: str = "",
        user_prompt: str = "",
        **kwargs: object,
    ) -> str:
        """Generate a response using the Gemini model.

        The system prompt and user prompt are concatenated, since Gemini
        expects a single combined prompt rather than separate messages.

        Args:
            system_prompt: System-level context / role instructions.
            user_prompt:   The user's actual request.
            **kwargs:      Optional overrides for temperature, max_tokens,
                           or model name at call time.

        Returns:
            The generated text content.
        """
        # ── Merge prompts ──────────────────────────────────────────────
        parts: list[str] = []
        if system_prompt:
            parts.append(system_prompt)
        if user_prompt:
            parts.append(user_prompt)
        combined_prompt = "\n\n".join(parts)

        # ── Generation config (overrides from kwargs) ──────────────────
        generation_config = genai_types.GenerateContentConfig(
            temperature=kwargs.get("temperature", settings.AI_TEMPERATURE),
            max_output_tokens=kwargs.get("max_tokens", settings.AI_MAX_TOKENS),
        )
        model_override = str(kwargs.get("model", self._model))

        try:
            response = await self._client.aio.models.generate_content(
                model=model_override,
                contents=combined_prompt,
                config=generation_config,
            )
            return response.text
        except Exception as exc:
            logger.exception("Gemini API call failed")
            raise LLMProviderError(
                f"Gemini generation failed: {exc}"
            ) from exc


class LLMProviderError(Exception):
    """Raised when an LLM provider cannot fulfil a generation request."""
