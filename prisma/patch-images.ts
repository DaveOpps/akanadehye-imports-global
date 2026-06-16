// Run with: npx tsx prisma/patch-images.ts
import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

function b64(p: string) {
  if (!fs.existsSync(p)) { console.warn("  NOT FOUND:", p); return null; }
  return `data:image/jpeg;base64,${fs.readFileSync(p).toString("base64")}`;
}

const BASE = "C:/Users/Admin/Desktop/Akanadehye Imports Global/Agricultural Machinery";

const patches = [
  {
    sku: "AGRI-002",
    images: [
      `${BASE}/04 - Food Processing Machines/WhatsApp Image 2026-06-12 at 10.39.42 AM.jpeg`,
      `${BASE}/04 - Food Processing Machines/WhatsApp Image 2026-06-12 at 10.39.42 AM (1).jpeg`,
    ],
  },
  {
    sku: "BAG-001",
    images: [
      `${BASE}/07 - Drinkware and Tumblers/WhatsApp Image 2026-06-12 at 10.39.38 AM.jpeg`,
      `${BASE}/07 - Drinkware and Tumblers/WhatsApp Image 2026-06-12 at 10.39.38 AM (1).jpeg`,
    ],
  },
  {
    sku: "BAG-002",
    images: [
      `${BASE}/07 - Drinkware and Tumblers/WhatsApp Image 2026-06-12 at 10.39.39 AM (3).jpeg`,
      `${BASE}/07 - Drinkware and Tumblers/WhatsApp Image 2026-06-12 at 10.39.39 AM (4).jpeg`,
    ],
  },
  {
    sku: "STOR-001",
    images: [
      `${BASE}/11 - Childrens wear/WhatsApp Image 2026-06-12 at 10.39.45 AM.jpeg`,
      `${BASE}/11 - Childrens wear/WhatsApp Image 2026-06-12 at 10.39.45 AM (1).jpeg`,
    ],
  },
];

async function main() {
  for (const { sku, images } of patches) {
    const b64s = images.map(b64).filter(Boolean) as string[];
    await prisma.inventoryItem.updateMany({
      where: { sku },
      data: { images: JSON.stringify(b64s) },
    });
    console.log(`  PATCH ${sku} — ${b64s.length} image(s)`);
  }
  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
