/* ═══════════════════════════════════════════════════════════════════
    Pytomatiza+ Root Layout
    Defines <html>, <body>, fonts, theme init, and providers.
    Next.js 16 requires the root layout to own these structural tags;
    nested layouts (e.g. [locale]) cannot contain <html> or <body>.

    Typography: Clash Display (headings) + Inter (body) — modern,
    legible pairing. Aref Ruqaa reserved for the Pytomatiza+ logo.
    Geist Sans kept loaded exclusively for the Login page fallback.
    ═══════════════════════════════════════════════════════════════════ */

import { type ReactNode } from "react";
import { type Metadata } from "next";
import { Aref_Ruqaa, Geist, Inter } from "next/font/google";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { AccentColorScript } from "@/components/layout/AccentColorScript";
import "@/app/globals.css";

/* ── Fonts ────────────────────────────────────────────────────────── */

/** Inter — main body / UI font (replaces Geist Sans) */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/** Geist Sans — kept loaded exclusively for the Login screen fallback */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

/** Aref Ruqaa — Pytomatiza+ logo only */
const arefRuqaa = Aref_Ruqaa({
  variable: "--font-aref-ruqaa",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

/* ── generateMetadata ─────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      template: "%s",
      default: "Pytomatiza+",
    },
    description: "Intelligent automation platform",
    metadataBase: new URL(
      process.env.NEXTAUTH_URL || "https://pytomatiza.vercel.app"
    )
  };
}

/* ── Layout ───────────────────────────────────────────────────────── */

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="pt"
      dir="ltr"
      className={`${inter.variable} ${geistSans.variable} ${arefRuqaa.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Clash Display — display/heading font loaded from Fontshare CDN */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
        />
        <ThemeScript />
        <AccentColorScript />
      </head>
      <body className="min-h-full bg-[var(--surface-0)] text-[var(--text-primary)] font-sans">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
