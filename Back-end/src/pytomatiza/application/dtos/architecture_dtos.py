"""Architecture DTOs — request/response for AI diagram generation."""

from __future__ import annotations

from pydantic import BaseModel, Field


class GenerateArchitectureCommand(BaseModel):
    """Natural language description + template to generate a diagram."""

    prompt: str = Field(min_length=3, max_length=2000)
    """What the user wants to diagram (e.g. 'Microsserviço de pagamento na AWS')."""
    template: str = Field(default="aws")
    """Architecture template/style: aws, gcp, azure, microservices, serverless, etc."""
    format: str = Field(default="mermaid")
    """Output format: mermaid, png, svg, pdf, terraform."""


class ArchitectureResponse(BaseModel):
    """Generated architecture diagram result."""

    mermaid: str
    """Mermaid.js diagram definition (always returned as the source of truth)."""
    title: str = ""
    """Auto‑generated title for the diagram."""
    description: str = ""
    """Brief description of what the diagram shows."""
    component_count: int = 0
    """Estimated number of components/services in the diagram."""
    metadata: dict[str, str] = Field(default_factory=dict)
    """Provider‑specific metadata (e.g. Terraform resource types)."""
