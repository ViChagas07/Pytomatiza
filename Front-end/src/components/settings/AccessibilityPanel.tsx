/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Settings — Accessibility Panel
   POUR philosophy controls: Perceivable, Operable, Understandable, Robust.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useTranslations } from "next-intl";
import {
  Contrast,
  MonitorStop,
  Focus,
  ArrowUpFromLine,
  Underline,
  Ear,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store";

export function AccessibilityPanel() {
  const t = useTranslations("settings.accessibility");
  const {
    highContrast,
    setHighContrast,
    reduceMotion,
    setReduceMotion,
    enlargedFocus,
    setEnlargedFocus,
    alwaysShowSkipLinks,
    setAlwaysShowSkipLinks,
    underlineLinks,
    setUnderlineLinks,
    screenReaderOptimizations,
    setScreenReaderOptimizations,
  } = useSettingsStore();

  const items = [
    {
      key: "highContrast",
      icon: Contrast,
      title: t("highContrast"),
      description: t("highContrastDescription"),
      checked: highContrast,
      onChange: setHighContrast,
    },
    {
      key: "reduceMotion",
      icon: MonitorStop,
      title: t("reduceMotion"),
      description: t("reduceMotionDescription"),
      checked: reduceMotion,
      onChange: setReduceMotion,
    },
    {
      key: "focusOutline",
      icon: Focus,
      title: t("focusOutline"),
      description: t("focusOutlineDescription"),
      checked: enlargedFocus,
      onChange: setEnlargedFocus,
    },
    {
      key: "skipLinks",
      icon: ArrowUpFromLine,
      title: t("skipLinks"),
      description: t("skipLinksDescription"),
      checked: alwaysShowSkipLinks,
      onChange: setAlwaysShowSkipLinks,
    },
    {
      key: "underlineLinks",
      icon: Underline,
      title: t("underlineLinks"),
      description: t("underlineLinksDescription"),
      checked: underlineLinks,
      onChange: setUnderlineLinks,
    },
    {
      key: "screenReader",
      icon: Ear,
      title: t("screenReader"),
      description: t("screenReaderDescription"),
      checked: screenReaderOptimizations,
      onChange: setScreenReaderOptimizations,
    },
  ];

  return (
    <div className="space-y-6">
      {items.map(({ key, icon: Icon, title, description, checked, onChange }) => (
        <div
          key={key}
          className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
                <Icon className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
              </div>
            </div>
            <div className="flex items-center">
              <ToggleSwitch checked={checked} onChange={onChange} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-[var(--brand-accent)]" : "bg-[var(--surface-2)]"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
