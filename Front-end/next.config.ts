import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/* ------------------------------------------------------------------ */
/*  next-intl — auto-discovers ./src/i18n/request.ts                   */
/* ------------------------------------------------------------------ */
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/* ------------------------------------------------------------------ */
/*  Core Next.js config                                                */
/* ------------------------------------------------------------------ */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  /* Image Optimization */
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },

  /* Redirects are handled by src/proxy.ts — no redirects needed here */

  /* API Proxy — forwards /api/v1/* requests to the FastAPI backend.
     Eliminates CORS issues for client-side fetches while keeping
     server-side fetches direct.
     In production (Vercel), NEXT_PUBLIC_BACKEND_URL must point to Railway.
     Example: https://pytomatiza-production.up.railway.app */
  rewrites: async () => [
    {
      source: "/api/v1/:path*",
      destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/v1/:path*`,
    },
  ],

  /* Security Headers */
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        {
          key: "Permissions-Policy",
          value:
            "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
  ],
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "paysentineliq",

  project: "pytomatiza-front",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
