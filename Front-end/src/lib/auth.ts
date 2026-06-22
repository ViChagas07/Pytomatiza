/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Auth — NextAuth v5 Configuration
   Providers: Credentials (email/password) + Google OIDC.
   Session strategy: JWT.
   ═══════════════════════════════════════════════════════════════════ */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "./validations/auth";
import type { DefaultSession } from "next-auth";

/* ------------------------------------------------------------------ */
/* Type augmentation                                                    */
/* ------------------------------------------------------------------ */

declare module "next-auth" {
  interface User {
    id: string;
    /** JWT token returned by the FastAPI backend */
    backendToken?: string;
    /** Refresh token used to obtain a new backendToken when it expires */
    refreshToken?: string;
  }

  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    /** JWT token to forward to the FastAPI backend as Bearer */
    backendToken?: string;
    /** Refresh token used to obtain a new backendToken when it expires */
    refreshToken?: string;
    /** Error flag set when refresh fails repeatedly */
    error?: string;
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/**
 * Returns the absolute URL of the FastAPI backend.
 * Must be set in Vercel env vars (NEXT_PUBLIC_BACKEND_URL).
 */
function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
}

/**
 * Proactively refresh the backend JWT token.
 * Silently returns the current token if the refresh endpoint is unavailable.
 */
async function tryRefreshToken(
  currentToken: string,
  refreshToken: string,
): Promise<{ access_token: string | null; refresh_token: string | null }> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        access_token: string;
        refresh_token?: string;
      };
      console.log("[auth] Token refreshed successfully");
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? null,
      };
    }
    console.warn("[auth] Refresh returned", res.status);
    return { access_token: null, refresh_token: null };
  } catch (err) {
    console.warn("[auth] Refresh network error:", err);
    return { access_token: null, refresh_token: null };
  }
}

/* ------------------------------------------------------------------ */
/* NextAuth configuration                                              */
/* ------------------------------------------------------------------ */

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),

    Credentials({
      name: "credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email } = parsed.data;

        // Accept backend token & user ID forwarded from AuthForm
        const rawCreds = credentials as Record<string, unknown>;
        const backendToken = rawCreds.backendToken as string | undefined;
        const backendUserId = rawCreds.backendUserId as string | undefined;
        const refreshToken = rawCreds.refreshToken as string | undefined;

        try {
          return {
            id: backendUserId || "dev-user-1",
            email,
            name: email.split("@")[0],
            backendToken,
            refreshToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // ── Initial sign-in ──────────────────────────────────────────
      if (user) {
        token.id = user.id;
        if (user.backendToken) {
          token.backendToken = user.backendToken;
          // Set a self-managed 25-min expiry to proactively refresh
          // before the backend's actual 7-day JWT expires.
          token.backendTokenExpires = Date.now() + 25 * 60 * 1000;
        }
        if (user.refreshToken) {
          token.refreshToken = user.refreshToken;
        }
        // Also handle Google OAuth sign-in (account.provider === "google")
        if (account?.provider === "google" && account.id_token) {
          // Google users get backendToken from the backend via OAuth flow
          // The backend redirect already handled this — nothing extra needed.
        }
        return token;
      }

      // ── Subsequent calls (user is undefined) ─────────────────────
      // If the backend token is still fresh, return it as-is.
      const expiresAt = token.backendTokenExpires as number | undefined;
      if (token.backendToken && expiresAt && Date.now() < expiresAt) {
        return token;
      }

      // ── Token expired or expiring soon — try to refresh ─────────
      if (token.backendToken && token.refreshToken) {
        const result = await tryRefreshToken(
          token.backendToken as string,
          token.refreshToken as string,
        );
        if (result.access_token) {
          token.backendToken = result.access_token;
          token.backendTokenExpires = Date.now() + 25 * 60 * 1000;
          if (result.refresh_token) {
            token.refreshToken = result.refresh_token;
          }
          // Clear any previous error
          delete token.error;
        } else {
          // Refresh failed — mark the session as errored.
          // The client can read session.error to show a "re-login" banner.
          token.error = "RefreshTokenExpired";
          // Keep the old (possibly expired) backendToken intact so the
          // client can still attempt a request (and get a 401).
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      // Expose the backend JWT + refresh token on the session object
      if (token.backendToken) {
        session.backendToken = token.backendToken as string;
      }
      if (token.refreshToken) {
        session.refreshToken = token.refreshToken as string;
      }
      // Expose error flag for UI consumption
      if (token.error) {
        session.error = token.error as string;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  debug: true,
});