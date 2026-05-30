/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Architecture Page
   AI-powered architecture diagram generator.
   ═══════════════════════════════════════════════════════════════════ */

import { type Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArchitectureContent } from "./ArchitectureContent";

interface ArchitecturePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ArchitecturePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.architecture" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/architecture`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/architecture`])
      ),
    },
  };
}

function ArchitectureSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-[280px] w-full rounded-[var(--radius-lg)]" />
      <Skeleton className="h-[200px] w-full rounded-[var(--radius-lg)]" />
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<ArchitectureSkeleton />}>
        <ArchitectureContent />
      </Suspense>
    </div>
  );
}
