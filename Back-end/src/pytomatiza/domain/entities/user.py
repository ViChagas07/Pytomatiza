"""User domain entity — core business logic for user lifecycle."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID

from pytomatiza.domain.events.user_registered import UserRegistered
from pytomatiza.domain.value_objects.email import Email


@dataclass
class User:
    """A registered user in the Pytomatiza+ platform.

    Encapsulates user state and business rules. Domain events are collected
    internally and exposed via `pull_events()` for external dispatch.
    """

    id: UUID
    email: Email
    hashed_password: str | None
    name: str
    is_active: bool
    is_verified: bool
    oauth_provider: str | None
    created_at: datetime
    _events: list = field(default_factory=list, repr=False, compare=False)

    def verify_email(self) -> None:
        """Mark the user's email as verified and emit a domain event."""
        if self.is_verified:
            return
        self.is_verified = True
        self._events.append(UserRegistered(user_id=self.id, email=str(self.email)))

    def deactivate(self) -> None:
        """Deactivate the user account."""
        self.is_active = False

    def change_password(self, new_hashed_password: str) -> None:
        """Update the hashed password."""
        self.hashed_password = new_hashed_password

    def pull_events(self) -> list:
        """Return and clear collected domain events."""
        events, self._events = self._events, []
        return events
