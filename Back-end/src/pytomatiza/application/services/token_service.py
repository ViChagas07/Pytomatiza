"""TokenService interface — defines the JWT token generation/validation contract.

Infrastructure implementation: infrastructure/security/jwt_token_service.py
"""

from __future__ import annotations
from typing import Any, Protocol
from pytomatiza.application.dtos.auth_dtos import TokenResponse

class TokenService(Protocol):
    """Abstract token management service."""
    def generate_tokens(self, user_id: str) -> TokenResponse: ...
    def decode_token(self, token: str) -> dict[str, Any]: ...