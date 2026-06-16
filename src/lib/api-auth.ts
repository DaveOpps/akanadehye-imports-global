import { auth } from "@/auth";
import { prisma } from "./db";

export async function getRequestUserId(): Promise<string | null> {
  const session = await auth();
  const id = (session?.user as { id?: string } | undefined)?.id;
  const role = (session?.user as { role?: string } | undefined)?.role;
  // Customers have their own order storage — admin routes return null for them
  if (id && role !== "customer") return id;
  const user = await prisma.user.findFirst({ where: { email: "admin@akanadehye.com" } });
  return user?.id ?? null;
}

export async function getCustomerEmail(): Promise<string | null> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role === "customer") return session?.user?.email ?? null;
  return null;
}
