/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Auth — API Route Handler
   Exposes GET and POST handlers for NextAuth.
   ═══════════════════════════════════════════════════════════════════ */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
