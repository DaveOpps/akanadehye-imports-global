/**
 * Run once after deploying to create the admin account:
 *   npx tsx scripts/seed-admin.ts
 *
 * Set DATABASE_URL in .env before running.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] ?? "admin@akanadehye.com";
  const password = process.argv[3] ?? "changeme123";
  const name = process.argv[4] ?? "Admin";

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, name, role: "super_admin" },
    create: { email, passwordHash: hash, name, role: "super_admin" },
  });

  console.log(`✅ Admin account ready: ${user.email}  (role: ${user.role})`);
  console.log(`   Password: ${password}`);
  console.log(`   ⚠️  Change the password after first login!`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
