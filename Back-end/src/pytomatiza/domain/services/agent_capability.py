"""Agent capability registry — maps agent types to their supported tools/actions.

Used by RunAgentUseCase to validate whether a user's request matches the
agent's skills.  If not, it finds alternative agent types that CAN handle
the request so the agent can recommend them.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# ── Agent type → capabilities mapping ────────────────────────────────────
#
# Each capability has:
#   tools:    specific tool names this agent type operates
#   actions:  verbs / actions this agent type performs
#   keywords: Portuguese + English keywords for intent matching
#   examples: sample requests (for documentation / future LLM matching)


@dataclass(frozen=True)
class AgentCapability:
    agent_type: str
    label: str  # human-readable name
    tools: list[str] = field(default_factory=list)
    actions: list[str] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)
    examples: list[str] = field(default_factory=list)


CAPABILITIES: list[AgentCapability] = [
    AgentCapability(
        agent_type="productivity",
        label="Produtividade",
        tools=[
            "email_sender",
            "meeting_scheduler",
            "slack_notifier",
            "task_manager",
            "calendar_sync",
            "reminder",
        ],
        actions=[
            "enviar", "send", "agendar", "schedule", "notificar", "notify",
            "lembrar", "remind", "coordenar", "coordinate", "organizar",
            "organize", "convidar", "invite",
        ],
        keywords=[
            "e-mail", "email", "reunião", "meeting", "slack", "notificação",
            "notification", "tarefa", "task", "calendário", "calendar",
            "lembrete", "reminder", "convite", "invitation", "agenda",
            "caixa de entrada", "inbox", "anexo", "attachment",
        ],
        examples=[
            "Enviar um e-mail de boas-vindas para novos usuários",
            "Agendar uma reunião semanal com a equipe",
            "Notificar no Slack quando um ticket for fechado",
        ],
    ),
    AgentCapability(
        agent_type="data",
        label="Dados",
        tools=[
            "data_transformer",
            "google_sheets",
            "web_scraper",
            "database_backup",
            "ocr_processor",
            "report_generator",
            "csv_exporter",
            "spreadsheet_automation",
        ],
        actions=[
            "processar", "process", "transformar", "transform", "extrair",
            "extract", "analisar", "analyze", "compilar", "compile",
            "raspar", "scrape", "exportar", "export", "importar", "import",
            "backup", "fatura", "invoice", "planilha", "spreadsheet",
            "csv", "dados", "data", "relatório", "report",
        ],
        keywords=[
            "planilha", "spreadsheet", "excel", "sheets", "dados", "data",
            "csv", "relatório", "report", "backup", "banco de dados",
            "database", "ocr", "fatura", "invoice", "raspagem", "scraping",
            "web scraping", "extrair dados", "transformar", "análise",
            "analysis", "estatística", "statistics",
        ],
        examples=[
            "Extrair dados de faturas em PDF e enviar para o software de contabilidade",
            "Compilar dados de múltiplas fontes e gerar um relatório PDF",
            "Quando uma nova linha for adicionada à planilha, enviar um e-mail",
        ],
    ),
    AgentCapability(
        agent_type="content",
        label="Conteúdo",
        tools=[
            "content_generator",
            "translator",
            "social_media_monitor",
            "blog_writer",
            "image_generator",
            "video_generator",
            "text_summarizer",
        ],
        actions=[
            "gerar", "generate", "criar", "create", "traduzir", "translate",
            "escrever", "write", "publicar", "publish", "monitorar",
            "monitor", "postar", "post", "legendar", "caption",
            "resumir", "summarize", "imagem", "image", "vídeo", "video",
        ],
        keywords=[
            "conteúdo", "content", "texto", "text", "blog", "post",
            "tradução", "translation", "traduzir", "idioma", "language",
            "redes sociais", "social media", "twitter", "linkedin",
            "instagram", "facebook", "imagem", "image", "vídeo", "video",
            "gerar imagem", "gerar vídeo", "criar post", "artigo",
            "article", "resumo", "summary", "legenda",
        ],
        examples=[
            "Traduzir posts de blog para 9 idiomas",
            "Gerar uma imagem de capa para o artigo",
            "Monitorar menções à marca no Twitter e responder automaticamente",
        ],
    ),
    AgentCapability(
        agent_type="admin",
        label="Administrativo",
        tools=[
            "backup_agent",
            "health_checker",
            "api_monitor",
            "invoice_processor",
            "system_monitor",
            "log_rotator",
        ],
        actions=[
            "monitorar", "monitor", "verificar", "check", "ping",
            "backup", "auditar", "audit", "alertar", "alert",
            "escalar", "escalate", "processar", "process",
        ],
        keywords=[
            "saúde", "health", "ping", "monitor", "status", "backup",
            "integridade", "integrity", "pagerduty", "alerta", "alert",
            "inatividade", "downtime", "log", "sistema", "system",
            "servidor", "server", "api", "infraestrutura", "infrastructure",
            "administração", "admin",
        ],
        examples=[
            "Fazer ping em todas as APIs internas a cada minuto",
            "Realizar backups noturnos do banco de dados",
            "Verificar a saúde do servidor e alertar em caso de falha",
        ],
    ),
    AgentCapability(
        agent_type="technical",
        label="Técnico",
        tools=[
            "code_generator",
            "api_integrator",
            "database_migration",
            "security_scanner",
            "log_analyzer",
            "deploy_agent",
        ],
        actions=[
            "codificar", "code", "integrar", "integrate", "migrar",
            "migrate", "escanear", "scan", "deploy", "implantar",
            "depurar", "debug", "compilar", "compile", "testar", "test",
        ],
        keywords=[
            "código", "code", "api", "integração", "integration",
            "migração", "migration", "segurança", "security",
            "vulnerabilidade", "vulnerability", "deploy", "deployment",
            "git", "docker", "kubernetes", "ci/cd", "pipeline",
            "script", "automação técnica", "programação", "programming",
        ],
        examples=[
            "Gerar um script Python para migrar dados entre bancos",
            "Escanear o código em busca de vulnerabilidades de segurança",
            "Integrar a API do GitHub com o Slack para notificações de PR",
        ],
    ),
]


# ── Public API ────────────────────────────────────────────────────────────


def get_capability(agent_type: str) -> AgentCapability | None:
    """Return the capability record for *agent_type*, or None."""
    for cap in CAPABILITIES:
        if cap.agent_type == agent_type:
            return cap
    return None


def _keyword_score(cap: AgentCapability, prompt: str, /) -> int:
    """Count how many capability keywords appear in *prompt* (case‑insensitive)."""
    lowered = prompt.lower()
    score = 0
    for kw in cap.keywords:
        # Match whole word (or compound) to avoid false positives
        if re.search(rf"\b{re.escape(kw)}\b", lowered):
            score += 1
    for action in cap.actions:
        if re.search(rf"\b{re.escape(action)}\b", lowered):
            score += 2  # actions weigh more than keywords
    return score


def matches_capability(agent_type: str, prompt: str, /) -> bool:
    """Return True if *prompt* is within the agent type's capabilities."""
    cap = get_capability(agent_type)
    if cap is None:
        return False
    return _keyword_score(cap, prompt) > 0


def find_alternative_agent(prompt: str, exclude_type: str | None = None) -> AgentCapability | None:
    """Return the best-matching alternative agent type for *prompt*.

    Excludes *exclude_type* so we don't recommend the agent that refused.
    Returns None if no alternative scores above zero.
    """
    best: AgentCapability | None = None
    best_score = 0

    for cap in CAPABILITIES:
        if cap.agent_type == exclude_type:
            continue
        score = _keyword_score(cap, prompt)
        if score > best_score:
            best_score = score
            best = cap

    return best if best_score > 0 else None


def list_all_agent_types() -> list[dict[str, str]]:
    """Return a lightweight summary of all agent types (for frontend / docs)."""
    return [
        {"type": cap.agent_type, "label": cap.label, "tools": cap.tools}
        for cap in CAPABILITIES
    ]
