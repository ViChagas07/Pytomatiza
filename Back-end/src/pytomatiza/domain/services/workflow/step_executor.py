"""Step Executor Protocol — contract for workflow step implementations."""

from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class StepExecutor(Protocol):
    """A callable that executes one step of a workflow.

    Implementations are stateless services registered by tool name.
    """

    @property
    def tool_name(self) -> str:
        """The tool name this executor handles (e.g. 'ocr_processor')."""
        ...

    async def execute(
        self,
        action: str,
        params: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        """Execute a workflow step.

        Args:
            action: The action to perform (e.g. 'extract', 'send').
            params: Parameters for this step from the workflow definition.
            context: Mutable pipeline context (previous step outputs, variables).

        Returns:
            A dict with at minimum ``{"status": "success"|"failed", "output": ...}``.
        """
        ...
