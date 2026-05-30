/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Documents Page
   AI-powered document processing: upload + instruction form.
   ═══════════════════════════════════════════════════════════════════ */

import { type Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { Skeleton } from "@/components/ui/Skeleton";
import { DocumentsContent } from "./DocumentsContent";

interface DocumentsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: DocumentsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.documents" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/documents`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/documents`])
      ),
    },
  };
}

function DocumentsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-[220px] w-full rounded-[var(--radius-lg)]" />
      <Skeleton className="h-[280px] w-full rounded-[var(--radius-lg)]" />
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<DocumentsSkeleton />}>
        <DocumentsContent />
      </Suspense>
    </div>
  );
}
