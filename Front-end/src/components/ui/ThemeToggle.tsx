/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ UI — ThemeToggle
   Cycles light → dark → system. Accessible button with live label.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { useThemeStore, type ThemeMode } from "@/store";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

const iconMap: Record<ThemeMode, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const t = useTranslations("a11y");
  const tTheme = useTranslations("theme");
  const { theme, setTheme } = useThemeStore();

  // Cycle: light → dark → system → light
  const cycle = React.useCallback(() => {
    const order: ThemeMode[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  }, [theme, setTheme]);

  const Icon = iconMap[theme];
  const label = `${t("themeToggle")}: ${tTheme(theme)}`;

  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center",
        "rounded-[var(--radius-md)]",
        "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
        "hover:text-[var(--text-primary)] transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "focus-visible:outline-[var(--brand-accent)]",
        className
      )}
      aria-label={label}
      data-testid="theme-toggle"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
