"""AutomationRunRepository interface — structural Protocol."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from pytomatiza.domain.entities.automation_run import AutomationRun


class AutomationRunRepository(Protocol):
    """Data access contract for AutomationRun entities."""

    async def find_by_id(self, run_id: UUID) -> AutomationRun | None: ...

    async def find_all(
        self,
        user_id: UUID | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[AutomationRun], int]: ...

    async def save(self, run: AutomationRun) -> AutomationRun: ...

    async def delete(self, run_id: UUID) -> None: ...
