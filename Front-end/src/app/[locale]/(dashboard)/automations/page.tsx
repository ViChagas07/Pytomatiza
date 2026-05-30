/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Automations Page
   Natural Language Workflow Builder + workflow list.
   ═══════════════════════════════════════════════════════════════════ */

import { type Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { Skeleton } from "@/components/ui/Skeleton";
import { AutomationsContent } from "./AutomationsContent";

interface AutomationsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AutomationsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.automations" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/automations`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/automations`])
      ),
    },
  };
}

function AutomationsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-[300px] w-full rounded-[var(--radius-lg)]" />
    </div>
  );
}

export default function AutomationsPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<AutomationsSkeleton />}>
        <AutomationsContent />
      </Suspense>
    </div>
  );
}
