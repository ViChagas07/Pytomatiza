"""Authentication-specific domain exceptions."""

from pytomatiza.domain.exceptions.base import DomainException


class InvalidCredentials(DomainException):
    """Raised when login credentials do not match any account."""


class EmailAlreadyRegistered(DomainException):
    """Raised when trying to register with an email that already exists."""


class AccountNotVerified(DomainException):
    """Raised when an unverified account attempts a restricted action."""


class PasswordResetTokenExpired(DomainException):
    """Raised when a password reset token has expired."""


class PasswordResetTokenInvalid(DomainException):
    """Raised when a password reset token is invalid or already used."""


class TokenBlacklisted(DomainException):
    """Raised when a JWT token has been revoked / blacklisted."""
