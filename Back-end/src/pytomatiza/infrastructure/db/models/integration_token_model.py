"""IntegrationTokenModel — SQLAlchemy ORM model for the ``integration_tokens`` table.

This table replaces the previous ``oauth_tokens`` table and adds support
for any provider (Slack, Discord, Jira, Zoom, Telegram, Google, etc.)
while keeping tokens encrypted at rest.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pytomatiza.infrastructure.db.base import Base


class IntegrationTokenModel(Base):
    """Persistent OAuth / API-key credentials for third-party integrations."""

    __tablename__ = "integration_tokens"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tenant_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    provider: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    service: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Bearer"
    )
    scopes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    external_account_id: Mapped[str] = mapped_column(
        String(255), nullable=False, default=""
    )
    external_account_name: Mapped[str] = mapped_column(
        String(255), nullable=False, default=""
    )
    extra_data: Mapped[dict] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active", index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationship
    user = relationship(
        "UserModel",
        foreign_keys="[IntegrationTokenModel.user_id]",
        backref="integration_tokens",
    )

    def __repr__(self) -> str:
        return (
            f"<IntegrationTokenModel id={self.id!r} "
            f"user_id={self.user_id!r} "
            f"provider={self.provider!r} "
            f"service={self.service!r} "
            f"status={self.status!r}>"
        )
