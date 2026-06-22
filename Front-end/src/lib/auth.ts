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
/* Debug logs (TEMPORARY)                                              */
/* ------------------------------------------------------------------ */

console.log({
  AUTH_URL: process.env.AUTH_URL,
  AUTH_SECRET_EXISTS: !!process.env.AUTH_SECRET,
  AUTH_GOOGLE_ID_EXISTS: !!process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET_EXISTS: !!process.env.AUTH_GOOGLE_SECRET,
});

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
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      // On initial sign-in, store the fresh backend token + refresh token
      if (user?.backendToken) {
        token.backendToken = user.backendToken;
      }
      if (user?.refreshToken) {
        token.refreshToken = user.refreshToken;
      }

      // ── Auto‑refresh the backend token if it is expired ────────────
      // This runs server‑side every time getSession() is called.
      // The refresh is transparent to the client — no redirect needed.
      if (
        !user &&                                  // not during initial sign‑in
        token.backendToken &&
        token.refreshToken
      ) {
        try {
          const payloadBase64 = (token.backendToken as string)
            .split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");
          const payload = JSON.parse(atob(payloadBase64));
          const expMs = (payload.exp as number) * 1000;
          const fiveMinutes = 5 * 60 * 1000;

          // Only call the refresh endpoint if the token is expired
          // or will expire within the next 5 minutes.
          if (Date.now() >= expMs - fiveMinutes) {
            const BACKEND_URL =
              process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
            const response = await fetch(
              `${BACKEND_URL}/api/v1/auth/refresh`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  refresh_token: token.refreshToken as string,
                }),
              }
            );
            if (response.ok) {
              const data = (await response.json()) as {
                access_token: string;
                refresh_token?: string;
              };
              token.backendToken = data.access_token;
              // Google may rotate the refresh token
              if (data.refresh_token) {
                token.refreshToken = data.refresh_token;
              }
            }
            // If refresh fails, keep the current (expired) token.
            // The next API call will get a 401 and the UI will show an
            // error banner asking the user to log in again.
          }
        } catch {
          // Ignore decode / network errors — the old token stays in place
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

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  debug: true,
});