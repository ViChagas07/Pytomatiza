/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Logs & Approvals — Content
   Displays automation execution logs and pending approval requests.
   Fully internationalized via next-intl.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Hourglass,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Mock log entries ────────────────────────────────────────────── */

interface LogEntry {
  id: string;
  agentKey: string;
  actionKey: string;
  status: "success" | "error" | "pending" | "running";
  timestamp: string;
  duration: string;
}

const mockLogs: LogEntry[] = [
  {
    id: "log1",
    agentKey: "emailSaver",
    actionKey: "log1",
    status: "success",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    duration: "4.2s",
  },
  {
    id: "log2",
    agentKey: "reportGen",
    actionKey: "log2",
    status: "success",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    duration: "12.8s",
  },
  {
    id: "log3",
    agentKey: "socialMonitor",
    actionKey: "log3",
    status: "success",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    duration: "2.1s",
  },
  {
    id: "log4",
    agentKey: "dbBackup",
    actionKey: "log4",
    status: "error",
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    duration: "45.3s",
  },
  {
    id: "log5",
    agentKey: "apiChecker",
    actionKey: "log5",
    status: "success",
    timestamp: new Date(Date.now() - 60000).toISOString(),
    duration: "0.8s",
  },
  {
    id: "log6",
    agentKey: "invoiceProc",
    actionKey: "log6",
    status: "pending",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    duration: "—",
  },
  {
    id: "log7",
    agentKey: "meetingSched",
    actionKey: "log7",
    status: "success",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    duration: "3.5s",
  },
  {
    id: "log8",
    agentKey: "contentTrans",
    actionKey: "log8",
    status: "running",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    duration: "ongoing",
  },
];

/* ── Component ────────────────────────────────────────────────────── */

export function LogsContent() {
  const t = useTranslations("logs");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  /* ── Status config (labels from i18n) ───────────────────────── */
  const statusConfig: Record<
    LogEntry["status"],
    { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
  > = {
    success: { icon: CheckCircle, color: "text-[var(--color-success)]", bg: "bg-[var(--color-success)]/10" },
    error: { icon: XCircle, color: "text-[var(--color-danger)]", bg: "bg-[var(--color-danger)]/10" },
    pending: { icon: Hourglass, color: "text-[var(--color-warning)]", bg: "bg-[var(--color-warning)]/10" },
    running: { icon: AlertTriangle, color: "text-[var(--brand-accent)]", bg: "bg-[var(--brand-accent-light)]" },
  };

  const stats = [
    { key: "totalExecutions", value: "1,247", icon: ClipboardList },
    { key: "successRate", value: "96.4%", icon: CheckCircle },
    { key: "pendingApprovals", value: "3", icon: Hourglass },
    { key: "errors24h", value: "1", icon: XCircle },
  ];

  if (!loaded) {
    return <LogsSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {t("subtitle")}
        </p>
      </div>

      {/* ── Stats row ───────────────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ key, value, icon: Icon }) => (
          <div
            key={key}
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
                <Icon className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">{t(`stats.${key}`)}</p>
                <p className="text-xl font-semibold text-[var(--text-primary)]">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Logs table ───────────────────────────────────────────── */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-[var(--border-default)] px-5 py-3">
          <Clock className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden="true" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">{t("tableHeader")}</span>
        </div>

        {/* Table body */}
        <div role="list" aria-label={t("tableAriaLabel")}>
          {mockLogs.map((log) => {
            const s = statusConfig[log.status];
            const Icon = s.icon;
            const durationLabel = log.duration === "ongoing" ? t("duration.ongoing") : log.duration;
            return (
              <div
                key={log.id}
                role="listitem"
                className={cn(
                  "flex items-center gap-4 border-b border-[var(--border-default)] px-5 py-4",
                  "last:border-b-0 transition-colors hover:bg-[var(--surface-1)]"
                )}
              >
                {/* Status icon */}
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", s.bg)}>
                  <Icon className={cn("h-4 w-4", s.color)} aria-hidden="true" />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {t(`agents.${log.agentKey}`)}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {t(`actions.${log.actionKey}`)}
                  </p>
                </div>

                {/* Meta */}
                <div className="hidden sm:flex sm:items-center sm:gap-4 shrink-0">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)] tabular-nums w-12 text-right">
                    {durationLabel}
                  </span>
                </div>

                {/* Status badge */}
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0",
                    s.bg,
                    s.color
                  )}
                >
                  {t(`status.${log.status}`)}
                </span>

                {/* Mobile time */}
                <span className="text-xs text-[var(--text-tertiary)] sm:hidden shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────────────────── */

function LogsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-48 rounded-[var(--radius-md)] bg-[var(--surface-2)]" />
        <div className="mt-2 h-4 w-72 rounded-[var(--radius-md)] bg-[var(--surface-2)]" />
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[var(--radius-md)] bg-[var(--surface-2)]" />
              <div className="space-y-2">
                <div className="h-3 w-20 rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
                <div className="h-5 w-14 rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 space-y-4">
        <div className="h-4 w-36 rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-[var(--surface-2)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
              <div className="h-3 w-64 rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
            </div>
            <div className="h-4 w-12 rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
            <div className="h-5 w-20 rounded-full bg-[var(--surface-2)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
