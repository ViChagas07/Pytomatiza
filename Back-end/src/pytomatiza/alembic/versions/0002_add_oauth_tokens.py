"""Add oauth_tokens table for Google Drive/Photos integrations

Revision ID: 0002_add_oauth_tokens
Revises: 0001_initial
Create Date: 2026-05-25 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002_add_oauth_tokens"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create oauth_tokens table for storing Google OAuth tokens."""
    op.create_table(
        "oauth_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "provider",
            sa.String(50),
            nullable=False,
            server_default=sa.text("'google'"),
        ),
        sa.Column(
            "service",
            sa.String(50),
            nullable=False,
            index=True,
        ),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column(
            "token_type",
            sa.String(50),
            nullable=False,
            server_default=sa.text("'Bearer'"),
        ),
        sa.Column("scopes", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
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

    # Unique constraint: one token per user per provider per service
    op.create_unique_constraint(
        "uq_oauth_tokens_user_provider_service",
        "oauth_tokens",
        ["user_id", "provider", "service"],
    )


def downgrade() -> None:
    """Drop the oauth_tokens table."""
    op.drop_table("oauth_tokens")
