"""GoogleOAuthTokenModel — SQLAlchemy ORM model for the `oauth_tokens` table."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pytomatiza.infrastructure.db.base import Base


class GoogleOAuthTokenModel(Base):
    """Persistent OAuth 2.0 tokens for Google service integrations."""

    __tablename__ = "oauth_tokens"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider: Mapped[str] = mapped_column(
        String(50), nullable=False, default="google"
    )
    service: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Bearer"
    )
    scopes: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
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
    user = relationship("UserModel", backref="oauth_tokens")

    def __repr__(self) -> str:
        return (
            f"<GoogleOAuthTokenModel id={self.id!r} "
            f"user_id={self.user_id!r} service={self.service!r}>"
        )
