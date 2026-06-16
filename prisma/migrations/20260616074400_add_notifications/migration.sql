-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'order_status',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "orderNumber" TEXT
);

-- CreateIndex
CREATE INDEX "Notification_email_createdAt_idx" ON "Notification"("email", "createdAt");
