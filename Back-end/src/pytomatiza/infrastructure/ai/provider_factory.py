"""LLM provider factory — selects the active provider based on configuration.

Usage::

    from pytomatiza.infrastructure.ai.provider_factory import get_llm_provider

    llm = get_llm_provider()
    answer = await llm.generate(
        system_prompt="You are a helpful assistant.",
        user_prompt="What is the capital of France?",
    )
"""

from __future__ import annotations

import logging
from functools import lru_cache

from pytomatiza.config import settings
from pytomatiza.domain.services.llm_provider import LLMProvider
from pytomatiza.infrastructure.ai.gemini_provider import (
    GeminiProvider,
    LLMProviderError,
)
from pytomatiza.infrastructure.ai.ollama_provider import OllamaProvider

logger = logging.getLogger("pytomatiza.ai.factory")

# Re-export so callers can catch errors from any provider uniformly.
__all__ = [
    "get_llm_provider",
    "LLMProvider",
    "LLMProviderError",
]

_PROVIDER_MAP: dict[str, type[GeminiProvider | OllamaProvider]] = {
    "gemini": GeminiProvider,
    "ollama": OllamaProvider,
}


def _create_provider() -> GeminiProvider | OllamaProvider:
    """Instantiate the LLM provider indicated by ``settings.effective_llm_provider``.

    Raises:
        ValueError: If ``LLM_PROVIDER`` is not a recognised provider name.
    """
    provider_name = settings.effective_llm_provider.lower().strip()
    provider_cls = _PROVIDER_MAP.get(provider_name)

    if provider_cls is None:
        msg = (
            f"Unknown LLM_PROVIDER {settings.effective_llm_provider!r}. "
            f"Must be one of: {', '.join(_PROVIDER_MAP)}"
        )
        logger.critical(msg)
        raise ValueError(msg)

    logger.info("Active LLM provider: %s (ENVIRONMENT=%s)", provider_name, settings.ENVIRONMENT)
    return provider_cls()


@lru_cache(maxsize=1)
def get_llm_provider() -> GeminiProvider | OllamaProvider:
    """Return a cached singleton LLM provider.

    The provider is created once and reused for the lifetime of the
    process.  Call this instead of ``_create_provider()`` directly.
    """
    return _create_provider()
