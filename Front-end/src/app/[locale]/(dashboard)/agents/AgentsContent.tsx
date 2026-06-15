/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Agents — AgentsContent (Client)
   Receives server-fetched agent data. Handles search, filtering,
   and interactive actions (run, pause, configure) via API calls.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { LoginAlert } from "@/components/ui/LoginAlert";
import {
  useAgentStore,
  type AgentType,
  type AgentStatus,
  type Agent,
} from "@/store";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

/* ── Filter option definitions ───────────────────────────────────── */

const agentTypes: { value: AgentType | "all"; labelKey: string }[] = [
  { value: "all", labelKey: "allTypes" },
  { value: "productivity", labelKey: "types.productivity" },
  { value: "data", labelKey: "types.data" },
  { value: "content", labelKey: "types.content" },
  { value: "admin", labelKey: "types.admin" },
  { value: "technical", labelKey: "types.technical" },
];

const agentStatuses: { value: AgentStatus | "all"; labelKey: string }[] = [
  { value: "all", labelKey: "allStatuses" },
  { value: "idle", labelKey: "statuses.idle" },
  { value: "running", labelKey: "statuses.running" },
  { value: "error", labelKey: "statuses.error" },
  { value: "paused", labelKey: "statuses.paused" },
];

/* ── Props ────────────────────────────────────────────────────────── */

interface AgentsContentProps {
  /** Agents pre-fetched on the server (SSR) */
  initialAgents: Agent[];
}

/* ── Component ────────────────────────────────────────────────────── */

export function AgentsContent({ initialAgents }: AgentsContentProps) {
  const t = useTranslations("agents");
  const { filters, setFilters, resetFilters, setAgents } = useAgentStore();

  const [agents, setLocalAgents] = React.useState<Agent[]>(initialAgents);
  const [actionError, setActionError] = React.useState<string | null>(null);

  /* Sync initial agents to global store on mount */
  React.useEffect(() => {
    setAgents(initialAgents);
  }, [initialAgents, setAgents]);

  /* ── Action handlers ────────────────────────────────────────── */

  const handleRun = React.useCallback(async (id: string) => {
    setActionError(null);
    try {
      const res = await api.runAgent(id);
      if (res.error) {
        setActionError(res.error.message);
        return;
      }
      setLocalAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "running" as const } : a))
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("error"));
    }
  }, []);

  const handlePause = React.useCallback(async (id: string) => {
    setActionError(null);
    try {
      const res = await api.pauseAgent(id);
      if (res.error) {
        setActionError(res.error.message);
        return;
      }
      setLocalAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "paused" as const } : a))
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("error"));
    }
  }, []);

  const handleConfigure = React.useCallback((id: string) => {
    window.location.href = `/agents?id=${id}`;
  }, []);

  /* ── Filter logic (client-side) ─────────────────────────────── */

  const filtered = agents.filter((agent) => {
    const matchesSearch =
      !filters.search ||
      agent.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      agent.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType =
      filters.type === "all" || agent.type === filters.type;
    const matchesStatus =
      filters.status === "all" || agent.status === filters.status;
    return matchesSearch && matchesType && matchesStatus;
  });

  const hasFilters =
    filters.search || filters.type !== "all" || filters.status !== "all";

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Login prompt for unauthenticated users */}
      <LoginAlert label={t("loginPrompt")} />

      {/* Action error banner */}
      {actionError && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[#fef2f2] px-4 py-3 text-sm text-[var(--text-primary)]"
        >
          {actionError}
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder={t("searchPlaceholder")}
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            aria-label={t("searchPlaceholder")}
            data-testid="agents-search"
            className={cn(
              "h-10 w-full rounded-[var(--radius-md)] pl-9 pr-3",
              "border border-[var(--border-default)]",
              "bg-[var(--surface-0)] text-sm",
              "placeholder:text-[var(--text-tertiary)]",
              "focus-visible:outline-2 focus-visible:outline-offset-1",
              "focus-visible:outline-[var(--brand-accent)]"
            )}
          />
        </div>

        {/* Type filter */}
        <select
          value={filters.type}
          onChange={(e) =>
            setFilters({ type: e.target.value as AgentType | "all" })
          }
          aria-label={t("filterByType")}
          data-testid="agents-type-filter"
          className={cn(
            "h-10 rounded-[var(--radius-md)] border border-[var(--border-default)]",
            "bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)]",
            "focus-visible:outline-2 focus-visible:outline-offset-1",
            "focus-visible:outline-[var(--brand-accent)]"
          )}
        >
          {agentTypes.map(({ value, labelKey }) => (
            <option key={value} value={value}>
              {t(labelKey)}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters({ status: e.target.value as AgentStatus | "all" })
          }
          aria-label={t("filterByStatus")}
          data-testid="agents-status-filter"
          className={cn(
            "h-10 rounded-[var(--radius-md)] border border-[var(--border-default)]",
            "bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)]",
            "focus-visible:outline-2 focus-visible:outline-offset-1",
            "focus-visible:outline-[var(--brand-accent)]"
          )}
        >
          {agentStatuses.map(({ value, labelKey }) => (
            <option key={value} value={value}>
              {t(labelKey)}
            </option>
          ))}
        </select>

        {/* Reset filters */}
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            data-testid="agents-reset-filters"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2",
              "text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
              "focus-visible:outline-2 focus-visible:outline-offset-1",
              "focus-visible:outline-[var(--brand-accent)]",
              "min-h-[40px]"
            )}
            aria-label={t("resetFilters") || "Reset all filters"}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t("resetFilters")}</span>
          </button>
        )}
      </div>

      {/* Results count */}
      <p
        className="text-xs text-[var(--text-tertiary)]"
        aria-live="polite"
        aria-atomic="true"
      >
        {t("agentsFound", { count: filtered.length })}
      </p>

      {/* Agent cards grid or empty state */}
      {filtered.length > 0 ? (
        <div
          className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
          role="list"
          aria-label={t("title")}
        >
          {filtered.map((agent) => (
            <div key={agent.id} role="listitem">
              <AgentCard
                agent={agent}
                onRun={handleRun}
                onPause={handlePause}
                onConfigure={handleConfigure}
                data-testid={`agent-card-${agent.id}`}
              />
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        /* No agents at all — real empty state */
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          role="status"
          data-testid="agents-empty"
        >
          <SlidersHorizontal className="h-10 w-10 text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
          <p className="text-sm text-[var(--text-secondary)] max-w-sm">
            {t("empty")}
          </p>
        </div>
      ) : (
        /* Has agents but none match filters */
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          role="status"
          data-testid="agents-empty"
        >
          <SlidersHorizontal className="h-10 w-10 text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
          <p className="text-sm text-[var(--text-secondary)] max-w-sm">
            {t("empty")}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 text-sm font-medium text-[var(--brand-accent)] hover:underline"
          >
            {t("resetFilters")}
          </button>
        </div>
      )}
    </>
  );
}
