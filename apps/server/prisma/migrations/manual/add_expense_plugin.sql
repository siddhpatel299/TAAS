-- Expense Tracker Plugin tables (manual migration)
-- Run this manually to add Expense Tracker support

CREATE TABLE IF NOT EXISTS "public"."expense_categories" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."expense_receipts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "fileId" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expense_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "receiptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "expense_categories_userId_idx" ON "public"."expense_categories"("userId");
CREATE INDEX IF NOT EXISTS "expenses_userId_idx" ON "public"."expenses"("userId");
CREATE INDEX IF NOT EXISTS "expenses_categoryId_idx" ON "public"."expenses"("categoryId");
CREATE INDEX IF NOT EXISTS "expenses_date_idx" ON "public"."expenses"("date");
CREATE INDEX IF NOT EXISTS "expense_receipts_userId_idx" ON "public"."expense_receipts"("userId");

ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "public"."expense_receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
