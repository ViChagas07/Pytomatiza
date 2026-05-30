/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Settings — Advanced Panel
   Cache clearing, settings reset, and app version info.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useTranslations } from "next-intl";
import { Trash2, RotateCcw, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store";

export function AdvancedPanel() {
  const t = useTranslations("settings.advanced");
  const { resetAll } = useSettingsStore();

  const handleClearCache = () => {
    if (typeof window !== "undefined" && window.confirm(t("clearCacheConfirm"))) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      } catch {
        // ignore
      }
    }
  };

  const handleResetSettings = () => {
    if (typeof window !== "undefined" && window.confirm(t("resetSettingsConfirm"))) {
      resetAll();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8">
      {/* Clear cache */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-warning)]/10">
              <Trash2 className="h-5 w-5 text-[var(--color-warning)]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t("clearCache")}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t("clearCacheDescription")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearCache}
            className={cn(
              "rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 px-4 py-2 text-sm font-medium",
              "text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10 transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
            )}
          >
            {t("clearCacheButton")}
          </button>
        </div>
      </div>

      {/* Reset settings */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-danger)]/10">
              <RotateCcw className="h-5 w-5 text-[var(--color-danger)]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t("resetSettings")}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t("resetSettingsDescription")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetSettings}
            className={cn(
              "rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 px-4 py-2 text-sm font-medium",
              "text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
            )}
          >
            {t("resetSettingsButton")}
          </button>
        </div>
      </div>

      {/* App version */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)]">
            <Package className="h-5 w-5 text-[var(--text-tertiary)]" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t("appVersion")}</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">0.1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
