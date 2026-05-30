/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Layout — LocaleUpdater
   Client component that syncs the <html> lang and dir attributes
   with the current locale. This is needed because the root layout
   doesn't have access to the [locale] URL segment.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useEffect } from "react";

interface LocaleUpdaterProps {
  locale: string;
  isRtl: boolean;
}

export function LocaleUpdater({ locale, isRtl }: LocaleUpdaterProps) {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", locale);
    root.setAttribute("dir", isRtl ? "rtl" : "ltr");
    root.setAttribute("data-locale", locale);
  }, [locale, isRtl]);

  return null;
}