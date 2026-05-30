"""ResendEmailService — concrete implementation of EmailService via Resend API.

Sends transactional emails (welcome, password reset, login notification,
email verification) using the Resend email API.
"""

from __future__ import annotations

import resend

from pytomatiza.config import settings

resend.api_key = settings.RESEND_API_KEY


class ResendEmailService:
    """Send transactional emails via the Resend API.

    Implements the EmailService Protocol from the application layer.
    All HTML templates are inline-styled for consistent branding.
    """

    def __init__(self) -> None:
        self._from_address = settings.EMAIL_FROM

    async def send_welcome_email(self, to: str, name: str) -> None:
        resend.Emails.send({
            "from": self._from_address,
            "to": to,
            "subject": "Welcome to Pytomatiza+!",
            "html": self._welcome_html(name),
        })

    async def send_password_reset_email(self, to: str, reset_link: str) -> None:
        resend.Emails.send({
            "from": self._from_address,
            "to": to,
            "subject": "Reset your Pytomatiza+ password",
            "html": self._reset_html(reset_link),
        })

    async def send_login_notification_email(self, to: str, name: str) -> None:
        resend.Emails.send({
            "from": self._from_address,
            "to": to,
            "subject": "New sign-in to your Pytomatiza+ account",
            "html": self._login_notification_html(name),
        })

    async def send_verification_email(self, to: str, verification_link: str) -> None:
        resend.Emails.send({
            "from": self._from_address,
            "to": to,
            "subject": "Verify your Pytomatiza+ email",
            "html": self._verification_html(verification_link),
        })

    # ── HTML Templates ──────────────────────────────────────────────────

    @staticmethod
    def _welcome_html(name: str) -> str:
        return f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h1 style="color:#1D9E75;font-size:22px;font-weight:500">Welcome, {name}!</h1>
          <p style="color:#444;font-size:15px;line-height:1.6">
            Your Pytomatiza+ account is ready. Start automating your workflow today.
          </p>
          <a href="{settings.FRONTEND_URL}/dashboard"
             style="display:inline-block;background:#1D9E75;color:#fff;
                    padding:10px 24px;border-radius:8px;text-decoration:none;
                    font-size:14px;margin-top:16px">
            Open dashboard
          </a>
        </div>"""

    @staticmethod
    def _reset_html(reset_link: str) -> str:
        return f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h1 style="color:#1D9E75;font-size:22px;font-weight:500">Password reset</h1>
          <p style="color:#444;font-size:15px;line-height:1.6">
            Click the link below to reset your password. This link expires in 1 hour.
          </p>
          <a href="{reset_link}"
             style="display:inline-block;background:#1D9E75;color:#fff;
                    padding:10px 24px;border-radius:8px;text-decoration:none;
                    font-size:14px;margin-top:16px">
            Reset password
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px">
            If you did not request a password reset, ignore this email.
          </p>
        </div>"""

    @staticmethod
    def _login_notification_html(name: str) -> str:
        return f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h1 style="color:#1D9E75;font-size:22px;font-weight:500">New sign-in detected</h1>
          <p style="color:#444;font-size:15px;line-height:1.6">
            Hi {name}, we noticed a new sign-in to your account.
            If this was you, no action is needed.
          </p>
          <a href="{settings.FRONTEND_URL}/settings/security"
             style="display:inline-block;background:#E24B4A;color:#fff;
                    padding:10px 24px;border-radius:8px;text-decoration:none;
                    font-size:14px;margin-top:16px">
            Secure my account
          </a>
        </div>"""

    @staticmethod
    def _verification_html(verification_link: str) -> str:
        return f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h1 style="color:#1D9E75;font-size:22px;font-weight:500">Verify your email</h1>
          <p style="color:#444;font-size:15px;line-height:1.6">
            Click below to confirm your email address.
          </p>
          <a href="{verification_link}"
             style="display:inline-block;background:#1D9E75;color:#fff;
                    padding:10px 24px;border-radius:8px;text-decoration:none;
                    font-size:14px;margin-top:16px">
            Verify email
          </a>
        </div>"""
