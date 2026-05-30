"""UserRepository interface — structural Protocol, no inheritance needed."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from pytomatiza.domain.entities.user import User


class UserRepository(Protocol):
    """Data access contract for User entities.

    Implementations live in infrastructure/repositories/.
    """

    async def find_by_id(self, user_id: UUID) -> User | None: ...

    async def find_by_email(self, email: str) -> User | None: ...

    async def save(self, user: User) -> User: ...

    async def delete(self, user_id: UUID) -> None: ...
