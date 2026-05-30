"""PasswordHasher — concrete password hashing/verification using passlib + bcrypt.

Implements the PasswordHasher Protocol from the application layer.
"""

from __future__ import annotations

from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class PasswordHasher:
    """Hash and verify passwords using bcrypt (auto-salted)."""

    @staticmethod
    def hash(plain_password: str) -> str:
        """Return a salted bcrypt hash of the plaintext password."""
        return _pwd_context.hash(plain_password)

    @staticmethod
    def verify(plain_password: str, hashed_password: str) -> bool:
        """Check if a plaintext password matches its hashed form."""
        return _pwd_context.verify(plain_password, hashed_password)
