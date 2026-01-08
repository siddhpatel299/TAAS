-- =====================================
-- PASSWORD VAULT PLUGIN MIGRATION
-- =====================================

-- Create PasswordEntry table
CREATE TABLE "pv_passwords" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "url" TEXT,
    "notes" TEXT,
    "category" TEXT,
    "tags" TEXT[],
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "passwordStrength" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pv_passwords_pkey" PRIMARY KEY ("id")
);

-- Create PasswordCategory table
CREATE TABLE "pv_categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pv_categories_pkey" PRIMARY KEY ("id")
);

-- Create PasswordSecurityEvent table
CREATE TABLE "pv_security_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_security_events_pkey" PRIMARY KEY ("id")
);

-- Create indexes for PasswordEntry
CREATE INDEX "pv_passwords_userId_idx" ON "pv_passwords"("userId");
CREATE INDEX "pv_passwords_category_idx" ON "pv_passwords"("category");
CREATE INDEX "pv_passwords_isFavorite_idx" ON "pv_passwords"("isFavorite");
CREATE INDEX "pv_passwords_name_idx" ON "pv_passwords"("name");

-- Create indexes for PasswordCategory
CREATE INDEX "pv_categories_userId_idx" ON "pv_categories"("userId");

-- Create indexes for PasswordSecurityEvent
CREATE INDEX "pv_security_events_userId_idx" ON "pv_security_events"("userId");
CREATE INDEX "pv_security_events_eventType_idx" ON "pv_security_events"("eventType");
CREATE INDEX "pv_security_events_createdAt_idx" ON "pv_security_events"("createdAt");

-- Add unique constraint for category names per user
ALTER TABLE "pv_categories" ADD CONSTRAINT "pv_categories_userId_name_key" UNIQUE("userId", "name");

-- Insert default categories
INSERT INTO "pv_categories" ("id", "userId", "name", "color", "icon", "position")
SELECT 
    gen_random_uuid()::text,
    u.id,
    c.name,
    c.color,
    c.icon,
    c.position
FROM "users" u
CROSS JOIN (VALUES 
    ('Social Media', '#3B82F6', 'users'),
    ('Work', '#10B981', 'briefcase'),
    ('Finance', '#F59E0B', 'credit-card'),
    ('Shopping', '#8B5CF6', 'shopping-cart'),
    ('Entertainment', '#EF4444', 'gamepad-2'),
    ('Development', '#6366F1', 'code'),
    ('Email', '#06B6D4', 'mail'),
    ('Other', '#6B7280', 'folder')
) AS c(name, color, icon, position)
WHERE NOT EXISTS (
    SELECT 1 FROM "pv_categories" 
    WHERE "userId" = u.id AND "name" = c.name
);

-- Add RLS (Row Level Security) policies for additional security
-- This ensures users can only access their own password entries

ALTER TABLE "pv_passwords" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pv_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pv_security_events" ENABLE ROW LEVEL SECURITY;

-- Policy for PasswordEntry
CREATE POLICY "Users can only access their own password entries" ON "pv_passwords"
    FOR ALL TO authenticated
    USING ("userId" = auth.uid())
    WITH CHECK ("userId" = auth.uid());

-- Policy for PasswordCategory  
CREATE POLICY "Users can only access their own categories" ON "pv_categories"
    FOR ALL TO authenticated
    USING ("userId" = auth.uid())
    WITH CHECK ("userId" = auth.uid());

-- Policy for PasswordSecurityEvent
CREATE POLICY "Users can only access their own security events" ON "pv_security_events"
    FOR ALL TO authenticated
    USING ("userId" = auth.uid())
    WITH CHECK ("userId" = auth.uid());
