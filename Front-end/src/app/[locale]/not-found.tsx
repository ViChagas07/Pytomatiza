/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Not-Found Page
   Shown for unrecognized routes under [locale].
   ═══════════════════════════════════════════════════════════════════ */

import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { FileQuestion } from "lucide-react";

interface NotFoundProps {
  params: Promise<{ locale: string }>;
}

export default async function NotFound({ params }: NotFoundProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "errors" });
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-accent-light)] mb-4">
        <FileQuestion className="h-7 w-7 text-[var(--brand-accent)]" aria-hidden="true" />
      </div>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        {t("notFoundTitle")}
      </h1>

      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
        {t("notFoundDescription")}
      </p>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-accent)] px-5 py-2.5 text-sm font-medium text-[var(--brand-accent-foreground)] hover:bg-[var(--brand-accent-hover)] transition-colors min-h-[44px]"
      >
        {t("notFoundAction")}
      </Link>
    </div>
  );
}
