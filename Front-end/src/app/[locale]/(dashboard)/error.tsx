/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Error Boundary — Dashboard routes
   Catches render errors in dashboard pages; shows friendly UI.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations("errors");
  /* Log the error in development */
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Dashboard error:", error);
    }
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center py-20 text-center"
      data-testid="error-boundary"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-danger)]/10 mb-4">
        <AlertTriangle className="h-7 w-7 text-[var(--color-danger)]" aria-hidden="true" />
      </div>

      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        {t("somethingWentWrong")}
      </h2>

      <p className="text-sm text-[var(--text-secondary)] max-w-md mb-1">
        {error.message || t("dashboardErrorDescription")}
      </p>

      {error.digest && (
        <p className="text-xs text-[var(--text-tertiary)] mb-6">
          {t("errorId")}{error.digest}
        </p>
      )}

      <Button
        variant="primary"
        onClick={reset}
        data-testid="error-retry"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {t("tryAgain")}
      </Button>
    </div>
  );
}
