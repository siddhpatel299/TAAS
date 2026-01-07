-- Plugin System Tables for TAAS
-- Run this manually to add plugin support

-- EnabledPlugin table
CREATE TABLE IF NOT EXISTS "public"."enabled_plugins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "enabled_plugins_pkey" PRIMARY KEY ("id")
);

-- Job Tracker Applications
CREATE TABLE IF NOT EXISTS "public"."jt_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "location" TEXT,
    "employmentType" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT DEFAULT 'USD',
    "jobUrl" TEXT,
    "jobDescription" TEXT,
    "status" TEXT NOT NULL DEFAULT 'wishlist',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "rating" INTEGER,
    "appliedDate" TIMESTAMP(3),
    "notes" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jt_applications_pkey" PRIMARY KEY ("id")
);

-- Job Tracker Documents
CREATE TABLE IF NOT EXISTS "public"."jt_documents" (
    "id" TEXT NOT NULL,
    "jobApplicationId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jt_documents_pkey" PRIMARY KEY ("id")
);

-- Job Tracker Tasks
CREATE TABLE IF NOT EXISTS "public"."jt_tasks" (
    "id" TEXT NOT NULL,
    "jobApplicationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jt_tasks_pkey" PRIMARY KEY ("id")
);

-- Job Tracker Referrals
CREATE TABLE IF NOT EXISTS "public"."jt_referrals" (
    "id" TEXT NOT NULL,
    "jobApplicationId" TEXT,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "messageSent" TEXT,
    "messageSentDate" TIMESTAMP(3),
    "followUpDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jt_referrals_pkey" PRIMARY KEY ("id")
);

-- Job Tracker Activities
CREATE TABLE IF NOT EXISTS "public"."jt_activities" (
    "id" TEXT NOT NULL,
    "jobApplicationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jt_activities_pkey" PRIMARY KEY ("id")
);

-- Indexes for enabled_plugins
CREATE INDEX IF NOT EXISTS "enabled_plugins_userId_idx" ON "public"."enabled_plugins"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "enabled_plugins_userId_pluginId_key" ON "public"."enabled_plugins"("userId", "pluginId");

-- Indexes for jt_applications
CREATE INDEX IF NOT EXISTS "jt_applications_userId_idx" ON "public"."jt_applications"("userId");
CREATE INDEX IF NOT EXISTS "jt_applications_status_idx" ON "public"."jt_applications"("status");
CREATE INDEX IF NOT EXISTS "jt_applications_company_idx" ON "public"."jt_applications"("company");
CREATE INDEX IF NOT EXISTS "jt_applications_createdAt_idx" ON "public"."jt_applications"("createdAt");

-- Indexes for jt_documents
CREATE INDEX IF NOT EXISTS "jt_documents_jobApplicationId_idx" ON "public"."jt_documents"("jobApplicationId");
CREATE INDEX IF NOT EXISTS "jt_documents_fileId_idx" ON "public"."jt_documents"("fileId");

-- Indexes for jt_tasks
CREATE INDEX IF NOT EXISTS "jt_tasks_jobApplicationId_idx" ON "public"."jt_tasks"("jobApplicationId");
CREATE INDEX IF NOT EXISTS "jt_tasks_dueDate_idx" ON "public"."jt_tasks"("dueDate");
CREATE INDEX IF NOT EXISTS "jt_tasks_status_idx" ON "public"."jt_tasks"("status");

-- Indexes for jt_referrals
CREATE INDEX IF NOT EXISTS "jt_referrals_userId_idx" ON "public"."jt_referrals"("userId");
CREATE INDEX IF NOT EXISTS "jt_referrals_jobApplicationId_idx" ON "public"."jt_referrals"("jobApplicationId");
CREATE INDEX IF NOT EXISTS "jt_referrals_status_idx" ON "public"."jt_referrals"("status");

-- Indexes for jt_activities
CREATE INDEX IF NOT EXISTS "jt_activities_jobApplicationId_idx" ON "public"."jt_activities"("jobApplicationId");
CREATE INDEX IF NOT EXISTS "jt_activities_createdAt_idx" ON "public"."jt_activities"("createdAt");

-- Foreign Keys
ALTER TABLE "public"."jt_documents" 
ADD CONSTRAINT "jt_documents_jobApplicationId_fkey" 
FOREIGN KEY ("jobApplicationId") REFERENCES "public"."jt_applications"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."jt_tasks" 
ADD CONSTRAINT "jt_tasks_jobApplicationId_fkey" 
FOREIGN KEY ("jobApplicationId") REFERENCES "public"."jt_applications"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."jt_referrals" 
ADD CONSTRAINT "jt_referrals_jobApplicationId_fkey" 
FOREIGN KEY ("jobApplicationId") REFERENCES "public"."jt_applications"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."jt_activities" 
ADD CONSTRAINT "jt_activities_jobApplicationId_fkey" 
FOREIGN KEY ("jobApplicationId") REFERENCES "public"."jt_applications"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;
