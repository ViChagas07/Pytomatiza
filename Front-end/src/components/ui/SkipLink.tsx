/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ UI — SkipLink
   Hidden-until-focused link to skip to main content.
   Must be the first focusable element in the DOM.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useTranslations } from "next-intl";

export function SkipLink() {
  const t = useTranslations("a11y");

  return (
    <a
      href="#main-content"
      className="skip-link"
      data-testid="skip-link"
    >
      {t("skipToMain")}
    </a>
  );
}
