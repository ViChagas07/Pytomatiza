"""Add integration_tokens table (replaces oauth_tokens for generic OAuth)

Revision ID: 0003_add_integration_tokens
Revises: 0002_add_oauth_tokens
Create Date: 2026-06-23 00:00:00.000000
"""
from __future__ import annotations

from typing import Any, Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0003_add_integration_tokens"
down_revision: Union[str, None] = "0002_add_oauth_tokens"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create integration_tokens table with encrypted token columns.

    This table supports any provider (Slack, Discord, Google, Jira, Zoom,
    Trello, Telegram, etc.) with per-user/tenant credentials. Tokens are
    encrypted at rest by the application layer.
    """
    op.create_table(
        "integration_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=True,
            index=True,
        ),
        sa.Column("provider", sa.String(50), nullable=False, index=True),
        sa.Column("service", sa.String(50), nullable=False, index=True),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column(
            "token_type",
            sa.String(50),
            nullable=False,
            server_default=sa.text("'Bearer'"),
        ),
        sa.Column("scopes", sa.Text(), nullable=False, server_default=sa.text("''")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "external_account_id",
            sa.String(255),
            nullable=False,
            server_default=sa.text("''"),
        ),
        sa.Column(
            "external_account_name",
            sa.String(255),
            nullable=False,
            server_default=sa.text("''"),
        ),
        sa.Column(
            "metadata",
            postgresql.JSONB,
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default=sa.text("'active'"),
            index=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # One token per user+provider+service
    op.create_unique_constraint(
        "uq_integration_tokens_user_provider_service",
        "integration_tokens",
        ["user_id", "provider", "service"],
    )


def downgrade() -> None:
    """Drop the integration_tokens table."""
    op.drop_table("integration_tokens")
