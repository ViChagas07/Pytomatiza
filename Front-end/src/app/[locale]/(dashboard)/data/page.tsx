/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Data & Spreadsheets Page
   Connect sources, describe transformations, preview results.
   ═══════════════════════════════════════════════════════════════════ */

import { type Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { Skeleton } from "@/components/ui/Skeleton";
import { DataContent } from "./DataContent";

interface DataPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: DataPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.data" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/data`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/data`])
      ),
    },
  };
}

function DataSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-[180px] w-full rounded-[var(--radius-lg)]" />
      <Skeleton className="h-[260px] w-full rounded-[var(--radius-lg)]" />
    </div>
  );
}

export default function DataPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<DataSkeleton />}>
        <DataContent />
      </Suspense>
    </div>
  );
}
