"""OllamaProvider — local LLM inference via Ollama HTTP API.

Useful for development, air-gapped environments, or when you want to
avoid vendor API costs.  Communicates with the Ollama server over HTTP.
"""

from __future__ import annotations

import logging

import httpx

from pytomatiza.config import settings
from pytomatiza.infrastructure.ai.gemini_provider import LLMProviderError

logger = logging.getLogger("pytomatiza.ai.ollama")


class OllamaProvider:
    """LLM provider backed by a local Ollama server.

    Connects to ``OLLAMA_BASE_URL`` (default ``http://localhost:11434``)
    and uses the model specified by ``effective_ollama_model`` (default ``qwen3:4b`` in demo).
    """

    def __init__(self) -> None:
        self._base_url = (settings.OLLAMA_BASE_URL or
                          "http://localhost:11434").rstrip("/")
        self._model = settings.effective_ollama_model
        logger.info(
            "Ollama provider initialised (url=%s, model=%s, ENVIRONMENT=%s)",
            self._base_url,
            self._model,
            settings.ENVIRONMENT,
        )

    async def generate(
        self,
        system_prompt: str = "",
        user_prompt: str = "",
        **kwargs: object,
    ) -> str:
        """Generate a response via the Ollama generate endpoint.

        Args:
            system_prompt: System-level instructions prepended to the prompt.
            user_prompt:   The user's actual request.
            **kwargs:      Supports ``temperature`` (float) and
                          ``model`` (str) overrides.

        Returns:
            The generated text.
        """
        # ── Build the combined prompt ───────────────────────────────────
        parts: list[str] = []
        if system_prompt:
            parts.append(system_prompt)
        if user_prompt:
            parts.append(user_prompt)
        combined_prompt = "\n\n".join(parts)

        # ── Prepare request payload ─────────────────────────────────────
        temperature = float(kwargs.get("temperature", settings.AI_TEMPERATURE))  # type: ignore[arg-type]
        model = str(kwargs.get("model", self._model))

        payload = {
            "model": model,
            "prompt": combined_prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self._base_url}/api/generate",
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                return data.get("response", "")
        except httpx.TimeoutException:
            logger.error("Ollama request timed out (model=%s)", model)
            raise LLMProviderError(
                f"Ollama request timed out after 120s (model={model})"
            )
        except httpx.HTTPStatusError as exc:
            logger.error(
                "Ollama returned HTTP %s: %s",
                exc.response.status_code,
                exc.response.text,
            )
            raise LLMProviderError(
                f"Ollama HTTP {exc.response.status_code}: {exc.response.text}"
            ) from exc
        except Exception as exc:
            logger.exception("Ollama API call failed unexpectedly")
            raise LLMProviderError(
                f"Ollama generation failed: {exc}"
            ) from exc
