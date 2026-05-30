/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Settings Store
   Persists user preferences for appearance, accessibility, and region.
   Applies CSS classes and variables to <html> for global styling effects.
   ═══════════════════════════════════════════════════════════════════ */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FontSize = "small" | "medium" | "large";
export type ElementDensity = "small" | "medium" | "large";

/** Named background presets with light and dark mode variants. */
export type BackgroundPreset =
  | "default"
  | "warm"
  | "cool"
  | "forest"
  | "lavender"
  | "sepia"
  | "midnight"
  | "slate";

export interface BackgroundPresetColors {
  light: { s0: string; s1: string; s2: string };
  dark: { s0: string; s1: string; s2: string };
}

export const backgroundPresets: Record<BackgroundPreset, BackgroundPresetColors> = {
  default: {
    light: { s0: "#ffffff", s1: "#f8f8f6", s2: "#f1efe8" },
    dark:  { s0: "#1a1a18", s1: "#222220", s2: "#2a2a28" },
  },
  warm: {
    light: { s0: "#faf5f0", s1: "#f0eae2", s2: "#e8e0d5" },
    dark:  { s0: "#1d1814", s1: "#26201a", s2: "#302822" },
  },
  cool: {
    light: { s0: "#eef2f7", s1: "#e4eaf0", s2: "#d8e0e8" },
    dark:  { s0: "#131a22", s1: "#1a222c", s2: "#222c36" },
  },
  forest: {
    light: { s0: "#edf5ed", s1: "#e2ede2", s2: "#d5e5d5" },
    dark:  { s0: "#131f13", s1: "#1a261a", s2: "#223022" },
  },
  lavender: {
    light: { s0: "#f3eff8", s1: "#e9e3f0", s2: "#ddd5e8" },
    dark:  { s0: "#1a1422", s1: "#211a2c", s2: "#2a2236" },
  },
  sepia: {
    light: { s0: "#f8f0e0", s1: "#ede4d0", s2: "#e0d5bc" },
    dark:  { s0: "#1f1a14", s1: "#28201a", s2: "#302820" },
  },
  midnight: {
    light: { s0: "#e8eaf0", s1: "#d8dbe5", s2: "#c8ccd8" },
    dark:  { s0: "#0e1118", s1: "#161a22", s2: "#1e222c" },
  },
  slate: {
    light: { s0: "#f0f0f0", s1: "#e8e8e8", s2: "#dedede" },
    dark:  { s0: "#181818", s1: "#202020", s2: "#282828" },
  },
};

/* ── Store interface ────────────────────────────────────────────── */

interface SettingsStore {
  /* Appearance */
  fontSize: FontSize;
  boldMode: boolean;
  elementDensity: ElementDensity;
  backgroundColor: string;

  /* Accessibility */
  highContrast: boolean;
  reduceMotion: boolean;
  enlargedFocus: boolean;
  alwaysShowSkipLinks: boolean;
  underlineLinks: boolean;
  screenReaderOptimizations: boolean;

  /* Language & Region */
  timezone: string;

  /* Notifications */
  emailNotifications: boolean;
  inAppNotifications: boolean;
  pushNotifications: boolean;
  notificationSound: boolean;

  /* Actions */
  setFontSize: (size: FontSize) => void;
  setBoldMode: (enabled: boolean) => void;
  setElementDensity: (density: ElementDensity) => void;
  setBackgroundColor: (color: string) => void;
  setHighContrast: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setEnlargedFocus: (enabled: boolean) => void;
  setAlwaysShowSkipLinks: (enabled: boolean) => void;
  setUnderlineLinks: (enabled: boolean) => void;
  setScreenReaderOptimizations: (enabled: boolean) => void;
  setTimezone: (timezone: string) => void;
  setEmailNotifications: (enabled: boolean) => void;
  setInAppNotifications: (enabled: boolean) => void;
  setPushNotifications: (enabled: boolean) => void;
  setNotificationSound: (enabled: boolean) => void;
  resetAll: () => void;
}

/* ── CSS application helpers ────────────────────────────────────── */

const fontSizeMap: Record<FontSize, string> = {
  small: "0.8125rem",
  medium: "0.9375rem",
  large: "1.0625rem",
};

const densityMap: Record<ElementDensity, number> = {
  small: 0.82,
  medium: 1,
  large: 1.18,
};

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  if (root.classList.contains("dark")) return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Lighten or darken a hex color by a percentage */
function adjustHexColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function applyAppearanceClasses(state: {
  fontSize: FontSize;
  boldMode: boolean;
  elementDensity: ElementDensity;
  backgroundColor: string;
  highContrast: boolean;
  reduceMotion: boolean;
  enlargedFocus: boolean;
  alwaysShowSkipLinks: boolean;
  underlineLinks: boolean;
  screenReaderOptimizations: boolean;
}): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  /* Font size × Density: set html font-size directly → cascades to all rem units */
  const baseRem = parseFloat(fontSizeMap[state.fontSize]);
  const densityScale = densityMap[state.elementDensity];
  root.style.fontSize = `${(baseRem * densityScale).toFixed(4)}rem`;

  /* Bold mode */
  root.classList.toggle("font-bold-mode", state.boldMode);

  /* Density classes (used by CSS for non-rem adjustments like border, radius) */
  root.classList.toggle("density-small", state.elementDensity === "small");
  root.classList.toggle("density-medium", state.elementDensity === "medium");
  root.classList.toggle("density-large", state.elementDensity === "large");

  /* Background color / preset */
  const dark = isDarkMode();
  const preset = backgroundPresets[state.backgroundColor as BackgroundPreset];
  if (preset) {
    const mode = dark ? preset.dark : preset.light;
    root.style.setProperty("--surface-0", mode.s0);
    root.style.setProperty("--surface-1", mode.s1);
    root.style.setProperty("--surface-2", mode.s2);
  } else if (state.backgroundColor.startsWith("#")) {
    /* Custom hex: apply directly with slight variations for surfaces */
    root.style.setProperty("--surface-0", state.backgroundColor);
    root.style.setProperty("--surface-1", adjustHexColor(state.backgroundColor, dark ? 4 : -4));
    root.style.setProperty("--surface-2", adjustHexColor(state.backgroundColor, dark ? 8 : -8));
  } else {
    /* Fallback to default */
    const fallback = dark ? backgroundPresets.default.dark : backgroundPresets.default.light;
    root.style.setProperty("--surface-0", fallback.s0);
    root.style.setProperty("--surface-1", fallback.s1);
    root.style.setProperty("--surface-2", fallback.s2);
  }

  /* Accessibility classes */
  root.classList.toggle("high-contrast", state.highContrast);
  root.classList.toggle("reduce-motion", state.reduceMotion);
  root.classList.toggle("enlarged-focus", state.enlargedFocus);
  root.classList.toggle("always-skip-links", state.alwaysShowSkipLinks);
  root.classList.toggle("underline-links", state.underlineLinks);
  root.classList.toggle("sr-optimizations", state.screenReaderOptimizations);
}

/* ── Default state ──────────────────────────────────────────────── */

const defaultState = {
  fontSize: "medium" as FontSize,
  boldMode: false,
  elementDensity: "medium" as ElementDensity,
  backgroundColor: "default",
  highContrast: false,
  reduceMotion: false,
  enlargedFocus: false,
  alwaysShowSkipLinks: false,
  underlineLinks: false,
  screenReaderOptimizations: false,
  timezone: "America/Sao_Paulo",
  emailNotifications: true,
  inAppNotifications: true,
  pushNotifications: false,
  notificationSound: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setFontSize: (fontSize) => {
        set({ fontSize });
        applyAppearanceClasses({ ...get(), fontSize });
      },

      setBoldMode: (boldMode) => {
        set({ boldMode });
        applyAppearanceClasses({ ...get(), boldMode });
      },

      setElementDensity: (elementDensity) => {
        set({ elementDensity });
        applyAppearanceClasses({ ...get(), elementDensity });
      },

      setBackgroundColor: (backgroundColor) => {
        set({ backgroundColor });
        applyAppearanceClasses({ ...get(), backgroundColor });
      },

      setHighContrast: (highContrast) => {
        set({ highContrast });
        applyAppearanceClasses({ ...get(), highContrast });
      },

      setReduceMotion: (reduceMotion) => {
        set({ reduceMotion });
        applyAppearanceClasses({ ...get(), reduceMotion });
      },

      setEnlargedFocus: (enlargedFocus) => {
        set({ enlargedFocus });
        applyAppearanceClasses({ ...get(), enlargedFocus });
      },

      setAlwaysShowSkipLinks: (alwaysShowSkipLinks) => {
        set({ alwaysShowSkipLinks });
        applyAppearanceClasses({ ...get(), alwaysShowSkipLinks });
      },

      setUnderlineLinks: (underlineLinks) => {
        set({ underlineLinks });
        applyAppearanceClasses({ ...get(), underlineLinks });
      },

      setScreenReaderOptimizations: (screenReaderOptimizations) => {
        set({ screenReaderOptimizations });
        applyAppearanceClasses({ ...get(), screenReaderOptimizations });
      },

      setTimezone: (timezone) => set({ timezone }),

      setEmailNotifications: (emailNotifications) => set({ emailNotifications }),
      setInAppNotifications: (inAppNotifications) => set({ inAppNotifications }),
      setPushNotifications: (pushNotifications) => set({ pushNotifications }),
      setNotificationSound: (notificationSound) => set({ notificationSound }),

      resetAll: () => {
        set({ ...defaultState });
        applyAppearanceClasses(defaultState);
      },
    }),
    {
      name: "pytomatiza-settings",
      partialize: (state) => ({
        fontSize: state.fontSize,
        boldMode: state.boldMode,
        elementDensity: state.elementDensity,
        backgroundColor: state.backgroundColor,
        highContrast: state.highContrast,
        reduceMotion: state.reduceMotion,
        enlargedFocus: state.enlargedFocus,
        alwaysShowSkipLinks: state.alwaysShowSkipLinks,
        underlineLinks: state.underlineLinks,
        screenReaderOptimizations: state.screenReaderOptimizations,
        timezone: state.timezone,
        emailNotifications: state.emailNotifications,
        inAppNotifications: state.inAppNotifications,
        pushNotifications: state.pushNotifications,
        notificationSound: state.notificationSound,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyAppearanceClasses(state as typeof defaultState);
        }
      },
    }
  )
);
