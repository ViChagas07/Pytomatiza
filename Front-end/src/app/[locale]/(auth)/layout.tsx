/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Auth Layout
   Preserves Geist Sans as the font for the Login screen, keeping it
   visually unchanged while the rest of the app uses Clash Display
   + Inter.
   ═══════════════════════════════════════════════════════════════════ */

import { type ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-geist-sans)" }}>
      {children}
    </div>
  );
}
