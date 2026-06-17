"""Pipeline Context — shared mutable state across workflow execution steps.

Each step can read from and write to the context, enabling chaining:
Step 1 output → context → Step 2 input → context → … → final result.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


class PipelineContext:
    """Mutable key‑value store for workflow execution state."""

    def __init__(self, workflow_id: str, user_id: str) -> None:
        self._data: dict[str, Any] = {}
        self.workflow_id = workflow_id
        self.user_id = user_id
        self.started_at = datetime.now(timezone.utc)
        self.step_log: list[dict[str, Any]] = []

    def get(self, key: str, default: Any = None) -> Any:
        return self._data.get(key, default)

    def set(self, key: str, value: Any) -> None:
        self._data[key] = value

    def update(self, mapping: dict[str, Any]) -> None:
        self._data.update(mapping)

    def log_step(self, step_index: int, tool: str, action: str, result: dict[str, Any]) -> None:
        self.step_log.append({
            "step": step_index,
            "tool": tool,
            "action": action,
            "status": result.get("status", "unknown"),
            "output": result.get("output"),
            "error": result.get("error"),
        })

    @property
    def all_outputs(self) -> dict[str, Any]:
        return dict(self._data)

    @property
    def last_output(self) -> Any:
        keys = list(self._data.keys())
        return self._data[keys[-1]] if keys else None
