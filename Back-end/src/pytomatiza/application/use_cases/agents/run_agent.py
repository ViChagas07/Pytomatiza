"""RunAgentUseCase — validates user prompt against agent capabilities.

If the request matches the agent's skill set the agent accepts it and
executes (or schedules execution).  If the request is out of scope the
agent refuses and, when possible, recommends another agent type that
CAN handle the task.
"""

from __future__ import annotations

from uuid import UUID

from pytomatiza.application.dtos.agent_dtos import (
    AgentRecommendation,
    AgentResponse,
    RunAgentCommand,
)
from pytomatiza.domain.entities.agent import Agent
from pytomatiza.domain.repositories.agent_repository import AgentRepository
from pytomatiza.domain.services.agent_capability import (
    find_alternative_agent,
    matches_capability,
)


class RunAgentUseCase:
    """Analyse a user prompt and decide whether the agent should accept it."""

    def __init__(self, agent_repo: AgentRepository) -> None:
        self._agent_repo = agent_repo

    async def execute(
        self,
        agent_id: UUID,
        command: RunAgentCommand,
    ) -> AgentResponse:
        """Validate *command.prompt* against the agent's capabilities.

        Returns an AgentResponse with *accepted*, *refusal_reason* and
        *recommendation* fields populated.
        """
        agent = await self._agent_repo.find_by_id(agent_id)
        if agent is None:
            raise ValueError(f"Agent {agent_id} not found")

        prompt = command.prompt.strip()

        # ── 0. No explicit prompt → accept and run default behaviour ──
        if not prompt:
            return self._accept(agent)

        # ── 1. Check if prompt matches this agent's capabilities ──────
        if matches_capability(agent.agent_type, prompt):
            return self._accept(agent)

        # ── 2. Refuse + try to find an alternative ────────────────────
        alternative = find_alternative_agent(prompt, exclude_type=agent.agent_type)

        if alternative is None:
            return self._refuse(
                agent,
                reason=(
                    "Não posso executar esta tarefa porque ela está fora das "
                    "minhas capacidades. Não encontrei outro agente no sistema "
                    "que possa realizá-la."
                ),
            )

        return self._refuse(
            agent,
            reason=(
                f"Não posso executar esta tarefa — minhas capacidades são "
                f"voltadas para {self._describe_capabilities(agent.agent_type)}."
            ),
            recommendation=AgentRecommendation(
                agent_type=alternative.agent_type,
                label=alternative.label,
                reason=(
                    f"O agente de *{alternative.label}* pode realizar esta "
                    f"tarefa. Ele trabalha com: {', '.join(alternative.tools[:5])}."
                ),
                tools=alternative.tools,
            ),
        )

    # ── helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _accept(agent: Agent) -> AgentResponse:
        response = AgentResponse.model_validate(agent, from_attributes=True)
        response.accepted = True
        # TODO: Integrate with CrewAI agent runner for actual execution
        return response

    @staticmethod
    def _refuse(
        agent: Agent,
        *,
        reason: str,
        recommendation: AgentRecommendation | None = None,
    ) -> AgentResponse:
        response = AgentResponse.model_validate(agent, from_attributes=True)
        response.accepted = False
        response.refusal_reason = reason
        response.recommendation = recommendation
        return response

    @staticmethod
    def _describe_capabilities(agent_type: str) -> str:
        """Short Portuguese description of what an agent type does."""
        from pytomatiza.domain.services.agent_capability import get_capability

        cap = get_capability(agent_type)
        if cap is None:
            return agent_type
        tools_sample = cap.tools[:4]
        return f"{cap.label} ({', '.join(tools_sample)})"
