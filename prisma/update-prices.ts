/**
 * Run with:  npx tsx prisma/update-prices.ts
 *
 * Edit the prices below then run the script.
 * Only items with price > 0 are updated — leave a price as 0 to skip it.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require("better-sqlite3") as typeof import("better-sqlite3").default;
import path from "path";

const DB_PATH = path.join(process.cwd(), "dev.db");
const db = new Database(DB_PATH);

// ── EDIT PRICES HERE (GHS) ────────────────────────────────────────────────────
// Format: ["Exact product name", price, salePrice_or_null]
const PRICES: [string, number, number | null][] = [
  ["Auto Cup Sealing Machine",                  0,    null],
  ["Back Sealing Packaging Machine",            0,    null],
  ["Childrens Clothes",                         0,    null],
  ["Corn Sheller Machine (Well Gain)",          0,    null],
  ["Cotton T-Shirt (Pack of 3)",              145,    null],
  ["Custom Backpacks & Bags (Wholesale)",       0,    null],
  ["Custom Logo Tumbler (Wholesale)",           0,    null],
  ["Double Entry Steel Security Door",          0,    null],
  ["Electric Noodle & Pasta Making Machine",    0,    null],
  ["Epoxy Floor Coating (Xiangfantaiyan)",      0,    null],
  ["Flat Mop (Oil Stain Cleaner)",              0,    null],
  ["Grain Mill & Grinder (MUNIO)",              0,    null],
  ["Insulated Tumbler 40oz (Stainless Steel)",  0,    null],
  ["Intelligent Auto Powder Bag Machine",       0,    null],
  ["Iron Security Entry Door",                  0,    null],
  ["Men's Casual Trainer Sneakers",             0,    null],
  ["Men's Mesh Running Shoes",                  0,    null],
  ["Phone Stand with RGB Bluetooth Speaker",    0,    null],
  ["Premium Long Grain White Rice",             0,    null],
  ["Premium Pocket Spring Mattress",            0,    null],
  ["Tumbler Carrier Bag (Neoprene)",            0,    null],
  ["Vitamin C Serum",                          89,    null],
  ["Wireless Earbuds Pro",                    320,    null],
];
// ─────────────────────────────────────────────────────────────────────────────

const update = db.prepare(
  "UPDATE InventoryItem SET price = ?, salePrice = ?, updatedAt = ? WHERE name = ?"
);

let updated = 0;
let skipped = 0;

for (const [name, price, salePrice] of PRICES) {
  if (price === 0) { skipped++; continue; }
  const now = new Date().toISOString();
  const result = update.run(price, salePrice, now, name);
  if (result.changes > 0) {
    console.log(`✓  ${name} → GHS ${price}${salePrice ? ` (sale: GHS ${salePrice})` : ""}`);
    updated++;
  } else {
    console.log(`✗  Not found: "${name}"`);
  }
}

console.log(`\nDone. ${updated} updated, ${skipped} skipped (price=0).`);
db.close();
