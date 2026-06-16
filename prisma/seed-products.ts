// Run with: npx tsx prisma/seed-products.ts
// Adds real product inventory with images from the Agricultural Machinery folder.

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";
import path from "path";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const IMG_DIR =
  "C:/Users/Admin/Desktop/Akanadehye Imports Global/Agricultural Machinery";

function toBase64(folder: string, filename: string): string | null {
  const p = path.join(IMG_DIR, folder, filename);
  if (!fs.existsSync(p)) return null;
  return `data:image/jpeg;base64,${fs.readFileSync(p).toString("base64")}`;
}

const products = [
  // Security Doors & Gates
  {
    sku: "DOOR-001",
    name: "Iron Security Entry Door",
    category: "Security Doors & Gates",
    price: 0, stock: 10, reorderAt: 3,
    description: "Custom insulated wrought iron entrance security door. Solid steel construction with premium finish. Available in single and double panel.",
    tags: ["door", "security", "iron", "entrance", "gate"],
    folder: "01 - Security Doors and Gates",
    images: ["WhatsApp Image 2026-06-12 at 10.38.27 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.38.27 AM (1).jpeg"],
  },
  {
    sku: "DOOR-002",
    name: "Double Entry Steel Security Door",
    category: "Security Doors & Gates",
    price: 0, stock: 10, reorderAt: 3,
    description: "Premium double-panel steel security entry door with built-in lock. Heavy-duty construction, elegant dark finish.",
    tags: ["door", "security", "steel", "double", "entrance"],
    folder: "01 - Security Doors and Gates",
    images: ["WhatsApp Image 2026-06-12 at 10.38.28 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.38.28 AM (1).jpeg"],
  },

  // Building Materials
  {
    sku: "BUILD-001",
    name: "Epoxy Floor Coating (Xiangfantaiyan)",
    category: "Building Materials",
    price: 0, stock: 50, reorderAt: 10,
    description: "High-quality water-based epoxy floor coating. Available in 8 colors: marble-gray, white, green, pink, iron-oxide, yellow, bright-green, bay-blue. For warehouses, factories, and interior renovation.",
    tags: ["epoxy", "floor", "paint", "coating", "building", "waterproof"],
    folder: "02 - Building Materials",
    images: ["WhatsApp Image 2026-06-12 at 10.38.21 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.38.22 AM (4).jpeg"],
  },

  // Agricultural Machinery
  {
    sku: "AGRI-001",
    name: "Corn Sheller Machine (Well Gain)",
    category: "Agricultural Machinery",
    price: 0, stock: 5, reorderAt: 2,
    description: "Electric corn sheller and thresher machine. High capacity, easy to operate. Efficiently separates corn kernels from the cob.",
    tags: ["corn", "sheller", "thresher", "agricultural", "machine", "farm"],
    folder: "03 - Agricultural Machinery",
    images: ["WhatsApp Image 2026-06-12 at 10.38.24 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.38.24 AM (1).jpeg"],
  },
  {
    sku: "AGRI-002",
    name: "Grain Mill & Grinder (MUNIO)",
    category: "Agricultural Machinery",
    price: 0, stock: 5, reorderAt: 2,
    description: "MUNIO electric grain mill and grinder. Processes corn, maize, chili powder, and spices. Industrial-grade motor.",
    tags: ["grain", "mill", "grinder", "agricultural", "corn", "flour", "spice"],
    folder: "03 - Agricultural Machinery",
    images: ["WhatsApp Image 2026-06-12 at 10.39.42 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.39.42 AM (1).jpeg"],
  },

  // Food Processing Machines
  {
    sku: "FOOD-001",
    name: "Electric Noodle & Pasta Making Machine",
    category: "Food Processing Machines",
    price: 0, stock: 10, reorderAt: 3,
    description: "Stainless steel electric noodle and pasta making machine. Commercial grade, suitable for restaurants and food businesses.",
    tags: ["noodle", "pasta", "machine", "food", "processing", "stainless"],
    folder: "04 - Food Processing Machines",
    images: ["WhatsApp Image 2026-06-12 at 10.38.25 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.38.25 AM (1).jpeg"],
  },
  {
    sku: "FOOD-002",
    name: "Intelligent Auto Powder Bag Machine",
    category: "Food Processing Machines",
    price: 0, stock: 5, reorderAt: 2,
    description: "Automatic powder bag packaging machine. Handles rice, flour, coffee, beans, dried fruit, tea, and spices.",
    tags: ["packaging", "bag", "machine", "powder", "automatic", "food"],
    folder: "04 - Food Processing Machines",
    images: ["WhatsApp Image 2026-06-12 at 10.38.29 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.38.29 AM (1).jpeg"],
  },
  {
    sku: "FOOD-003",
    name: "Auto Cup Sealing Machine",
    category: "Food Processing Machines",
    price: 0, stock: 10, reorderAt: 3,
    description: "Automatic cup sealing machine for bubble tea and beverages. Compatible with plastic and paper cups (90mm/95mm, up to 21cm tall).",
    tags: ["cup", "sealing", "machine", "bubble tea", "milk tea", "packaging"],
    folder: "04 - Food Processing Machines",
    images: ["WhatsApp Image 2026-06-12 at 10.38.30 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.39.35 AM.jpeg"],
  },
  {
    sku: "FOOD-004",
    name: "Back Sealing Packaging Machine",
    category: "Food Processing Machines",
    price: 0, stock: 5, reorderAt: 2,
    description: "Industrial back sealing packaging machine for bulk food packaging. Continuous automatic operation with microcomputer control.",
    tags: ["packaging", "sealing", "machine", "industrial", "food", "bulk"],
    folder: "04 - Food Processing Machines",
    images: ["WhatsApp Image 2026-06-12 at 10.39.33 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.39.33 AM (1).jpeg"],
  },

  // Furniture & Bedding
  {
    sku: "FURN-001",
    name: "Premium Pocket Spring Mattress",
    category: "Furniture & Bedding",
    price: 0, stock: 20, reorderAt: 5,
    description: "Premium medium-firm pocket spring roll-up box mattress. Available in multiple sizes. Fast delivery, low MOQ.",
    tags: ["mattress", "bedroom", "furniture", "spring", "sleep"],
    folder: "05 - Furniture and Bedding",
    images: ["WhatsApp Image 2026-06-12 at 10.38.26 AM (1).jpeg", "WhatsApp Image 2026-06-12 at 10.38.26 AM (2).jpeg"],
  },

  // Home & Cleaning
  {
    sku: "HOME-001",
    name: "Flat Mop (Oil Stain Cleaner)",
    category: "Home & Cleaning",
    price: 0, stock: 30, reorderAt: 10,
    description: "Professional flat mop with stainless steel telescopic handle. Excellent for removing oil stains from floors. Machine washable mop head.",
    tags: ["mop", "cleaning", "floor", "home", "household"],
    folder: "06 - Home and Cleaning",
    images: ["WhatsApp Image 2026-06-12 at 10.38.22 AM.jpeg"],
  },

  // Drinkware & Tumblers
  {
    sku: "DRINK-001",
    name: "Insulated Tumbler 40oz (Stainless Steel)",
    category: "Drinkware & Tumblers",
    price: 0, stock: 50, reorderAt: 15,
    description: "304 stainless steel double-walled insulated tumbler. 100% leak proof, BPA free, cupholder friendly, ergonomic handle. Multiple colors available.",
    tags: ["tumbler", "insulated", "stainless steel", "drinkware", "water bottle"],
    folder: "07 - Drinkware and Tumblers",
    images: ["WhatsApp Image 2026-06-12 at 10.39.36 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.39.36 AM (1).jpeg"],
  },
  {
    sku: "DRINK-002",
    name: "Custom Logo Tumbler (Wholesale)",
    category: "Drinkware & Tumblers",
    price: 0, stock: 100, reorderAt: 20,
    description: "Custom logo insulated tumbler with gradient color options. Perfect for branded merchandise and wholesale orders.",
    tags: ["tumbler", "custom", "logo", "wholesale", "branded", "drinkware"],
    folder: "07 - Drinkware and Tumblers",
    images: ["WhatsApp Image 2026-06-12 at 10.39.37 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.39.37 AM (1).jpeg"],
  },

  // Bags & Accessories
  {
    sku: "BAG-001",
    name: "Custom Backpacks & Bags (Wholesale)",
    category: "Bags & Accessories",
    price: 0, stock: 50, reorderAt: 10,
    description: "Customizable backpacks and bags in canvas, genuine leather, nylon, oxford, and polyester. Custom logo, zipper, and color options available.",
    tags: ["backpack", "bag", "custom", "wholesale", "branded", "leather"],
    folder: "08 - Bags and Accessories",
    images: ["WhatsApp Image 2026-06-12 at 10.39.38 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.39.38 AM (1).jpeg"],
  },
  {
    sku: "BAG-002",
    name: "Tumbler Carrier Bag (Neoprene)",
    category: "Bags & Accessories",
    price: 0, stock: 30, reorderAt: 10,
    description: "Neoprene tumbler and water bottle carrier bag with phone pocket. Shockproof, scratch-proof, machine washable. Fits 40oz tumblers.",
    tags: ["tumbler bag", "carrier", "neoprene", "water bottle", "accessory"],
    folder: "08 - Bags and Accessories",
    images: ["WhatsApp Image 2026-06-12 at 10.39.39 AM (3).jpeg", "WhatsApp Image 2026-06-12 at 10.39.39 AM (4).jpeg"],
  },

  // Footwear
  {
    sku: "SHOE-001",
    name: "Men's Casual Trainer Sneakers",
    category: "Footwear",
    price: 0, stock: 40, reorderAt: 10,
    description: "Men's casual trainer sneakers. Available in white/gold and black/white colorways. Custom men's tennis running shoes.",
    tags: ["sneakers", "shoes", "footwear", "men", "casual", "trainer"],
    folder: "09 - Footwear",
    images: ["WhatsApp Image 2026-06-12 at 10.39.39 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.39.40 AM.jpeg"],
  },
  {
    sku: "SHOE-002",
    name: "Men's Mesh Running Shoes",
    category: "Footwear",
    price: 0, stock: 40, reorderAt: 10,
    description: "Men's lightweight mesh running shoes with air cushion sole. Breathable, comfortable design. Available in white.",
    tags: ["sneakers", "shoes", "footwear", "men", "running", "mesh", "athletic"],
    folder: "09 - Footwear",
    images: ["WhatsApp Image 2026-06-12 at 10.39.41 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.39.43 AM.jpeg"],
  },

  // Electronics & Gadgets
  {
    sku: "ELEC-001",
    name: "Phone Stand with RGB Bluetooth Speaker",
    category: "Electronics & Gadgets",
    price: 0, stock: 20, reorderAt: 5,
    description: "3-in-1 automatic smart sensing RGB stand. Wireless induction NFC Bluetooth speaker with phone holder and power bank function.",
    tags: ["phone stand", "speaker", "bluetooth", "RGB", "wireless", "gadget", "NFC"],
    folder: "10 - Electronics and Gadgets",
    images: ["WhatsApp Image 2026-06-12 at 10.39.39 AM (2).jpeg", "WhatsApp Image 2026-06-12 at 10.39.39 AM (1).jpeg"],
  },

  // Storage & Packaging
  {
    sku: "STOR-001",
    name: "Heavy Duty Woven Storage Bags",
    category: "Storage & Packaging",
    price: 0, stock: 100, reorderAt: 20,
    description: "Heavy duty woven polypropylene storage bags. Bulk storage for grain, rice, fertilizer, sand, and general cargo. Available in multiple sizes.",
    tags: ["storage", "bags", "woven", "bulk", "polypropylene", "packaging", "sack"],
    folder: "11 - Storage and Packaging",
    images: ["WhatsApp Image 2026-06-12 at 10.39.45 AM.jpeg", "WhatsApp Image 2026-06-12 at 10.39.45 AM (1).jpeg"],
  },

  // Food & Grain
  {
    sku: "GRAIN-001",
    name: "Premium Long Grain White Rice",
    category: "Food & Grain",
    price: 0, stock: 200, reorderAt: 50,
    description: "Premium quality long grain white rice. Moisture tested for optimal quality. Available in bulk quantities.",
    tags: ["rice", "grain", "food", "white rice", "long grain", "bulk"],
    folder: "12 - Food and Grain",
    images: ["WhatsApp Image 2026-06-12 at 10.38.23 AM (1).jpeg", "WhatsApp Image 2026-06-12 at 10.38.23 AM.jpeg"],
  },
];

async function main() {
  const user = await prisma.user.findFirst({ where: { email: "admin@akanadehye.com" } });
  if (!user) {
    console.error("Admin user not found. Make sure you have run the app and logged in at least once.");
    process.exit(1);
  }

  let added = 0;
  let skipped = 0;

  for (const p of products) {
    const existing = await prisma.inventoryItem.findFirst({ where: { sku: p.sku } });
    if (existing) {
      console.log(`  SKIP  ${p.sku} — already exists`);
      skipped++;
      continue;
    }

    const imageBase64: string[] = [];
    for (const filename of p.images) {
      const b64 = toBase64(p.folder, filename);
      if (b64) imageBase64.push(b64);
    }

    await prisma.inventoryItem.create({
      data: {
        userId: user.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        reorderAt: p.reorderAt,
        description: p.description,
        images: imageBase64.length > 0 ? JSON.stringify(imageBase64) : null,
        tags: JSON.stringify(p.tags),
      },
    });

    console.log(`  ADD   ${p.sku} — ${p.name} (${imageBase64.length} image${imageBase64.length !== 1 ? "s" : ""})`);
    added++;
  }

  console.log(`\nDone. ${added} products added, ${skipped} skipped.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
