-- Finance Plugins Migration
-- Invoice Generator, Subscription Tracker, Investment Portfolio, Bill Reminders

-- =====================================
-- INVOICE GENERATOR PLUGIN
-- =====================================

CREATE TABLE IF NOT EXISTS "public"."inv_clients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "taxId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inv_clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."inv_invoices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2),
    "taxAmount" DECIMAL(12,2),
    "discount" DECIMAL(12,2),
    "total" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "terms" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inv_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."inv_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."inv_payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_payments_pkey" PRIMARY KEY ("id")
);

-- Invoice Generator Indexes
CREATE INDEX IF NOT EXISTS "inv_clients_userId_idx" ON "public"."inv_clients"("userId");
CREATE INDEX IF NOT EXISTS "inv_clients_name_idx" ON "public"."inv_clients"("name");
CREATE INDEX IF NOT EXISTS "inv_invoices_userId_idx" ON "public"."inv_invoices"("userId");
CREATE INDEX IF NOT EXISTS "inv_invoices_clientId_idx" ON "public"."inv_invoices"("clientId");
CREATE INDEX IF NOT EXISTS "inv_invoices_status_idx" ON "public"."inv_invoices"("status");
CREATE INDEX IF NOT EXISTS "inv_invoices_dueDate_idx" ON "public"."inv_invoices"("dueDate");
CREATE INDEX IF NOT EXISTS "inv_items_invoiceId_idx" ON "public"."inv_items"("invoiceId");
CREATE INDEX IF NOT EXISTS "inv_payments_invoiceId_idx" ON "public"."inv_payments"("invoiceId");

-- Invoice Generator Unique Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "inv_invoices_userId_invoiceNumber_key" ON "public"."inv_invoices"("userId", "invoiceNumber");

-- Invoice Generator Foreign Keys
ALTER TABLE "public"."inv_invoices" DROP CONSTRAINT IF EXISTS "inv_invoices_clientId_fkey";
ALTER TABLE "public"."inv_invoices" ADD CONSTRAINT "inv_invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."inv_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."inv_items" DROP CONSTRAINT IF EXISTS "inv_items_invoiceId_fkey";
ALTER TABLE "public"."inv_items" ADD CONSTRAINT "inv_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."inv_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."inv_payments" DROP CONSTRAINT IF EXISTS "inv_payments_invoiceId_fkey";
ALTER TABLE "public"."inv_payments" ADD CONSTRAINT "inv_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."inv_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================
-- SUBSCRIPTION TRACKER PLUGIN
-- =====================================

CREATE TABLE IF NOT EXISTS "public"."sub_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextBillingDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "reminderDays" INTEGER NOT NULL DEFAULT 3,
    "website" TEXT,
    "notes" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."sub_payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_payments_pkey" PRIMARY KEY ("id")
);

-- Subscription Tracker Indexes
CREATE INDEX IF NOT EXISTS "sub_subscriptions_userId_idx" ON "public"."sub_subscriptions"("userId");
CREATE INDEX IF NOT EXISTS "sub_subscriptions_status_idx" ON "public"."sub_subscriptions"("status");
CREATE INDEX IF NOT EXISTS "sub_subscriptions_nextBillingDate_idx" ON "public"."sub_subscriptions"("nextBillingDate");
CREATE INDEX IF NOT EXISTS "sub_subscriptions_category_idx" ON "public"."sub_subscriptions"("category");
CREATE INDEX IF NOT EXISTS "sub_payments_subscriptionId_idx" ON "public"."sub_payments"("subscriptionId");
CREATE INDEX IF NOT EXISTS "sub_payments_paymentDate_idx" ON "public"."sub_payments"("paymentDate");

-- Subscription Tracker Foreign Keys
ALTER TABLE "public"."sub_payments" DROP CONSTRAINT IF EXISTS "sub_payments_subscriptionId_fkey";
ALTER TABLE "public"."sub_payments" ADD CONSTRAINT "sub_payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."sub_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================
-- INVESTMENT PORTFOLIO PLUGIN
-- =====================================

CREATE TABLE IF NOT EXISTS "public"."inv_investments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,
    "avgCostBasis" DECIMAL(18,8) NOT NULL,
    "currentPrice" DECIMAL(18,8),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchange" TEXT,
    "sector" TEXT,
    "notes" TEXT,
    "isWatchlist" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inv_investments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."inv_transactions" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,
    "pricePerUnit" DECIMAL(18,8) NOT NULL,
    "totalAmount" DECIMAL(18,8) NOT NULL,
    "fees" DECIMAL(12,2),
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."inv_dividends" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReinvested" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_dividends_pkey" PRIMARY KEY ("id")
);

-- Investment Portfolio Indexes
CREATE INDEX IF NOT EXISTS "inv_investments_userId_idx" ON "public"."inv_investments"("userId");
CREATE INDEX IF NOT EXISTS "inv_investments_symbol_idx" ON "public"."inv_investments"("symbol");
CREATE INDEX IF NOT EXISTS "inv_investments_type_idx" ON "public"."inv_investments"("type");
CREATE INDEX IF NOT EXISTS "inv_investments_isWatchlist_idx" ON "public"."inv_investments"("isWatchlist");
CREATE INDEX IF NOT EXISTS "inv_transactions_investmentId_idx" ON "public"."inv_transactions"("investmentId");
CREATE INDEX IF NOT EXISTS "inv_transactions_date_idx" ON "public"."inv_transactions"("date");
CREATE INDEX IF NOT EXISTS "inv_transactions_type_idx" ON "public"."inv_transactions"("type");
CREATE INDEX IF NOT EXISTS "inv_dividends_investmentId_idx" ON "public"."inv_dividends"("investmentId");
CREATE INDEX IF NOT EXISTS "inv_dividends_date_idx" ON "public"."inv_dividends"("date");

-- Investment Portfolio Foreign Keys
ALTER TABLE "public"."inv_transactions" DROP CONSTRAINT IF EXISTS "inv_transactions_investmentId_fkey";
ALTER TABLE "public"."inv_transactions" ADD CONSTRAINT "inv_transactions_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "public"."inv_investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."inv_dividends" DROP CONSTRAINT IF EXISTS "inv_dividends_investmentId_fkey";
ALTER TABLE "public"."inv_dividends" ADD CONSTRAINT "inv_dividends_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "public"."inv_investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================
-- BILL REMINDERS PLUGIN
-- =====================================

CREATE TABLE IF NOT EXISTS "public"."bill_bills" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPeriod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "autopay" BOOLEAN NOT NULL DEFAULT false,
    "reminderDays" INTEGER NOT NULL DEFAULT 3,
    "payee" TEXT,
    "accountNumber" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_bills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."bill_payments" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_payments_pkey" PRIMARY KEY ("id")
);

-- Bill Reminders Indexes
CREATE INDEX IF NOT EXISTS "bill_bills_userId_idx" ON "public"."bill_bills"("userId");
CREATE INDEX IF NOT EXISTS "bill_bills_status_idx" ON "public"."bill_bills"("status");
CREATE INDEX IF NOT EXISTS "bill_bills_dueDate_idx" ON "public"."bill_bills"("dueDate");
CREATE INDEX IF NOT EXISTS "bill_bills_category_idx" ON "public"."bill_bills"("category");
CREATE INDEX IF NOT EXISTS "bill_payments_billId_idx" ON "public"."bill_payments"("billId");
CREATE INDEX IF NOT EXISTS "bill_payments_paymentDate_idx" ON "public"."bill_payments"("paymentDate");

-- Bill Reminders Foreign Keys
ALTER TABLE "public"."bill_payments" DROP CONSTRAINT IF EXISTS "bill_payments_billId_fkey";
ALTER TABLE "public"."bill_payments" ADD CONSTRAINT "bill_payments_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."bill_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
