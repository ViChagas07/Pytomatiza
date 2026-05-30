/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Media & Images Page
   Upload, transform, and optimize media in batch.
   ═══════════════════════════════════════════════════════════════════ */

import { type Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { Skeleton } from "@/components/ui/Skeleton";
import { MediaContent } from "./MediaContent";

interface MediaPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: MediaPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.media" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/media`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/media`])
      ),
    },
  };
}

function MediaSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-[200px] w-full rounded-[var(--radius-lg)]" />
      <Skeleton className="h-[280px] w-full rounded-[var(--radius-lg)]" />
    </div>
  );
}

export default function MediaPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<MediaSkeleton />}>
        <MediaContent />
      </Suspense>
    </div>
  );
}
