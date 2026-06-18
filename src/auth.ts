import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        // Check admin User table first
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;
          return { id: user.id, email: user.email, name: user.name ?? "Admin", role: user.role, permissions: user.permissions ?? null };
        }

        // Check Customer table
        const customer = await prisma.customer.findUnique({ where: { email } });
        if (customer) {
          const valid = await bcrypt.compare(password, customer.passwordHash);
          if (!valid) return null;
          return { id: customer.id, email: customer.email, name: customer.name, role: "customer" };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "admin";
        token.permissions = (user as { permissions?: string | null }).permissions ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const u = session.user as { id?: string; role?: string; permissions?: string | null };
        u.id = token.id as string;
        u.role = token.role as string;
        u.permissions = (token.permissions ?? null) as string | null;
      }
      return session;
    },
  },
});
