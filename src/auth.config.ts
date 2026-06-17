import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config — no Prisma, no bcrypt.
// Used by middleware to check JWT session without Node.js APIs.
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized() {
      // Admin auth is handled client-side (localStorage + AuthGuard). The proxy
      // matcher only covers /admin, which must NOT be gated server-side: admins
      // have no NextAuth session, so a redirect here loops /admin → /login forever.
      // Allow the request through; AuthGuard enforces login in the browser.
      return true;
    },
  },
} satisfies NextAuthConfig;
