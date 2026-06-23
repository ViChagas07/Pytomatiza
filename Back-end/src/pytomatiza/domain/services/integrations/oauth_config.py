"""OAuthProviderConfig — configuration for a provider's OAuth 2.0 flow.

Each third-party integration (Slack, Discord, Jira, Zoom, Google, etc.)
provides its own OAuth configuration by implementing this protocol.
The ``OAuthFlowService`` uses these configs to build authorization URLs
and exchange authorization codes for tokens.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol


@dataclass
class OAuthProviderConfig:
    """Configuration required to perform an OAuth 2.0 authorization code flow.

    Every field should be populated at startup from ``settings`` or
    hard-coded per-provider defaults.
    """

    # ── Identifiers ────────────────────────────────────────────────────
    provider: str              # "slack", "discord", "jira", "zoom", "google"
    service: str               # "workspace", "bot", "drive", "gmail", etc.

    # ── Endpoints ──────────────────────────────────────────────────────
    authorize_url: str         # URL to redirect the user to
    token_url: str             # URL to exchange code for token
    revoke_url: str = ""       # Optional token revocation endpoint

    # ── Client credentials ─────────────────────────────────────────────
    client_id: str = ""
    client_secret: str = ""

    # ── Scopes ─────────────────────────────────────────────────────────
    scopes: str = ""           # Space-separated scope list

    # ── Extra params ───────────────────────────────────────────────────
    extra_authorize_params: dict[str, str] = field(default_factory=dict)
    """Additional query parameters for the authorize URL, e.g.
    ``{"access_type": "offline", "prompt": "consent"}`` for Google."""

    extra_token_params: dict[str, str] = field(default_factory=dict)
    """Additional body parameters for the token exchange request."""

    # ── Token response mapping ─────────────────────────────────────────
    access_token_key: str = "access_token"
    refresh_token_key: str = "refresh_token"
    expires_in_key: str = "expires_in"
    scope_key: str = "scope"
    token_type_key: str = "token_type"

    # ── Account info (how to get connected account details) ────────────
    userinfo_url: str = ""
    """Optional URL to fetch connected account details (workspace name,
    user email, etc.).  Called with ``Authorization: Bearer {access_token}``
    after a successful token exchange."""

    userinfo_name_path: list[str] = field(default_factory=list)
    """JSON path to the account display name, e.g. ``["team", "name"]``
    for Slack's ``/api/auth.test`` response."""

    userinfo_id_path: list[str] = field(default_factory=list)
    """JSON path to the external account ID, e.g. ``["team_id"]``."""


class OAuthStateStore(Protocol):
    """Interface for storing/validating CSRF state values during OAuth flows."""

    async def store_state(self, state: str, user_id: str, ttl: int = 600) -> None:
        """Persist ``state`` so it can be validated on callback."""

    async def validate_state(self, state: str, user_id: str) -> bool:
        """Check that ``state`` exists and belongs to ``user_id``, then delete it."""

    async def delete_state(self, state: str) -> None:
        """Remove a state value (e.g. after validation)."""


@dataclass
class OAuthTokenResponse:
    """Normalised result of a successful OAuth 2.0 token exchange."""

    access_token: str
    refresh_token: str | None = None
    expires_in: int = 3600
    scope: str = ""
    token_type: str = "Bearer"
    raw: dict[str, Any] = field(default_factory=dict)
    """Original JSON response from the token endpoint — may contain
    provider-specific fields (e.g. ``team_id``, ``bot_user_id``)."""
