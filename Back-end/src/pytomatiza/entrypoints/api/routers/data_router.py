"""Data router — connect sources, transform with Gemini, export."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user
from pytomatiza.infrastructure.ai.provider_factory import get_llm_provider

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/data/analyze")
async def analyze_data(
    prompt: str,
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Analyze/transform data using natural language via Gemini."""
    llm = get_llm_provider()
    system = "Você é um analista de dados. Responda em português com resultados claros e acionáveis. Se o usuário pedir código, gere Python com pandas."
    try:
        result = await llm.generate(system_prompt=system, user_prompt=prompt)
        return {"result": result, "status": "success"}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc


@router.get("/data/sources")
async def list_sources(
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """List available data sources."""
    return {
        "sources": [
            {"id": "csv", "name": "CSV / Excel Upload", "connected": True},
            {"id": "google_sheets", "name": "Google Sheets", "connected": False},
            {"id": "postgres", "name": "PostgreSQL", "connected": False},
            {"id": "api", "name": "REST API", "connected": False},
        ]
    }
