/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Layout — AppearanceSync
   Re-applies background surface colors when the theme switches
   between light and dark mode.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import { useSettingsStore, backgroundPresets } from "@/store/settingsStore";
import { useAccentColorStore, applyAccentColor } from "@/store/accentColorStore";

/** Lighten or darken a hex color by a percentage */
function adjustHexColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function applyBackground(backgroundColor: string, isDark: boolean) {
  const root = document.documentElement;
  const preset = backgroundPresets[backgroundColor as keyof typeof backgroundPresets];
  if (preset) {
    const mode = isDark ? preset.dark : preset.light;
    root.style.setProperty("--surface-0", mode.s0);
    root.style.setProperty("--surface-1", mode.s1);
    root.style.setProperty("--surface-2", mode.s2);
  } else if (backgroundColor.startsWith("#")) {
    root.style.setProperty("--surface-0", backgroundColor);
    root.style.setProperty("--surface-1", adjustHexColor(backgroundColor, isDark ? 4 : -4));
    root.style.setProperty("--surface-2", adjustHexColor(backgroundColor, isDark ? 8 : -8));
  } else {
    const fallback = isDark ? backgroundPresets.default.dark : backgroundPresets.default.light;
    root.style.setProperty("--surface-0", fallback.s0);
    root.style.setProperty("--surface-1", fallback.s1);
    root.style.setProperty("--surface-2", fallback.s2);
  }
}

export function AppearanceSync() {
  const theme = useThemeStore((s) => s.theme);
  const backgroundColor = useSettingsStore((s) => s.backgroundColor);
  const accentColor = useAccentColorStore((s) => s.accentColor);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const isDark =
      root.classList.contains("dark") ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches) ||
      theme === "dark";

    applyBackground(backgroundColor, isDark);
    applyAccentColor(accentColor);
  }, [theme, backgroundColor, accentColor]);

  // Listen for system prefers-color-scheme changes
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyBackground(backgroundColor, mql.matches);
      applyAccentColor(accentColor);
    };

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme, backgroundColor]);

  return null;
}
