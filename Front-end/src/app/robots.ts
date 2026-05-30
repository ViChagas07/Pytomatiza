/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ robots.txt
   Generated dynamically with locale-aware sitemap references.
   ═══════════════════════════════════════════════════════════════════ */

import { type MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.AUTH_URL || "https://pytomatiza.example.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/login",
          "/_next/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
