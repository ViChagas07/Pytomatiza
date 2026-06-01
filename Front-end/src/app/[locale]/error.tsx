/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Global Error Boundary — Locale level
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const t = useTranslations("errors");
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Global error:", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--surface-0)] text-[var(--text-primary)] font-sans">
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-danger)]/10 mb-4">
            <AlertTriangle className="h-7 w-7 text-[var(--color-danger)]" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {t("somethingWentWrong")}
          </h1>

          <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6">
            {error.message || t("unexpectedError")}
          </p>

          <div className="flex gap-4">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-accent)] px-5 py-2.5 text-sm font-medium text-[var(--brand-accent-foreground)] hover:bg-[var(--brand-accent-hover)] transition-colors min-h-[44px]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t("tryAgain")}
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors min-h-[44px]"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              {t("goHome")}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
