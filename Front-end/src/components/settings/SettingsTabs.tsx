/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Settings — SettingsTabs
   Accessible tab interface for the 7 settings categories.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Palette,
  Accessibility,
  Globe,
  User,
  Shield,
  Bell,
  SlidersHorizontal,
  Lock,
  Puzzle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as Tabs from "@radix-ui/react-tabs";
import {
  AppearancePanel,
  AccessibilityPanel,
  LanguageRegionPanel,
  AccountPanel,
  SecurityPanel,
  NotificationsPanel,
  AdvancedPanel,
  PrivacyPanel,
  IntegrationsPanel,
} from "./";

interface TabDef {
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}

const tabs: TabDef[] = [
  { value: "appearance", icon: Palette, labelKey: "tabs.appearance" },
  { value: "accessibility", icon: Accessibility, labelKey: "tabs.accessibility" },
  { value: "languageRegion", icon: Globe, labelKey: "tabs.languageRegion" },
  { value: "account", icon: User, labelKey: "tabs.account" },
  { value: "security", icon: Shield, labelKey: "tabs.security" },
  { value: "notifications", icon: Bell, labelKey: "tabs.notifications" },
  { value: "advanced", icon: SlidersHorizontal, labelKey: "tabs.advanced" },
  { value: "privacy", icon: Lock, labelKey: "tabs.privacy" },
  { value: "integrations", icon: Puzzle, labelKey: "tabs.integrations" },
];

export function SettingsTabs() {
  const t = useTranslations("settings");

  return (
    <Tabs.Root defaultValue="appearance" className="space-y-8">
      <Tabs.List
        className={cn(
          "flex flex-wrap gap-2 rounded-[var(--radius-lg)]",
          "border border-[var(--border-default)] bg-[var(--surface-0)] p-2 shadow-[var(--shadow-sm)]"
        )}
        aria-label={t("title")}
      >
        {tabs.map(({ value, icon: Icon, labelKey }) => (
          <Tabs.Trigger
            key={value}
            value={value}
            className={cn(
              "flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
              "text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]",
              "data-[state=active]:bg-[var(--brand-accent-light)] data-[state=active]:text-[var(--brand-accent)]"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{t(labelKey)}</span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value="appearance" className="space-y-6 outline-none">
        <AppearancePanel />
      </Tabs.Content>

      <Tabs.Content value="accessibility" className="space-y-6 outline-none">
        <AccessibilityPanel />
      </Tabs.Content>

      <Tabs.Content value="languageRegion" className="space-y-6 outline-none">
        <LanguageRegionPanel />
      </Tabs.Content>

      <Tabs.Content value="account" className="space-y-6 outline-none">
        <AccountPanel />
      </Tabs.Content>

      <Tabs.Content value="security" className="space-y-6 outline-none">
        <SecurityPanel />
      </Tabs.Content>

      <Tabs.Content value="notifications" className="space-y-6 outline-none">
        <NotificationsPanel />
      </Tabs.Content>

      <Tabs.Content value="advanced" className="space-y-6 outline-none">
        <AdvancedPanel />
      </Tabs.Content>

      <Tabs.Content value="privacy" className="space-y-6 outline-none">
        <PrivacyPanel />
      </Tabs.Content>

      <Tabs.Content value="integrations" className="space-y-6 outline-none">
        <IntegrationsPanel />
      </Tabs.Content>
    </Tabs.Root>
  );
}
