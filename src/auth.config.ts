import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config — no Prisma, no bcrypt.
// Used by middleware to check JWT session without Node.js APIs.
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as { role?: string } | undefined)?.role;
      const isAdmin = nextUrl.pathname.startsWith("/admin");
      const isAccount = nextUrl.pathname.startsWith("/account");

      if (isAdmin && !isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(loginUrl);
      }
      if (isAccount && !isLoggedIn) {
        return Response.redirect(new URL("/register", nextUrl));
      }
      // Customers cannot access admin dashboard
      if (isAdmin && isLoggedIn && role === "customer") {
        return Response.redirect(new URL("/account", nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
