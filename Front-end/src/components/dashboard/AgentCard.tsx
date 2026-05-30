/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Dashboard — AgentCard
   Displays agent status, type, and key metrics. Fully accessible.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useTranslations } from "next-intl";
import { Play, Pause, Settings, Clock, Activity } from "lucide-react";
import { type Agent } from "@/store";
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
  onRun?: (id: string) => void;
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

  /* ── Translate name & description with fallback to raw data ── */
  const nameKey = `mock.${agent.id}.name`;
  const descKey = `mock.${agent.id}.desc`;
  const translatedName = t(nameKey);
  const translatedDesc = t(descKey);
  // next-intl returns the key itself when no translation exists
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
            onClick={() => onRun?.(agent.id)}
            disabled={!agent.isEditable}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5",
              "text-xs font-medium transition-colors",
              "bg-[var(--brand-accent)] text-white",
              "hover:bg-[var(--brand-accent-hover)]",
              "focus-visible:outline-2 focus-visible:outline-offset-1",
              "focus-visible:outline-[var(--brand-accent)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "min-h-[36px]"
            )}
            aria-label={`${tc("runNow")} ${agent.name}`}
            data-testid="agent-run"
          >
            <Play className="h-3 w-3" aria-hidden="true" />
            {tc("runNow")}
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
    </article>
  );
}
