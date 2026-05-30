/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Agents — AgentsContent (Client)
   Searchable, filterable grid of agent cards.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { AgentCardsSkeleton } from "@/components/dashboard/DashboardSkeletons";
import {
  useAgentStore,
  type AgentType,
  type AgentStatus,
  type Agent,
} from "@/store";
import { cn } from "@/lib/utils";

/* ── Mock agent data ──────────────────────────────────────────────── */

const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Email Attachment Saver",
    description: "Monitors inbox for attachments, saves them to Google Drive, and notifies via Slack.",
    type: "productivity",
    status: "running",
    lastRun: new Date().toISOString(),
    successRate: 98,
    totalExecutions: 1423,
    isEditable: true,
  },
  {
    id: "2",
    name: "Weekly Report Generator",
    description: "Compiles data from multiple sources and generates a formatted PDF report every Monday.",
    type: "data",
    status: "idle",
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    successRate: 100,
    totalExecutions: 52,
    isEditable: true,
  },
  {
    id: "3",
    name: "Social Media Monitor",
    description: "Tracks brand mentions across Twitter, LinkedIn, and Reddit. Auto-responds to support queries.",
    type: "content",
    status: "running",
    lastRun: new Date().toISOString(),
    successRate: 87,
    totalExecutions: 3890,
    isEditable: true,
  },
  {
    id: "4",
    name: "Database Backup Agent",
    description: "Performs nightly database backups and verifies integrity. Alerts on failure.",
    type: "admin",
    status: "error",
    lastRun: new Date(Date.now() - 43200000).toISOString(),
    successRate: 95,
    totalExecutions: 365,
    isEditable: true,
  },
  {
    id: "5",
    name: "API Health Checker",
    description: "Pings all internal APIs every minute. Escalates to PagerDuty on downtime.",
    type: "technical",
    status: "running",
    lastRun: new Date().toISOString(),
    successRate: 99,
    totalExecutions: 8760,
    isEditable: true,
  },
  {
    id: "6",
    name: "Invoice Processor",
    description: "Extracts data from PDF invoices using OCR and pushes to accounting software.",
    type: "data",
    status: "paused",
    lastRun: new Date(Date.now() - 259200000).toISOString(),
    successRate: 92,
    totalExecutions: 210,
    isEditable: false,
  },
  {
    id: "7",
    name: "Meeting Scheduler",
    description: "Coordinates calendars across teams to find optimal meeting times and sends invites.",
    type: "productivity",
    status: "idle",
    lastRun: new Date(Date.now() - 3600000).toISOString(),
    successRate: 96,
    totalExecutions: 840,
    isEditable: true,
  },
  {
    id: "8",
    name: "Content Translator",
    description: "Translates blog posts and documentation into 9 languages using AI.",
    type: "content",
    status: "idle",
    lastRun: null,
    successRate: 0,
    totalExecutions: 0,
    isEditable: true,
  },
];

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

export function AgentsContent() {
  const t = useTranslations("agents");
  const { filters, setFilters, resetFilters } = useAgentStore();
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded) return <AgentCardsSkeleton />;

  /* Filter logic */
  const filtered = mockAgents.filter((agent) => {
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
            aria-label="Reset all filters"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Reset</span>
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
          aria-label="Agents"
        >
          {filtered.map((agent) => (
            <div key={agent.id} role="listitem">
              <AgentCard
                agent={agent}
                data-testid={`agent-card-${agent.id}`}
              />
            </div>
          ))}
        </div>
      ) : (
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
            Clear all filters
          </button>
        </div>
      )}
    </>
  );
}
