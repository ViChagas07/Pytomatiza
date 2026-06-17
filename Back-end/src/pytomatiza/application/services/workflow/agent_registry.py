"""Agent Registry — maps capabilities/tools to concrete StepExecutors.

Implements the Strategy Pattern: each tool name is handled by a
dedicated executor. Adding a new integration means implementing
StepExecutor and registering it here.
"""

from __future__ import annotations

from pytomatiza.domain.services.workflow.step_executor import StepExecutor


class AgentRegistry:
    """In‑memory registry of workflow step executors, keyed by tool name."""

    def __init__(self) -> None:
        self._executors: dict[str, StepExecutor] = {}

    def register(self, executor: StepExecutor) -> None:
        """Register a step executor for its tool name."""
        self._executors[executor.tool_name] = executor

    def resolve(self, tool_name: str) -> StepExecutor | None:
        """Return the executor for *tool_name*, or None if not registered."""
        return self._executors.get(tool_name)

    def list_tools(self) -> list[str]:
        """Return all registered tool names."""
        return list(self._executors.keys())

    def __bool__(self) -> bool:
        return bool(self._executors)
