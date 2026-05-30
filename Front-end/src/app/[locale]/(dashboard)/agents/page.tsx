/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Agents Page
   Browse and manage AI agents with search and filtering.
   ═══════════════════════════════════════════════════════════════════ */

import { type Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { AgentCardsSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { AgentsContent } from "./AgentsContent";

interface AgentsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AgentsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.agents" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/agents`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/agents`])
      ),
    },
  };
}

export default function AgentsPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<AgentCardsSkeleton />}>
        <AgentsContent />
      </Suspense>
    </div>
  );
}
