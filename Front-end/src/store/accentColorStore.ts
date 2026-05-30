/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Accent Color Store
   Persists accent color preference to localStorage.
   Controls --brand-accent, --brand-accent-light, --brand-accent-hover,
   and --brand-accent-dynamic across the entire system.
   ═══════════════════════════════════════════════════════════════════ */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccentColor =
  | "yellow"
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "red"
  | "pink";

/* ── Main accent color ───────────────────────────────────────────── */

export const accentColorMap: Record<AccentColor, string> = {
  yellow: "#FFD43B",
  blue: "#3776AB",
  green: "#1d9e75",
  purple: "#534ab7",
  orange: "#e8732e",
  red: "#e24b4a",
  pink: "#d946ef",
};

export const accentColorMapDark: Record<AccentColor, string> = {
  yellow: "#FFE066",
  blue: "#4A9FD4",
  green: "#47d9a8",
  purple: "#7c73e0",
  orange: "#f59e6b",
  red: "#f87171",
  pink: "#f0abfc",
};

/* ── Light variant (backgrounds, selection, icon circles) ────────── */

export const accentColorLightMap: Record<AccentColor, string> = {
  yellow: "#FFF8E1",
  blue: "#E8F0F8",
  green: "#E8F5F0",
  purple: "#EDEBF8",
  orange: "#FDF0E8",
  red: "#FCEBEB",
  pink: "#FCE8FD",
};

export const accentColorLightMapDark: Record<AccentColor, string> = {
  yellow: "#2A2618",
  blue: "#1A2A35",
  green: "#1A2A24",
  purple: "#1D1B30",
  orange: "#2A2018",
  red: "#2A1A1A",
  pink: "#2A1A28",
};

/* ── Hover variant ────────────────────────────────────────────────── */

export const accentColorHoverMap: Record<AccentColor, string> = {
  yellow: "#E6BF36",
  blue: "#2E5F8A",
  green: "#178A64",
  purple: "#453CA0",
  orange: "#D1651F",
  red: "#D03A39",
  pink: "#C530E0",
};

export const accentColorHoverMapDark: Record<AccentColor, string> = {
  yellow: "#E6C84A",
  blue: "#3D8FBF",
  green: "#3AC894",
  purple: "#6A62CC",
  orange: "#E08D55",
  red: "#E55E5E",
  pink: "#E090F0",
};

/* ── Store interface ──────────────────────────────────────────────── */

interface AccentColorStore {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

/* ── Apply — sets all 4 CSS custom properties ────────────────────── */

export function applyAccentColor(accentColor: AccentColor): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");

  const main = isDark ? accentColorMapDark[accentColor] : accentColorMap[accentColor];
  const light = isDark ? accentColorLightMapDark[accentColor] : accentColorLightMap[accentColor];
  const hover = isDark ? accentColorHoverMapDark[accentColor] : accentColorHoverMap[accentColor];

  root.style.setProperty("--brand-accent-dynamic", main);
  root.style.setProperty("--brand-accent", main);
  root.style.setProperty("--brand-accent-light", light);
  root.style.setProperty("--brand-accent-hover", hover);
}

/* ── Zustand persisted store ──────────────────────────────────────── */

export const useAccentColorStore = create<AccentColorStore>()(
  persist(
    (set) => ({
      accentColor: "yellow",

      setAccentColor: (accentColor) => {
        applyAccentColor(accentColor);
        set({ accentColor });
      },
    }),
    {
      name: "pytomatiza-accent-color",
      partialize: (state) => ({ accentColor: state.accentColor }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyAccentColor(state.accentColor);
        }
      },
    }
  )
);
