/*
  Warnings:

  - Added the required column `updatedAt` to the `InventoryItem` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "salePrice" REAL,
    "stock" INTEGER NOT NULL,
    "reorderAt" INTEGER NOT NULL DEFAULT 5,
    "description" TEXT,
    "images" TEXT,
    "tags" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InventoryItem" ("category", "createdAt", "id", "name", "price", "reorderAt", "sku", "stock", "userId", "updatedAt") SELECT "category", "createdAt", "id", "name", "price", "reorderAt", "sku", "stock", "userId", CURRENT_TIMESTAMP FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE INDEX "InventoryItem_userId_idx" ON "InventoryItem"("userId");
CREATE UNIQUE INDEX "InventoryItem_userId_sku_key" ON "InventoryItem"("userId", "sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
