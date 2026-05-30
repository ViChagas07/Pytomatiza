/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Settings — Language & Region Panel
   Controls: language switcher and timezone selection.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useTranslations } from "next-intl";
import { Globe, Clock } from "lucide-react";
import { useSettingsStore } from "@/store";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

const timezones = [
  "UTC",
  "America/Sao_Paulo",
  "America/New_York",
  "America/Los_Angeles",
  "America/Mexico_City",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function LanguageRegionPanel() {
  const t = useTranslations("settings.languageRegion");
  const { timezone, setTimezone } = useSettingsStore();

  return (
    <div className="space-y-8">
      {/* Language */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
              <Globe className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t("language")}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t("languageDescription")}</p>
            </div>
          </div>
          <LanguageSwitcher variant="select" />
        </div>
      </div>

      {/* Timezone */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
              <Clock className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t("timezone")}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t("timezoneDescription")}</p>
            </div>
          </div>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
            aria-label={t("timezone")}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
