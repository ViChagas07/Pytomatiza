/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Theme Store
   Persists theme preference (light/dark/system) to localStorage.
   ═══════════════════════════════════════════════════════════════════ */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeStore {
  /** Currently selected theme mode */
  theme: ThemeMode;
  /** Apply the theme by writing to <html> class + localStorage */
  setTheme: (theme: ThemeMode) => void;
  /** Toggle between light and dark (skips system) */
  toggleTheme: () => void;
  /** Resolved effective theme (after system resolution) */
  resolvedTheme: "light" | "dark";
  /** Update resolved theme based on system/media query */
  setResolvedTheme: (resolved: "light" | "dark") => void;
}

function applyThemeClass(theme: ThemeMode): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", isDark);
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: "light",

      setTheme: (theme) => {
        applyThemeClass(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const current = get().theme;
        const next: ThemeMode = current === "dark" ? "light" : "dark";
        applyThemeClass(next);
        set({ theme: next });
      },

      setResolvedTheme: (resolved) => set({ resolvedTheme: resolved }),
    }),
    {
      name: "pytomatiza-theme",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
