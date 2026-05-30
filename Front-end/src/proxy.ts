/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Proxy — locale routing via next-intl

   Uses next-intl's createMiddleware with localeDetection disabled
   to prevent unwanted redirects based on browser language headers.
   The user's language choice in the UI is respected instead.

   Rules:
   - /               → 307 → /pt/dashboard (default locale)
   - /pt/*           → pass through (valid locale, default)
   - /en/*           → pass through (valid locale)
   - /es/*, /fr/* …  → pass through (valid locale)
   - /settings       → 307 → /pt/settings (prefix with default locale)
   - /api/*          → pass through (NextAuth, etc.)
   - /_next/*        → pass through (static assets)
   ═══════════════════════════════════════════════════════════════════ */

import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: false,
});

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|monitoring|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
};
