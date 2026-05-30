"""UserId value object — wraps a UUID for type safety."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class UserId:
    """Strongly-typed user identifier value object."""

    value: UUID

    def __str__(self) -> str:
        return str(self.value)
