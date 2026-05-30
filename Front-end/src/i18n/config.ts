/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ i18n Configuration
   Defines supported locales, defaults, and RTL detection.
   ═══════════════════════════════════════════════════════════════════ */

export const locales = [
  "pt",
  "en",
  "es",
  "fr",
  "de",
  "it",
  "ru",
  "ja",
  "zh",
  "ar",
  "hi",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt";

/** Locales that use right-to-left text direction */
export const rtlLocales: Locale[] = ["ar"];

/**
 * Check if a given locale is RTL.
 * Falls back to `false` for unknown strings.
 */
export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}

/**
 * Type guard: asserts a string is a valid Locale.
 */
export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
