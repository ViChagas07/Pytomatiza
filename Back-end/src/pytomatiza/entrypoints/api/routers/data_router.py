"""Data router — connect sources, transform with Gemini, export."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.domain.entities.automation_run import AutomationRun, RunStatus
from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user, get_db
from pytomatiza.infrastructure.ai.provider_factory import get_llm_provider
from pytomatiza.infrastructure.repositories.sqlalchemy_automation_run_repository import (
    SQLAlchemyAutomationRunRepository,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/data/analyze")
async def analyze_data(
    prompt: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> dict:
    """Analyze/transform data using natural language via Gemini."""
    llm = get_llm_provider()
    system = "Você é um analista de dados. Responda em português com resultados claros e acionáveis. Se o usuário pedir código, gere Python com pandas."
    try:
        result = await llm.generate(system_prompt=system, user_prompt=prompt)
        if current_user is not None and db is not None:
            run_repo = SQLAlchemyAutomationRunRepository(db)
            run = AutomationRun(
                id=uuid4(),
                workflow_id=None,
                agent_id=None,
                user_id=current_user.id,
                status=RunStatus.SUCCESS,
                input_payload={"prompt": prompt},
                output_result={"status": "success"},
                error_message=None,
                started_at=datetime.now(timezone.utc),
                finished_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
            )
            await run_repo.save(run)
        return {"result": result, "status": "success"}
    except Exception as exc:
        if current_user is not None and db is not None:
            run_repo = SQLAlchemyAutomationRunRepository(db)
            run = AutomationRun(
                id=uuid4(),
                workflow_id=None,
                agent_id=None,
                user_id=current_user.id,
                status=RunStatus.FAILED,
                input_payload={"prompt": prompt},
                output_result=None,
                error_message=str(exc),
                started_at=datetime.now(timezone.utc),
                finished_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
            )
            await run_repo.save(run)
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
