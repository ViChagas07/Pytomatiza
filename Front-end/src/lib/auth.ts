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
  }

  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    /** JWT token to forward to the FastAPI backend as Bearer */
    backendToken?: string;
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
        const backendToken = (credentials as Record<string, unknown>)
          .backendToken as string | undefined;
        const backendUserId = (credentials as Record<string, unknown>)
          .backendUserId as string | undefined;

        try {
          return {
            id: backendUserId || "dev-user-1",
            email,
            name: email.split("@")[0],
            backendToken,
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
      // Persist the backend JWT so it survives across requests
      if (user?.backendToken) {
        token.backendToken = user.backendToken;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      // Expose the backend JWT on the session object
      if (token.backendToken) {
        session.backendToken = token.backendToken as string;
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