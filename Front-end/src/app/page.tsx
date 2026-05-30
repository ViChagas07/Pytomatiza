/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Root Page
   Fallback: redirects to default locale dashboard.
   The middleware handles locale detection for most cases.
   ═══════════════════════════════════════════════════════════════════ */

import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/config";

export default function RootPage() {
  redirect(`/${defaultLocale}/dashboard`);
}
