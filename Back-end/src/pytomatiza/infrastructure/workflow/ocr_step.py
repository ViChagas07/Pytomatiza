"""OCR Step Executor — extracts text from images/PDFs via Tesseract."""

from __future__ import annotations

import logging
from typing import Any

from pytomatiza.application.services.ocr import OCRService
from pytomatiza.domain.services.workflow.step_executor import StepExecutor

logger = logging.getLogger(__name__)


class OCRStepExecutor:
    """Workflow step that runs OCR on a file path provided via context."""

    tool_name = "ocr_processor"

    def __init__(self, ocr_service: OCRService | None = None) -> None:
        self._ocr = ocr_service or OCRService()

    async def execute(
        self,
        action: str,
        params: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        file_path = params.get("file_path") or context.get("file_path") or context.get("last_file_path")
        language = params.get("language", "por")

        if not file_path:
            return {"status": "failed", "error": "No file_path provided for OCR"}

        try:
            ext = file_path.lower().rsplit(".", 1)[-1] if "." in file_path else ""
            if ext == "pdf":
                result = await self._ocr.process_pdf(file_path, language=language, extract=True)
            else:
                result = await self._ocr.process_image(file_path, language=language, extract=True)

            return {
                "status": "success",
                "output": result["text"],
                "confidence": result["confidence"],
                "extracted_fields": result.get("extracted_fields"),
            }
        except Exception as exc:
            logger.exception("OCR step failed")
            return {"status": "failed", "error": str(exc)}
