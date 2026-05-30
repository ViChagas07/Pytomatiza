/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Files Page
   File explorer, upload, and organizational automation rules.
   ═══════════════════════════════════════════════════════════════════ */

import { type Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { Skeleton } from "@/components/ui/Skeleton";
import { FilesContent } from "./FilesContent";

interface FilesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: FilesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.files" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/files`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/files`])
      ),
    },
  };
}

function FilesSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-60" />
      <Skeleton className="h-[160px] w-full rounded-[var(--radius-lg)]" />
      <Skeleton className="h-[300px] w-full rounded-[var(--radius-lg)]" />
    </div>
  );
}

export default function FilesPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<FilesSkeleton />}>
        <FilesContent />
      </Suspense>
    </div>
  );
}
