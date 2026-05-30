/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Logs & Approvals Page
   View automation execution logs and manage pending approvals.
   ═══════════════════════════════════════════════════════════════════ */

import { type Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { LogsContent } from "./LogsContent";

/* ── Loading fallback ─────────────────────────────────────────────── */

function LogsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-48 rounded-[var(--radius-md)] bg-[var(--surface-2)]" />
        <div className="mt-2 h-4 w-72 rounded-[var(--radius-md)] bg-[var(--surface-2)]" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)]"
          />
        ))}
      </div>
      <div className="h-96 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)]" />
    </div>
  );
}

/* ── Props ────────────────────────────────────────────────────────── */

interface LogsPageProps {
  params: Promise<{ locale: string }>;
}

/* ── generateMetadata ─────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: LogsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.logs" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/logs`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/logs`])
      ),
    },
  };
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function LogsPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<LogsLoading />}>
        <LogsContent />
      </Suspense>
    </div>
  );
}
