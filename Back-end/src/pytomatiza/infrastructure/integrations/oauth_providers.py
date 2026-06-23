"""OAuth Provider Registrations — register all third-party OAuth configs.

Called once at application startup. Each provider defines its
``OAuthProviderConfig`` and calls ``register_oauth_provider()``.
"""

from __future__ import annotations

import logging

from pytomatiza.config import settings
from pytomatiza.domain.services.integrations.oauth_config import (
    OAuthProviderConfig,
)
from pytomatiza.entrypoints.api.routers.oauth_router import (
    register_oauth_provider,
)

logger = logging.getLogger(__name__)


def register_all_oauth_providers() -> None:
    """Register every OAuth-capable provider's configuration."""

    # ── Slack ──────────────────────────────────────────────────────────
    if settings.SLACK_CLIENT_ID and settings.SLACK_CLIENT_SECRET:
        register_oauth_provider(
            OAuthProviderConfig(
                provider="slack",
                service="workspace",
                authorize_url="https://slack.com/oauth/v2/authorize",
                token_url="https://slack.com/api/oauth.v2.access",
                revoke_url="https://slack.com/api/auth.revoke",
                client_id=settings.SLACK_CLIENT_ID,
                client_secret=settings.SLACK_CLIENT_SECRET,
                scopes="chat:write,channels:read,channels:history,"
                       "users:read,team:read,offline_access",
                extra_authorize_params={"user_scope": ""},
                access_token_key="access_token",
                refresh_token_key="refresh_token",  # Slack may not return this
                expires_in_key="expires_in",
                scope_key="scope",
                token_type_key="token_type",
                # ── Account info via auth.test ──────────────────────
                userinfo_url="https://slack.com/api/auth.test",
                userinfo_id_path=["team_id"],
                userinfo_name_path=["team"],
            )
        )
        logger.info("Slack OAuth provider registered.")
    else:
        logger.info("Slack OAuth not configured (missing SLACK_CLIENT_ID / SECRET).")

    # ── Discord ────────────────────────────────────────────────────────
    if settings.DISCORD_CLIENT_ID and settings.DISCORD_CLIENT_SECRET:
        register_oauth_provider(
            OAuthProviderConfig(
                provider="discord",
                service="bot",
                authorize_url="https://discord.com/api/v10/oauth2/authorize",
                token_url="https://discord.com/api/v10/oauth2/token",
                revoke_url="https://discord.com/api/v10/oauth2/token/revoke",
                client_id=settings.DISCORD_CLIENT_ID,
                client_secret=settings.DISCORD_CLIENT_SECRET,
                scopes="bot identify guilds guilds.members.read messages.read",
                extra_authorize_params={
                    "permissions": "0",  # bot permissions bitfield (computed later)
                },
                access_token_key="access_token",
                refresh_token_key="refresh_token",
                expires_in_key="expires_in",
                scope_key="scope",
                token_type_key="token_type",
                # Discord bot tokens don't have a userinfo endpoint
                # The guild info comes from the webhook/session
                userinfo_url="https://discord.com/api/v10/users/@me",
                userinfo_id_path=["id"],
                userinfo_name_path=["username"],
            )
        )
        logger.info("Discord OAuth provider registered.")
    else:
        logger.info("Discord OAuth not configured (missing DISCORD_CLIENT_ID / SECRET).")

    # ── Jira (Atlassian) ───────────────────────────────────────────────
    if settings.JIRA_CLIENT_ID and settings.JIRA_CLIENT_SECRET:
        register_oauth_provider(
            OAuthProviderConfig(
                provider="jira",
                service="site",
                authorize_url="https://auth.atlassian.com/authorize",
                token_url="https://auth.atlassian.com/oauth/token",
                revoke_url="https://auth.atlassian.com/oauth/revoke",
                client_id=settings.JIRA_CLIENT_ID,
                client_secret=settings.JIRA_CLIENT_SECRET,
                scopes="read:jira-user read:jira-work write:jira-work "
                       "manage:jira-project offline_access",
                extra_authorize_params={
                    "audience": "api.atlassian.com",
                    "prompt": "consent",
                },
                access_token_key="access_token",
                refresh_token_key="refresh_token",
                expires_in_key="expires_in",
                scope_key="scope",
                token_type_key="token_type",
                userinfo_url="https://api.atlassian.com/me",
                userinfo_id_path=["account_id"],
                userinfo_name_path=["name"],
            )
        )
        logger.info("Jira OAuth provider registered.")
    else:
        logger.info("Jira OAuth not configured (missing JIRA_CLIENT_ID / SECRET).")

    # ── Zoom ───────────────────────────────────────────────────────────
    # ── Google ──────────────────────────────────────────────────────────
    if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
        # Register once for Google (service will be determined by scopes)
        register_oauth_provider(
            OAuthProviderConfig(
                provider="google",
                service="drive",  # default; callback saves all granted scopes
                authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
                token_url="https://oauth2.googleapis.com/token",
                revoke_url="https://oauth2.googleapis.com/revoke",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                scopes=" ".join([
                    "openid", "email", "profile",
                    settings.GOOGLE_DRIVE_SCOPES,
                    settings.GOOGLE_GMAIL_SCOPES,
                    settings.GOOGLE_CALENDAR_SCOPES,
                    settings.GOOGLE_SHEETS_SCOPES,
                    settings.GOOGLE_MEET_SCOPES,
                    settings.GOOGLE_PHOTOS_SCOPES,
                ]),
                extra_authorize_params={
                    "access_type": "offline",
                    "prompt": "consent",
                },
                access_token_key="access_token",
                refresh_token_key="refresh_token",
                expires_in_key="expires_in",
                scope_key="scope",
                token_type_key="token_type",
                userinfo_url="https://www.googleapis.com/oauth2/v2/userinfo",
                userinfo_id_path=["id"],
                userinfo_name_path=["email"],
            )
        )
        logger.info("Google OAuth provider registered.")
    else:
        logger.info("Google OAuth not configured (missing GOOGLE_CLIENT_ID / SECRET).")

    if settings.ZOOM_CLIENT_ID and settings.ZOOM_CLIENT_SECRET:
        register_oauth_provider(
            OAuthProviderConfig(
                provider="zoom",
                service="meetings",
                authorize_url="https://zoom.us/oauth/authorize",
                token_url="https://zoom.us/oauth/token",
                revoke_url="https://zoom.us/oauth/revoke",
                client_id=settings.ZOOM_CLIENT_ID,
                client_secret=settings.ZOOM_CLIENT_SECRET,
                scopes="meeting:write meeting:read user:read",
                access_token_key="access_token",
                refresh_token_key="refresh_token",
                expires_in_key="expires_in",
                scope_key="scope",
                token_type_key="token_type",
                userinfo_url="https://api.zoom.us/v2/users/me",
                userinfo_id_path=["id"],
                userinfo_name_path=["email"],
            )
        )
        logger.info("Zoom OAuth provider registered.")
    else:
        logger.info("Zoom OAuth not configured (missing ZOOM_CLIENT_ID / SECRET).")
