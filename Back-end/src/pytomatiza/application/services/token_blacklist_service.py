"""TokenBlacklistService interface — for managing revoked JWT tokens in Redis.

Infrastructure implementation: infrastructure/cache/redis_client.py helpers.
"""

from __future__ import annotations

from typing import Protocol


class TokenBlacklistService(Protocol):
    """Abstract service for checking and managing blacklisted tokens."""

    async def blacklist_token(self, jti: str, ttl: int) -> None: ...

    async def is_blacklisted(self, jti: str) -> bool: ...
