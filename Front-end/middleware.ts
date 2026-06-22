/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ — NextAuth Middleware
   Protects authenticated routes by redirecting to /login when the
   session does not exist.  Public paths (login, register, auth API)
   are always allowed through.
   ═══════════════════════════════════════════════════════════════════ */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth", "/privacy-policy", "/terms"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths without authentication
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Also allow the root landing page
  if (pathname === "/") {
    return NextResponse.next();
  }

  if (!isPublic && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
