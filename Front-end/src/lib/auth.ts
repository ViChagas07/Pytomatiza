/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Auth — NextAuth v5 Configuration
   Providers: Credentials (email/password) + Google OIDC.
   Session strategy: JWT.
   ═══════════════════════════════════════════════════════════════════ */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "./validations/auth";

/* ------------------------------------------------------------------ */
/*  Type augmentation for NextAuth                                     */
/* ------------------------------------------------------------------ */
declare module "next-auth" {
  interface User {
    id: string;
  }
}

/* ------------------------------------------------------------------ */
/*  NextAuth configuration                                             */
/* ------------------------------------------------------------------ */
export const { handlers, auth, signIn, signOut } = NextAuth({
  /* ── Auth Providers ─────────────────────────────────────────── */
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
      },
      async authorize(credentials) {
        // Validate input shape with Zod
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email } = parsed.data;

        try {
          // TODO: Replace with actual backend API call
          // const response = await fetch(
          //   `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
          //   {
          //     method: "POST",
          //     headers: { "Content-Type": "application/json" },
          //     body: JSON.stringify({ email, password }),
          //   }
          // );
          // if (!response.ok) return null;
          // const user = await response.json();
          // return { id: user.id, email: user.email, name: user.name };

          // Placeholder: accept any valid-format credentials for dev
          return {
            id: "dev-user-1",
            email,
            name: email.split("@")[0],
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  /* ── Session & JWT Callbacks ────────────────────────────────── */
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  /* ── Custom Pages ───────────────────────────────────────────── */
  pages: {
    signIn: "/login",
    error: "/login",
  },

  /* ── Debug (disable in production) ──────────────────────────── */
  debug: process.env.NODE_ENV === "development",
});
