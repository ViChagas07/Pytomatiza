/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ UI — Accent Color Picker
   Allows users to pick the accent color used for the '+' and highlights.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useTranslations } from "next-intl";
import { useAccentColorStore, accentColorMap, type AccentColor } from "@/store";
import { cn } from "@/lib/utils";
import { Palette } from "lucide-react";

const accentOptions: { value: AccentColor; label: string }[] = [
  { value: "yellow", label: "Yellow" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
  { value: "red", label: "Red" },
  { value: "pink", label: "Pink" },
];

export function AccentColorPicker() {
  const t = useTranslations("settings.appearance");
  const { accentColor, setAccentColor } = useAccentColorStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
          <Palette className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t("accentColor")}</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t("accentColorDescription")}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {accentOptions.map(({ value, label }) => {
          const isActive = accentColor === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setAccentColor(value)}
              className={cn(
                "group relative flex h-10 w-10 items-center justify-center rounded-full transition-all",
                "focus-visible:outline-2 focus-visible:outline-offset-2",
                "focus-visible:outline-[var(--brand-accent)]",
                isActive
                  ? "ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--surface-0)]"
                  : "hover:scale-105"
              )}
              style={{ backgroundColor: accentColorMap[value] }}
              aria-label={`${label} accent color`}
              aria-pressed={isActive}
              title={label}
            >
              {isActive && (
                <span className="block h-4 w-4 rounded-full bg-[var(--surface-0)] shadow-sm" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
