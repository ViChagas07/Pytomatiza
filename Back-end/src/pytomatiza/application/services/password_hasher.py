"""PasswordHasher interface — defines the password hashing contract.

Infrastructure implementation: infrastructure/security/password_hasher.py
"""

from __future__ import annotations

from typing import Protocol


class PasswordHasher(Protocol):
    """Abstract password hashing and verification service."""

    def hash(self, plain_password: str) -> str: ...

    def verify(self, plain_password: str, hashed_password: str) -> bool: ...
