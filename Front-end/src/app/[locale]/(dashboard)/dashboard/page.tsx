/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Dashboard Page
   Server component with Suspense streaming. Shows stats, agent
   cards grid, recent activity, and quick actions.
   ═══════════════════════════════════════════════════════════════════ */

import { type Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import {
  StatsSkeleton,
  AgentCardsSkeleton,
} from "@/components/dashboard/DashboardSkeletons";
import { DashboardContent } from "./DashboardContent";

/* ── Props ────────────────────────────────────────────────────────── */

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

/* ── generateMetadata ─────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.dashboard" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/dashboard`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/dashboard`])
      ),
    },
  };
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Stats section */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Key metrics
        </h2>
        <Suspense fallback={<StatsSkeleton />}>
          <DashboardContent section="stats" />
        </Suspense>
      </section>

      {/* Agent cards grid */}
      <section aria-labelledby="agents-heading">
        <h2 id="agents-heading" className="sr-only">
          Agent overview
        </h2>
        <Suspense fallback={<AgentCardsSkeleton />}>
          <DashboardContent section="agents" />
        </Suspense>
      </section>
    </div>
  );
}
