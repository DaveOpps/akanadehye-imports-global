// Single Prisma client instance — re-used across server actions and API routes.
// HMR in dev causes module reloads, so we cache on globalThis to avoid
// "too many connections" warnings.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "";
  const isRemote = connectionString.startsWith("postgresql://") || connectionString.startsWith("postgres://");
  const adapter = new PrismaPg({
    connectionString,
    ...(isRemote ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
