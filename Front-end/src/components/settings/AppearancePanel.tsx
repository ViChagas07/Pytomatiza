/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Settings — Appearance Panel
   Controls: font size, bold mode, element density, accent color, theme,
   background preset with light/dark mode awareness.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useTranslations } from "next-intl";
import { Type, Bold, LayoutTemplate, Sun, Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore, type FontSize, type ElementDensity, type BackgroundPreset } from "@/store";
import { useThemeStore, type ThemeMode } from "@/store";
import { AccentColorPicker } from "@/components/ui/AccentColorPicker";

/* ── Preset metadata for the UI ──────────────────────────────────── */

const presetOrder: BackgroundPreset[] = [
  "default",
  "warm",
  "cool",
  "forest",
  "lavender",
  "sepia",
  "midnight",
  "slate",
];

/** Translation keys — each preset has a msg key in settings.appearance */
const presetLabelKeys: Record<BackgroundPreset, string> = {
  default: "bgPresetDefault",
  warm: "bgPresetWarm",
  cool: "bgPresetCool",
  forest: "bgPresetForest",
  lavender: "bgPresetLavender",
  sepia: "bgPresetSepia",
  midnight: "bgPresetMidnight",
  slate: "bgPresetSlate",
};

/** Representative tint colors for the preset dots (like accent dots, solid & visible) */
const bgPreviewColors: Record<BackgroundPreset, string> = {
  default: "#e8e5df",
  warm: "#e8dcc8",
  cool: "#d0dae5",
  forest: "#c8d8c8",
  lavender: "#d8cde5",
  sepia: "#e0d0b0",
  midnight: "#c0c8d8",
  slate: "#d0d0d0",
};

/* ── Component ───────────────────────────────────────────────────── */

export function AppearancePanel() {
  const t = useTranslations("settings.appearance");
  const tTheme = useTranslations("theme");
  const {
    fontSize,
    setFontSize,
    boldMode,
    setBoldMode,
    elementDensity,
    setElementDensity,
    backgroundColor,
    setBackgroundColor,
  } = useSettingsStore();
  const { theme, setTheme } = useThemeStore();

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: "small", label: t("fontSizeSmall") },
    { value: "medium", label: t("fontSizeMedium") },
    { value: "large", label: t("fontSizeLarge") },
  ];

  const densities: { value: ElementDensity; label: string }[] = [
    { value: "small", label: t("densitySmall") },
    { value: "medium", label: t("densityMedium") },
    { value: "large", label: t("densityLarge") },
  ];

  const themes: { value: ThemeMode; label: string }[] = [
    { value: "light", label: tTheme("light") },
    { value: "dark", label: tTheme("dark") },
    { value: "system", label: tTheme("system") },
  ];

  return (
    <div className="space-y-8">
      {/* Accent Color (existing) */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <AccentColorPicker />
      </div>

      {/* Background Color — mimics AccentColorPicker style */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
              <Paintbrush className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t("backgroundColor")}</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t("backgroundColor")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {presetOrder.map((preset) => {
              const isActive = backgroundColor === preset;
              const label = t(presetLabelKeys[preset] as Parameters<typeof t>[0]);
              const previewColor = bgPreviewColors[preset];
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBackgroundColor(preset)}
                  className={cn(
                    "group relative flex h-10 w-10 items-center justify-center rounded-full transition-all",
                    "focus-visible:outline-2 focus-visible:outline-offset-2",
                    "focus-visible:outline-[var(--brand-accent)]",
                    isActive
                      ? "ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--surface-0)]"
                      : "hover:scale-105 border border-[var(--border-default)]"
                  )}
                  style={{
                    background: previewColor,
                  }}
                  aria-label={label}
                  aria-pressed={isActive}
                  title={label}
                >
                  {isActive && (
                    <span className="block h-3 w-3 rounded-full border-2 border-white bg-transparent shadow-md" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Color / Theme */}
      <SettingRow
        icon={Sun}
        title={t("systemColor")}
        description={tTheme(theme)}
      >
        <div className="flex gap-2">
          {themes.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                "rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors border",
                theme === value
                  ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)] text-[var(--brand-accent)]"
                  : "border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
              aria-pressed={theme === value}
            >
              {label}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Font Size */}
      <SettingRow
        icon={Type}
        title={t("fontSize")}
        description={t("fontSize")}
      >
        <div className="flex gap-2">
          {fontSizes.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFontSize(value)}
              className={cn(
                "rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors border",
                fontSize === value
                  ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)] text-[var(--brand-accent)]"
                  : "border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
              aria-pressed={fontSize === value}
            >
              {label}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Bold Mode */}
      <SettingRow
        icon={Bold}
        title={t("boldMode")}
        description={t("boldModeDescription")}
      >
        <ToggleSwitch checked={boldMode} onChange={setBoldMode} />
      </SettingRow>

      {/* Element Density */}
      <SettingRow
        icon={LayoutTemplate}
        title={t("elementDensity")}
        description={t("elementDensity")}
      >
        <div className="flex gap-2">
          {densities.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setElementDensity(value)}
              className={cn(
                "rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors border",
                elementDensity === value
                  ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)] text-[var(--brand-accent)]"
                  : "border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
              aria-pressed={elementDensity === value}
            >
              {label}
            </button>
          ))}
        </div>
      </SettingRow>
    </div>
  );
}

/* ── Shared sub-components ──────────────────────────────────────── */

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
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
        <div className="flex items-center">{children}</div>
      </div>
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
