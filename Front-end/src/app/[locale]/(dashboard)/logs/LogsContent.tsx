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
  CheckCircle,
  Hourglass,
  XCircle,
  Clock,
} from "lucide-react";
import { LoginOverlay } from "@/components/ui/LoginOverlay";

/* ── Component ────────────────────────────────────────────────────── */

export function LogsContent() {
  const t = useTranslations("logs");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { key: "totalExecutions", value: "0", icon: ClipboardList },
    { key: "successRate", value: "---", icon: CheckCircle },
    { key: "pendingApprovals", value: "0", icon: Hourglass },
    { key: "errors24h", value: "0", icon: XCircle },
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

      <LoginOverlay label={t("loginPrompt")}>
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

        {/* ── Logs table (empty — mock data removed) ────────────────── */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] overflow-hidden">
          <div className="flex items-center gap-4 border-b border-[var(--border-default)] px-5 py-3">
            <Clock className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden="true" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">{t("tableHeader")}</span>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-10 w-10 text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
            <p className="text-sm text-[var(--text-secondary)]">
              {t("tableEmpty")}
            </p>
          </div>
        </div>
      </LoginOverlay>
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
