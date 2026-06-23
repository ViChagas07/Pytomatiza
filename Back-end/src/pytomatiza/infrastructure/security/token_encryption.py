"""TokenEncryptionService — AES-256-GCM symmetric encryption for stored tokens.

All integration tokens (access_token, refresh_token) MUST be encrypted
at rest. This service provides a thin wrapper around the ``cryptography``
library with a consistent nonce/tag layout.

Key:
  Supplied via ``settings.ENCRYPTION_KEY`` as a hexadecimal string
  (64 hex chars = 32 bytes = AES-256).  If the key is not configured
  the service falls back to a **development-only** derived key and logs
  a loud warning.
"""

from __future__ import annotations

import base64
import hashlib
import logging
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from pytomatiza.config import settings

logger = logging.getLogger("pytomatiza.security.token_encryption")

# ── Constants ──────────────────────────────────────────────────────────
_NONCE_LENGTH = 12  # 96-bit nonce (recommended for AES-GCM)
_KEY_BYTES = 32     # AES-256


class TokenEncryptionService:
    """Encrypt / decrypt integration tokens using AES-256-GCM.

    Wire format (all base64-encoded together)::

        nonce (12 B) || ciphertext || tag (16 B)

    Every encryption generates a fresh random nonce so the same plaintext
    produces a different ciphertext each time.
    """

    def __init__(self) -> None:
        raw_key = self._load_key()
        self._aesgcm = AESGCM(raw_key)

    # ── Public API ─────────────────────────────────────────────────────

    def encrypt(self, plaintext: str) -> str:
        """Encrypt a plain-text string.

        Returns a URL-safe Base64 string containing nonce + ciphertext + tag.
        """
        if not plaintext:
            return ""
        data = plaintext.encode("utf-8")
        nonce = os.urandom(_NONCE_LENGTH)
        ciphertext: bytes = self._aesgcm.encrypt(nonce, data, None)
        # Layout: nonce || ciphertext (which already includes the tag)
        return base64.urlsafe_b64encode(nonce + ciphertext).decode("ascii")

    def decrypt(self, token: str) -> str:
        """Decrypt a token previously encrypted with :meth:`encrypt`.

        Returns the original plain-text string, or empty string on failure.
        """
        if not token:
            return ""
        try:
            raw = base64.urlsafe_b64decode(token)
            nonce = raw[:_NONCE_LENGTH]
            ciphertext = raw[_NONCE_LENGTH:]
            plaintext: bytes = self._aesgcm.decrypt(nonce, ciphertext, None)
            return plaintext.decode("utf-8")
        except Exception as exc:
            logger.error("Token decryption failed: %s", exc)
            return ""

    # ── Key loading ────────────────────────────────────────────────────

    @staticmethod
    def _load_key() -> bytes:
        """Return a 32-byte AES key.

        Prefers ``settings.ENCRYPTION_KEY`` (hex).  Falls back to a
        SHA-256 derivation of a hard-coded default **for development only**
        and emits a loud warning.
        """
        raw = settings.ENCRYPTION_KEY
        if raw:
            try:
                key = bytes.fromhex(raw)
            except ValueError:
                logger.error(
                    "ENCRYPTION_KEY is not a valid hex string; "
                    "falling back to development key."
                )
                key = _dev_fallback_key()
            if len(key) != _KEY_BYTES:
                logger.error(
                    "ENCRYPTION_KEY must be %d hex chars (got %d); "
                    "falling back to development key.",
                    _KEY_BYTES * 2, len(raw),
                )
                key = _dev_fallback_key()
        else:
            logger.warning(
                "ENCRYPTION_KEY not set — using derived development key. "
                "Set ENCRYPTION_KEY in .env for production."
            )
            key = _dev_fallback_key()
        return key


def _dev_fallback_key() -> bytes:
    """Derive a deterministic 32-byte key for local development."""
    return hashlib.sha256(b"PYTOMATIZA_DEV_ENCRYPTION_KEY_2026").digest()
