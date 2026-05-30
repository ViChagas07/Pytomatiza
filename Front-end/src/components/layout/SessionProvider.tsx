/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Layout — SessionProvider
   Client wrapper for NextAuth SessionProvider.
   Cannot be used directly in a server component.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { type ReactNode } from "react";

export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
