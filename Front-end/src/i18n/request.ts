/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ i18n Request Configuration
   Resolves locale messages and timezone on each request.
   ═══════════════════════════════════════════════════════════════════ */

import { getRequestConfig } from "next-intl/server";
import { type Locale, locales } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl populates `requestLocale` from the [locale] segment.
  let locale = await requestLocale;

  // Fallback to default if the resolved locale isn't in our list.
  if (!locale || !locales.includes(locale as Locale)) {
    locale = "pt";
  }

  const safeLocale = locale as Locale;

  return {
    locale: safeLocale,
    messages: (await import(`../../messages/${safeLocale}.json`)).default,
    timeZone: "UTC",
  };
});
