"""EmailService interface — defines the email sending contract.

Infrastructure implementation: infrastructure/email/resend_email_service.py
"""

from __future__ import annotations

from typing import Protocol


class EmailService(Protocol):
    """Abstract email sending service.

    All infrastructure-specific email logic (Resend, SMTP, etc.) must implement
    this protocol. The Application layer depends on this abstraction, never
    on concrete email implementations.
    """

    async def send_welcome_email(self, to: str, name: str) -> None: ...

    async def send_password_reset_email(self, to: str, reset_link: str) -> None: ...

    async def send_login_notification_email(self, to: str, name: str) -> None: ...

    async def send_verification_email(self, to: str, verification_link: str) -> None: ...
