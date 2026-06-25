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
    /** "true" / "false" string from credentials form */
    rememberMe?: string;
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

/* JWT augmentation — module is @auth/core/jwt, re-exported by next-auth/jwt */
declare module "@auth/core/jwt" {
  interface JWT {
    backendToken?: string;
    refreshToken?: string;
    backendTokenExpires?: number;
    /** Timestamp after which an un-remembered session is invalidated */
    sessionExpiry?: number;
    /** Whether the user checked "Lembrar de mim" */
    rememberMe?: boolean;
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        backendToken: { label: "Backend Token", type: "text" },
        backendUserId: { label: "Backend User ID", type: "text" },
        refreshToken: { label: "Refresh Token", type: "text" },
        rememberMe: { label: "Remember Me", type: "text" },
      },

      async authorize(credentials) {
        // ── Valida apenas email (schema mínimo) ──────────────────────
        if (!credentials?.email) {
          console.error("[auth] No email in credentials");
          return null;
        }

        const email = credentials.email as string;
        const backendToken = credentials.backendToken as string | undefined;
        const backendUserId = credentials.backendUserId as string | undefined;
        const refreshToken = credentials.refreshToken as string | undefined;
        const rememberMe = credentials.rememberMe as string | undefined;

        // ═══ Caminho 1: AuthForm já autenticou e passou o token ══════
        if (backendToken) {
          console.log("[auth] Using pre-authenticated backendToken for:", email);
          return {
            id: backendUserId ?? email,
            email,
            name: email.split("@")[0],
            backendToken,
            refreshToken,
            rememberMe,
          };
        }

        // ═══ Caminho 2: fallback — autentica diretamente com o backend
        const password = credentials.password as string | undefined;
        if (!password) {
          console.error("[auth] No backendToken and no password — cannot authenticate");
          return null;
        }

        console.log("[auth] Fallback: authenticating directly with backend for:", email);
        try {
          const res = await fetch(`${getBackendUrl()}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            console.error("[auth] Backend login failed:", res.status);
            return null;
          }

          const data = (await res.json()) as {
            access_token: string;
            refresh_token?: string;
          };

          if (!data.access_token) {
            console.error("[auth] Backend returned no access_token");
            return null;
          }

          let userId = email;
          try {
            const payload = JSON.parse(
              atob(
                data.access_token
                  .split(".")[1]
                  .replace(/-/g, "+")
                  .replace(/_/g, "/"),
              ),
            );
            if (payload.sub) userId = payload.sub as string;
          } catch {
            /* fallback to email */
          }

          console.log("[auth] Fallback login successful for:", email);
          return {
            id: userId,
            email,
            name: email.split("@")[0],
            backendToken: data.access_token,
            refreshToken: data.refresh_token,
            rememberMe,
          };
        } catch (err) {
          console.error("[auth] authorize() network error:", err);
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
      // ── Login via Google OAuth ───────────────────────────────────
      if (account?.provider === "google" && account.id_token) {
        token.id = user.id ?? token.id;
        try {
          // Troca o Google id_token por um JWT do backend FastAPI
          const res = await fetch(`${getBackendUrl()}/api/v1/auth/google/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: account.id_token }),
          });
          if (res.ok) {
            const data = await res.json() as {
              access_token: string;
              refresh_token?: string;
            };
            token.backendToken = data.access_token;
            token.refreshToken = data.refresh_token;
            token.backendTokenExpires = Date.now() + 25 * 60 * 1000;
            // Google OAuth: padrão é "lembrar" (consentimento já foi dado)
            token.rememberMe = true;
            console.log("[auth] Google OAuth: backendToken obtained");
          } else {
            let errorBody = "";
            try { errorBody = await res.text(); } catch { /* ignore */ }
            console.error(
              "[auth] Google OAuth: backend exchange failed",
              res.status,
              errorBody,
            );
            token.error = "GoogleBackendExchangeFailed";
          }
        } catch (err) {
          console.error("[auth] Google OAuth: network error", err);
          token.error = "GoogleBackendExchangeFailed";
        }
        return token;
      }

      // ── Login via Credentials ────────────────────────────────────
      if (user) {
        token.id = user.id;
        if (user.backendToken) {
          token.backendToken = user.backendToken;
          token.backendTokenExpires = Date.now() + 25 * 60 * 1000;
        }
        if (user.refreshToken) {
          token.refreshToken = user.refreshToken;
        }
        // Remember-me: default true; se false, sessão expira em 24h
        if (user.rememberMe === "false") {
          token.rememberMe = false;
          token.sessionExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 h
        } else {
          token.rememberMe = true;
          delete token.sessionExpiry;
        }
        return token;
      }

      // ── Sessão sem "Lembrar de mim" — verifica expiração forçada ─
      if (token.rememberMe === false && token.sessionExpiry) {
        if (Date.now() > (token.sessionExpiry as number)) {
          console.log("[auth] Session expired (rememberMe=false), forcing re-login");
          token.error = "SessionExpired";
          token.backendToken = undefined;
          token.refreshToken = undefined;
          return token;
        }
      }

      // ── Chamadas subsequentes — verifica expiração ───────────────
      const expiresAt = token.backendTokenExpires as number | undefined;
      if (token.backendToken && expiresAt && Date.now() < expiresAt) {
        return token;
      }

      // ── Token expirado — tenta refresh ──────────────────────────
      if (token.backendToken && token.refreshToken) {
        const result = await tryRefreshToken(
          token.backendToken as string,
          token.refreshToken as string,
        );
        if (result.access_token) {
          token.backendToken = result.access_token;
          token.backendTokenExpires = Date.now() + 25 * 60 * 1000;
          if (result.refresh_token) token.refreshToken = result.refresh_token;
          delete token.error;
        } else {
          token.error = "RefreshTokenExpired";
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