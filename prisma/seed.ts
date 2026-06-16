// Seed an admin user + sample data so the dashboard isn't empty on first run.
// Run with: npx prisma db seed

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import "dotenv/config";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@akanadehye.com";
  const password = "Admin@1234";

  console.log("→ Seeding admin user…");
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "super_admin" },
    create: {
      email,
      name: "Nanayaw (Admin)",
      passwordHash,
      role: "super_admin",
    },
  });

  console.log(`✓ Admin user ready: ${email} / ${password}`);

  // Skip data seeding if this user already has stuff
  const existingItems = await prisma.inventoryItem.count({ where: { userId: user.id } });
  if (existingItems > 0) {
    console.log(`→ User already has ${existingItems} inventory items, skipping data seed.`);
    return;
  }

  console.log("→ Seeding inventory + payments…");

  const items = await prisma.$transaction([
    prisma.inventoryItem.create({
      data: {
        userId: user.id,
        sku: "AK-001",
        name: "Wireless Earbuds Pro",
        category: "Electronics",
        price: 320,
        stock: 18,
        reorderAt: 5,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        userId: user.id,
        sku: "AK-002",
        name: "Cotton T-Shirt (Pack of 3)",
        category: "Fashion",
        price: 145,
        stock: 4,
        reorderAt: 5,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        userId: user.id,
        sku: "AK-003",
        name: "Vitamin C Serum",
        category: "Beauty",
        price: 89,
        stock: 32,
        reorderAt: 10,
      },
    }),
  ]);

  const now = Date.now();
  await prisma.$transaction([
    prisma.payment.create({
      data: {
        userId: user.id,
        createdAt: new Date(now - 86400000 * 2),
        customer: "Adwoa Mensah",
        amount: 320,
        currency: "GHS",
        method: "mobile-money",
        reference: "MTN-9F2K3",
        status: "succeeded",
      },
    }),
    prisma.payment.create({
      data: {
        userId: user.id,
        createdAt: new Date(now - 86400000 * 5),
        customer: "Kojo Antwi",
        amount: 145,
        currency: "GHS",
        method: "visa",
        reference: "VISA-7821",
        status: "succeeded",
      },
    }),
    prisma.payment.create({
      data: {
        userId: user.id,
        createdAt: new Date(now - 86400000 * 7),
        customer: "Esi Boateng",
        amount: 89,
        currency: "GHS",
        method: "mastercard",
        reference: "MC-3344",
        status: "succeeded",
      },
    }),
  ]);

  console.log(`✓ Seeded ${items.length} products and 3 payments`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("\nDone. Sign in at http://localhost:3000/login with:");
    console.log("  Email:    admin@akanadehye.com");
    console.log("  Password: admin123");
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
