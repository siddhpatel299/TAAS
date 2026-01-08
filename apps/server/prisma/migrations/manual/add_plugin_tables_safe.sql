-- Safe migration with IF NOT EXISTS to avoid errors on re-run

-- EnabledPlugin table
CREATE TABLE IF NOT EXISTS "public"."enabled_plugins" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enabled_plugins_pkey" PRIMARY KEY ("id")
);

-- JobApplication table
CREATE TABLE IF NOT EXISTS "public"."jt_applications" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
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

-- JobDocument table
CREATE TABLE IF NOT EXISTS "public"."jt_documents" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "jobApplicationId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jt_documents_pkey" PRIMARY KEY ("id")
);

-- JobTask table
CREATE TABLE IF NOT EXISTS "public"."jt_tasks" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
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

-- JobReferral table
CREATE TABLE IF NOT EXISTS "public"."jt_referrals" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
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

-- JobActivity table
CREATE TABLE IF NOT EXISTS "public"."jt_activities" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "jobApplicationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jt_activities_pkey" PRIMARY KEY ("id")
);

-- Create indexes (with IF NOT EXISTS equivalent using DO block)
DO $$ 
BEGIN
    -- Unique constraint for enabled_plugins
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enabled_plugins_userId_pluginId_key') THEN
        ALTER TABLE "public"."enabled_plugins" ADD CONSTRAINT "enabled_plugins_userId_pluginId_key" UNIQUE ("userId", "pluginId");
    END IF;
    
    -- Index on enabled_plugins userId
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'enabled_plugins_userId_idx') THEN
        CREATE INDEX "enabled_plugins_userId_idx" ON "public"."enabled_plugins"("userId");
    END IF;
    
    -- Index on jt_applications userId
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'jt_applications_userId_idx') THEN
        CREATE INDEX "jt_applications_userId_idx" ON "public"."jt_applications"("userId");
    END IF;
    
    -- Index on jt_applications status
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'jt_applications_status_idx') THEN
        CREATE INDEX "jt_applications_status_idx" ON "public"."jt_applications"("status");
    END IF;
    
    -- Index on jt_documents jobApplicationId
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'jt_documents_jobApplicationId_idx') THEN
        CREATE INDEX "jt_documents_jobApplicationId_idx" ON "public"."jt_documents"("jobApplicationId");
    END IF;
    
    -- Index on jt_tasks jobApplicationId
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'jt_tasks_jobApplicationId_idx') THEN
        CREATE INDEX "jt_tasks_jobApplicationId_idx" ON "public"."jt_tasks"("jobApplicationId");
    END IF;
    
    -- Index on jt_referrals userId
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'jt_referrals_userId_idx') THEN
        CREATE INDEX "jt_referrals_userId_idx" ON "public"."jt_referrals"("userId");
    END IF;
    
    -- Index on jt_activities jobApplicationId
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'jt_activities_jobApplicationId_idx') THEN
        CREATE INDEX "jt_activities_jobApplicationId_idx" ON "public"."jt_activities"("jobApplicationId");
    END IF;
END $$;

-- Todo Lists plugin tables
CREATE TABLE IF NOT EXISTS "public"."todo_lists" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "todo_lists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."todo_tasks" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "listId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "todo_tasks_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'todo_lists_userId_idx') THEN
        CREATE INDEX "todo_lists_userId_idx" ON "public"."todo_lists"("userId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'todo_tasks_userId_idx') THEN
        CREATE INDEX "todo_tasks_userId_idx" ON "public"."todo_tasks"("userId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'todo_tasks_listId_idx') THEN
        CREATE INDEX "todo_tasks_listId_idx" ON "public"."todo_tasks"("listId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'todo_tasks_status_idx') THEN
        CREATE INDEX "todo_tasks_status_idx" ON "public"."todo_tasks"("status");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'todo_tasks_priority_idx') THEN
        CREATE INDEX "todo_tasks_priority_idx" ON "public"."todo_tasks"("priority");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'todo_tasks_dueDate_idx') THEN
        CREATE INDEX "todo_tasks_dueDate_idx" ON "public"."todo_tasks"("dueDate");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'todo_tasks_listId_fkey') THEN
        ALTER TABLE "public"."todo_tasks" ADD CONSTRAINT "todo_tasks_listId_fkey"
        FOREIGN KEY ("listId") REFERENCES "public"."todo_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add foreign keys (with IF NOT EXISTS check)
DO $$
BEGIN
    -- jt_documents -> jt_applications
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jt_documents_jobApplicationId_fkey') THEN
        ALTER TABLE "public"."jt_documents" ADD CONSTRAINT "jt_documents_jobApplicationId_fkey" 
        FOREIGN KEY ("jobApplicationId") REFERENCES "public"."jt_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    -- jt_tasks -> jt_applications
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jt_tasks_jobApplicationId_fkey') THEN
        ALTER TABLE "public"."jt_tasks" ADD CONSTRAINT "jt_tasks_jobApplicationId_fkey" 
        FOREIGN KEY ("jobApplicationId") REFERENCES "public"."jt_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    -- jt_referrals -> jt_applications (optional)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jt_referrals_jobApplicationId_fkey') THEN
        ALTER TABLE "public"."jt_referrals" ADD CONSTRAINT "jt_referrals_jobApplicationId_fkey" 
        FOREIGN KEY ("jobApplicationId") REFERENCES "public"."jt_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    -- jt_activities -> jt_applications
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jt_activities_jobApplicationId_fkey') THEN
        ALTER TABLE "public"."jt_activities" ADD CONSTRAINT "jt_activities_jobApplicationId_fkey" 
        FOREIGN KEY ("jobApplicationId") REFERENCES "public"."jt_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
