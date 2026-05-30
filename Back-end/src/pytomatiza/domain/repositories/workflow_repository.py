"""WorkflowRepository interface — structural Protocol."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from pytomatiza.domain.entities.workflow import Workflow


class WorkflowRepository(Protocol):
    """Data access contract for Workflow entities."""

    async def find_by_id(self, workflow_id: UUID) -> Workflow | None: ...

    async def find_all(
        self,
        owner_id: UUID | None = None,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Workflow], int]: ...

    async def save(self, workflow: Workflow) -> Workflow: ...

    async def delete(self, workflow_id: UUID) -> None: ...
