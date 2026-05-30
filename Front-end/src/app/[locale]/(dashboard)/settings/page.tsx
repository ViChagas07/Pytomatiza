/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Settings Page
   Central hub for all user preferences: appearance, accessibility,
   language & region, account, security, notifications, and advanced.
   ═══════════════════════════════════════════════════════════════════ */

import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Settings as SettingsIcon } from "lucide-react";
import { locales } from "@/i18n/config";
import { SettingsTabs } from "@/components/settings";

/* ── Props ────────────────────────────────────────────────────────── */

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

/* ── generateMetadata ─────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: SettingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.settings" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/settings`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/settings`])
      ),
    },
  };
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" aria-hidden="true" />
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Settings tabs */}
      <SettingsTabs />
    </div>
  );
}
