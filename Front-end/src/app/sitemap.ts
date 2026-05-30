/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Sitemap
   Generates sitemap.xml with all localized pages.
   ═══════════════════════════════════════════════════════════════════ */

import { type MetadataRoute } from "next";
import { locales, defaultLocale } from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.AUTH_URL || "https://pytomatiza.example.com";

  const staticPages = [
    { path: "", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/dashboard", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/agents", changeFrequency: "weekly" as const, priority: 0.8 },
    {
      path: "/automations",
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const { path, changeFrequency, priority } of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority: locale === defaultLocale ? priority : priority * 0.9,
      });
    }
  }

  return entries;
}
