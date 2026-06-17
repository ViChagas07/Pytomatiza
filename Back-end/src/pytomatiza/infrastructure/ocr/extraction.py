"""Intelligent extraction — regex helpers for common Portuguese document fields."""

from __future__ import annotations

import re
from typing import Any


# ── Compiled patterns (pre‑compiled for performance) ──────────────


_CPF_RE = re.compile(r"\b(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})\b")
_CNPJ_RE = re.compile(r"\b(\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}|\d{14})\b")
_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
_PHONE_RE = re.compile(
    r"(?:\(?\d{2,3}\)?\s?)?\d{4,5}[-\s]?\d{4}"
)
_DATE_RE = re.compile(
    r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b"
)
_MONEY_RE = re.compile(
    r"(?:R\$\s*)?\d{1,3}(?:\.\d{3})*(?:,\d{2})"
)
_URL_RE = re.compile(r"https?://[^\s]+")
_LICENSE_PLATE_RE = re.compile(r"\b[A-Z]{3}[-\s]?\d{4}\b")
# Brazilian / Mercosur plate
_LICENSE_PLATE_MERCOSUR_RE = re.compile(r"\b[A-Z]{3}\d[A-Z]\d{2}\b")

# Generic alpha‑numeric codes (6‑20 chars)
_CODE_RE = re.compile(r"\b[A-Z0-9]{6,20}\b")


# ── Public API ────────────────────────────────────────────────────


def extract_fields(text: str) -> dict[str, list[str]]:
    """Extract common document fields from OCR output.

    Returns a dict where each key maps to a list of matched strings
    (empty list if nothing found).
    """
    return {
        "cpf": _CPF_RE.findall(text),
        "cnpj": _CNPJ_RE.findall(text),
        "emails": _EMAIL_RE.findall(text),
        "phones": _PHONE_RE.findall(text),
        "dates": _DATE_RE.findall(text),
        "money_values": _MONEY_RE.findall(text),
        "urls": _URL_RE.findall(text),
        "license_plates": _LICENSE_PLATE_RE.findall(text)
        + _LICENSE_PLATE_MERCOSUR_RE.findall(text),
        "codes": _CODE_RE.findall(text),
    }


def extract_field(text: str, field: str) -> list[str]:
    """Extract a single field type from text."""
    mapping: dict[str, re.Pattern[str]] = {
        "cpf": _CPF_RE,
        "cnpj": _CNPJ_RE,
        "email": _EMAIL_RE,
        "phone": _PHONE_RE,
        "date": _DATE_RE,
        "money": _MONEY_RE,
        "url": _URL_RE,
        "license_plate": _LICENSE_PLATE_RE,
        "code": _CODE_RE,
    }
    pattern = mapping.get(field)
    if pattern is None:
        return []
    return pattern.findall(text)


# ── Structured extraction ─────────────────────────────────────────


def extract_structured(text: str) -> dict[str, Any]:
    """Extract fields and return first match as singleton where applicable."""
    raw = extract_fields(text)
    return {
        "cpf": raw["cpf"][0] if raw["cpf"] else None,
        "cnpj": raw["cnpj"][0] if raw["cnpj"] else None,
        "emails": raw["emails"],
        "phones": raw["phones"],
        "dates": raw["dates"],
        "money_values": raw["money_values"],
        "urls": raw["urls"],
        "license_plates": raw["license_plates"],
        "codes": raw["codes"],
        "raw_text": text,
    }
