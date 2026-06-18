"""RunAgentUseCase — validates + processes user prompts with Gemini AI."""

from __future__ import annotations

import logging
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
    get_capability,
    matches_capability,
)

logger = logging.getLogger(__name__)


class RunAgentUseCase:
    """Analyse a user prompt, validate against agent capabilities, and
    execute it via Google Gemini when the agent accepts."""

    def __init__(self, agent_repo: AgentRepository) -> None:
        self._agent_repo = agent_repo

    async def execute(
        self,
        agent_id: UUID,
        command: RunAgentCommand,
    ) -> AgentResponse:
        """Validate *command.prompt* and, if accepted, process it with Gemini."""
        agent = await self._agent_repo.find_by_id(agent_id)
        if agent is None:
            raise ValueError(f"Agent {agent_id} not found")

        prompt = command.prompt.strip()

        # ── 0. No explicit prompt → accept without AI processing ──
        if not prompt:
            return self._accept(agent)

        # ── 1. Check if prompt matches this agent's capabilities ──
        if matches_capability(agent.agent_type, prompt):
            return await self._accept_and_process(agent, prompt)

        # ── 2. Refuse + try to find an alternative ────────────────
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

    # ── AI Processing ─────────────────────────────────────────────

    async def _accept_and_process(self, agent: Agent, prompt: str) -> AgentResponse:
        """Accept the prompt and process it with Gemini for intelligent output."""
        try:
            response_text = await self._call_gemini(agent, prompt)
        except Exception as exc:
            logger.exception("Gemini call failed for agent %s", agent.id)
            # Still accept, but include the error as the response
            response_text = f"[Erro ao processar com IA: {exc}]"

        resp = AgentResponse.model_validate(agent, from_attributes=True)
        resp.accepted = True
        resp.response_text = response_text
        return resp

    async def _call_gemini(self, agent: Agent, prompt: str) -> str:
        """Invoke Gemini with an agent‑specific system prompt."""
        from pytomatiza.infrastructure.ai.provider_factory import get_llm_provider

        llm = get_llm_provider()
        system_prompt = self._build_system_prompt(agent)

        result = await llm.generate(
            system_prompt=system_prompt,
            user_prompt=prompt,
        )
        return result.strip()

    def _build_system_prompt(self, agent: Agent) -> str:
        """Build a contextual system prompt based on the agent's type and tools."""
        cap = get_capability(agent.agent_type)
        label = cap.label if cap else agent.agent_type
        tools = ", ".join(cap.tools[:6]) if cap else "general tasks"
        examples = "\n".join(f"  - {ex}" for ex in (cap.examples[:3] if cap else []))

        return f"""Você é um agente de IA especializado em **{label}** no Pytomatiza+.
Suas ferramentas incluem: {tools}.
Você responde em português, de forma clara, direta e profissional.

Exemplos do que você faz:
{examples or f"  - Tarefas relacionadas a {label}"}

Responda à solicitação do usuário abaixo com um resultado útil e acionável.
Se precisar de mais informações, pergunte educadamente."""

    # ── helpers ──────────────────────────────────────────────────

    @staticmethod
    def _accept(agent: Agent) -> AgentResponse:
        response = AgentResponse.model_validate(agent, from_attributes=True)
        response.accepted = True
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
        cap = get_capability(agent_type)
        if cap is None:
            return agent_type
        tools_sample = cap.tools[:4]
        return f"{cap.label} ({', '.join(tools_sample)})"
