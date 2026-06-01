/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Dashboard — Stats Card
   Key metric display with icon, value, label, and trend indicator.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
  "data-testid"?: string;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
  "data-testid": testId,
}: StatsCardProps) {
  const t = useTranslations("common");
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border-default)]",
        "bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]",
        className
      )}
      data-testid={testId || "stats-card"}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[var(--text-tertiary)]">
          {label}
        </span>
        <Icon className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden="true" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-[var(--text-primary)]">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend.positive ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
            )}
            aria-label={`${trend.positive ? t("increasedBy") : t("decreasedBy")} ${trend.value}`}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
