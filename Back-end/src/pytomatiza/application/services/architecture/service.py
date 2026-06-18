"""Architecture Service — generates architecture diagrams via Gemini."""

from __future__ import annotations

import json
import logging

from pytomatiza.application.dtos.architecture_dtos import (
    ArchitectureResponse,
    GenerateArchitectureCommand,
)
from pytomatiza.infrastructure.ai.provider_factory import get_llm_provider

logger = logging.getLogger(__name__)


class ArchitectureService:
    """Generate Mermaid architecture diagrams from natural language using Gemini."""

    _SYSTEM_PROMPT = """You are an expert cloud architect and diagram designer.
Given a natural language description and a template style, generate a Mermaid.js diagram.
Return ONLY a JSON object with these keys:
  - "mermaid": the complete Mermaid.js diagram definition (use graph TD or flowchart LR),
  - "title": a short title for the diagram (max 60 chars),
  - "description": a brief description of what the diagram shows (max 200 chars),
  - "component_count": estimated number of boxes/nodes in the diagram,

Rules for the Mermaid diagram:
- Use proper Mermaid syntax: graph TD for top-down, flowchart LR for left-right
- Style nodes with classDef for the specified cloud provider (aws, gcp, azure) or generic
- Include at least 5-10 nodes for a meaningful diagram
- Use meaningful node IDs and labels
- Add direction arrows between related components
- Use subgraphs for logical groupings when appropriate

Example output for "API Gateway with Lambda and DynamoDB on AWS":
{
  "mermaid": "graph TD\\n    Client-->APIGateway\\n    APIGateway-->Lambda\\n    Lambda-->DynamoDB\\n    Lambda-->S3",
  "title": "Serverless API Architecture",
  "description": "API Gateway routing requests to Lambda functions with DynamoDB storage",
  "component_count": 5
}

IMPORTANT: Return ONLY the JSON object. No markdown, no explanation."""

    async def generate(
        self,
        command: GenerateArchitectureCommand,
    ) -> ArchitectureResponse:
        """Generate a Mermaid diagram from the user's NL description."""
        llm = get_llm_provider()

        user_prompt = (
            f"Template style: {command.template}\n"
            f"Output format requested: {command.format}\n"
            f"Description: {command.prompt}"
        )

        try:
            raw = await llm.generate(
                system_prompt=self._SYSTEM_PROMPT,
                user_prompt=user_prompt,
            )
            # Strip any markdown code fences
            raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            data = json.loads(raw)
        except Exception as exc:
            logger.warning("Gemini JSON parse failed, using fallback: %s", exc)
            data = self._fallback(command)

        return ArchitectureResponse(
            mermaid=data.get("mermaid", ""),
            title=data.get("title", command.prompt[:60]),
            description=data.get("description", ""),
            component_count=data.get("component_count", 0),
            metadata={"template": command.template, "format": command.format},
        )

    @staticmethod
    def _fallback(command: GenerateArchitectureCommand) -> dict:
        """Generate a minimal diagram when Gemini output can't be parsed."""
        return {
            "mermaid": f"""graph TD
    User-->APIGateway
    APIGateway-->Service
    Service-->Database
    Service-->Storage
    Service-->Queue
    Queue-->Worker""",
            "title": command.prompt[:60],
            "description": f"Architecture diagram for: {command.prompt[:180]}",
            "component_count": 7,
        }
