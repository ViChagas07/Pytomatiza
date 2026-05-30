"""Domain events — plain dataclasses representing significant occurrences."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import UUID


@dataclass(frozen=True)
class DomainEvent:
    """Base class for all domain events."""

    occurred_at: datetime = field(
        init=False, default_factory=lambda: datetime.now(timezone.utc)
    )


@dataclass(frozen=True)
class UserRegistered(DomainEvent):
    """Emitted when a user verifies their email for the first time."""

    user_id: UUID
    email: str
