/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Dashboard — AgentCard
   Displays agent status, type, and key metrics. Fully accessible.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Play,
  Pause,
  Settings,
  Clock,
  Activity,
  Send,
  X,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { type Agent } from "@/store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ── Status dot + color ──────────────────────────────────────────── */

const statusConfig: Record<
  Agent["status"],
  { color: string; bg: string; dot: string }
> = {
  idle: {
    color: "var(--text-tertiary)",
    bg: "var(--surface-2)",
    dot: "var(--text-tertiary)",
  },
  running: {
    color: "var(--brand-accent)",
    bg: "var(--brand-accent-light)",
    dot: "var(--brand-accent)",
  },
  error: {
    color: "var(--color-danger)",
    bg: "#fef2f2",
    dot: "var(--color-danger)",
  },
  paused: {
    color: "var(--color-warning)",
    bg: "#fffbeb",
    dot: "var(--color-warning)",
  },
};

const typeIcons: Record<Agent["type"], string> = {
  productivity: "⚡",
  data: "📊",
  content: "✍️",
  admin: "⚙️",
  technical: "🔧",
};

/* ── Props ────────────────────────────────────────────────────────── */

interface AgentCardProps {
  agent: Agent;
  /** Called to run the agent. Pass `skipApiCall=true` when the card already
   *  called the API itself (non‑empty prompt flow). */
  onRun?: (id: string, skipApiCall?: boolean) => void;
  onPause?: (id: string) => void;
  onConfigure?: (id: string) => void;
  className?: string;
  "data-testid"?: string;
}

/* ── Component ────────────────────────────────────────────────────── */

export function AgentCard({
  agent,
  onRun,
  onPause,
  onConfigure,
  className,
  "data-testid": testId,
}: AgentCardProps) {
  const t = useTranslations("agents");
  const tc = useTranslations("agents.card");
  const status = statusConfig[agent.status];

  /* ── Prompt dialog state ─────────────────────────────────────── */
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [promptValue, setPromptValue] = React.useState("");
  const [isRunning, setIsRunning] = React.useState(false);
  const [refusal, setRefusal] = React.useState<{
    reason: string;
    recommendation: { agent_type: string; label: string; reason: string } | null;
  } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus the input when prompt dialog appears
  React.useEffect(() => {
    if (showPrompt && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showPrompt]);

  /* ── Handlers ────────────────────────────────────────────────── */
  const handleRunClick = () => {
    setRefusal(null);
    setPromptValue("");
    setShowPrompt(true);
  };

  const handlePromptSubmit = async () => {
    const prompt = promptValue.trim();
    if (!prompt) {
      // No prompt → let parent handle full flow (backward compat)
      setShowPrompt(false);
      onRun?.(agent.id);
      return;
    }

    setIsRunning(true);
    setRefusal(null);
    try {
      const res = await api.runAgent(agent.id, prompt);
      if (res.error) {
        // API error — let parent retry as a normal run
        setShowPrompt(false);
        onRun?.(agent.id);
        return;
      }

      const data = res.data;
      if (data?.accepted === false) {
        // Agent refused → show reason + recommendation inline
        setShowPrompt(false);
        setRefusal({
          reason: data.refusal_reason ?? t("error"),
          recommendation: data.recommendation ?? null,
        });
        // Do NOT call onRun — agent didn't execute
      } else {
        // Agent accepted → tell parent to update status (skip duplicate API call)
        setShowPrompt(false);
        onRun?.(agent.id, true);
      }
    } catch {
      setShowPrompt(false);
      onRun?.(agent.id);
    } finally {
      setIsRunning(false);
    }
  };

  const handlePromptKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit();
    }
    if (e.key === "Escape") {
      setShowPrompt(false);
    }
  };

  const handleDismissRefusal = () => setRefusal(null);

  /* ── Translate name & description with fallback to raw data ── */
  const nameKey = `mock.${agent.id}.name`;
  const descKey = `mock.${agent.id}.desc`;
  const translatedName = t(nameKey);
  const translatedDesc = t(descKey);
  const displayName = translatedName === nameKey ? agent.name : translatedName;
  const displayDesc = translatedDesc === descKey ? agent.description : translatedDesc;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-[var(--radius-lg)]",
        "border border-[var(--border-default)] bg-[var(--surface-0)]",
        "p-5 shadow-[var(--shadow-sm)] transition-shadow",
        "hover:shadow-[var(--shadow-md)]",
        className
      )}
      data-testid={testId || "agent-card"}
    >
      {/* Status indicator + sr-only status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: status.dot }}
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-[var(--text-tertiary)]">
            {t(`types.${agent.type}`)}
          </span>
        </div>
        <span className="sr-only">
          {t(`statusDescriptions.${agent.status}`)}
        </span>
        <span className="text-lg" aria-hidden="true" role="img">
          {typeIcons[agent.type]}
        </span>
      </div>

      {/* Agent name */}
      <h3 className="text-md font-semibold text-[var(--text-primary)] leading-tight">
        {displayName}
      </h3>

      {/* Description */}
      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
        {displayDesc}
      </p>

      {/* Metrics */}
      <div className="flex gap-4 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {agent.lastRun
              ? `${tc("lastRun")}: ${new Date(agent.lastRun).toLocaleDateString()}`
              : tc("never")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
          <Activity className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {tc("successRate")}: {agent.successRate}%
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-default)]">
        {agent.status !== "running" ? (
          <button
            type="button"
            onClick={handleRunClick}
            disabled={!agent.isEditable || isRunning}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5",
              "text-xs font-medium transition-colors",
              "bg-[var(--brand-accent)] text-[var(--brand-accent-foreground)]",
              "hover:bg-[var(--brand-accent-hover)]",
              "focus-visible:outline-2 focus-visible:outline-offset-1",
              "focus-visible:outline-[var(--brand-accent)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "min-h-[36px]"
            )}
            aria-label={`${tc("runNow")} ${agent.name}`}
            data-testid="agent-run"
          >
            {isRunning ? (
              <Sparkles className="h-3 w-3 animate-pulse" aria-hidden="true" />
            ) : (
              <Play className="h-3 w-3" aria-hidden="true" />
            )}
            {isRunning ? "…" : tc("runNow")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onPause?.(agent.id)}
            disabled={!agent.isEditable}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5",
              "text-xs font-medium transition-colors",
              "bg-[var(--color-warning)] text-white",
              "hover:bg-[#d48922]",
              "focus-visible:outline-2 focus-visible:outline-offset-1",
              "focus-visible:outline-[var(--brand-accent)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "min-h-[36px]"
            )}
            aria-label={`${tc("pause")} ${agent.name}`}
            data-testid="agent-pause"
          >
            <Pause className="h-3 w-3" aria-hidden="true" />
            {tc("pause")}
          </button>
        )}

        <button
          type="button"
          onClick={() => onConfigure?.(agent.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5",
            "text-xs font-medium transition-colors",
            "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
            "focus-visible:outline-2 focus-visible:outline-offset-1",
            "focus-visible:outline-[var(--brand-accent)]",
            "min-h-[36px]"
          )}
          aria-label={`${tc("configure")} ${agent.name}`}
          data-testid="agent-configure"
        >
          <Settings className="h-3 w-3" aria-hidden="true" />
          {tc("configure")}
        </button>
      </div>

      {/* ── Inline prompt input (shown when user clicks Run) ─────── */}
      {showPrompt && (
        <div className="flex items-center gap-2 pt-1 animate-in fade-in slide-in-from-top-1">
          <input
            ref={inputRef}
            type="text"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            onKeyDown={handlePromptKeyDown}
            placeholder="O que você quer que eu faça? (Enter = enviar, Esc = cancelar)"
            className={cn(
              "flex-1 h-9 rounded-[var(--radius-md)] border border-[var(--border-default)]",
              "bg-[var(--surface-1)] px-3 text-xs text-[var(--text-primary)]",
              "placeholder:text-[var(--text-tertiary)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/30"
            )}
            disabled={isRunning}
            aria-label="Instrução para o agente"
          />
          <button
            type="button"
            onClick={handlePromptSubmit}
            disabled={isRunning}
            className={cn(
              "inline-flex items-center gap-1 rounded-[var(--radius-md)] h-9 px-3",
              "text-xs font-medium bg-[var(--brand-accent)] text-white",
              "hover:bg-[var(--brand-accent-hover)] disabled:opacity-50"
            )}
            aria-label="Enviar instrução"
          >
            <Send className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setShowPrompt(false)}
            disabled={isRunning}
            className="inline-flex items-center justify-center h-9 w-9 rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]"
            aria-label="Cancelar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Refusal + Recommendation banner ──────────────────────── */}
      {refusal && (
        <div
          className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-amber-300/60 bg-amber-50 p-3 animate-in fade-in slide-in-from-bottom-1"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-900 mb-0.5">
                Agente recusou a tarefa
              </p>
              <p className="text-xs text-amber-800">{refusal.reason}</p>
            </div>
            <button
              type="button"
              onClick={handleDismissRefusal}
              className="shrink-0 text-amber-500 hover:text-amber-700"
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {refusal.recommendation && (
            <div className="flex items-start gap-2 pl-6">
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-green-600 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-green-800">
                  Recomendação: experimente um agente de{" "}
                  <span className="font-semibold">{refusal.recommendation.label}</span>
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  {refusal.recommendation.reason}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
