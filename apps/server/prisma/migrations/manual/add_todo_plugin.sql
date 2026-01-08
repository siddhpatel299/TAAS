-- TODO Lists Plugin tables (manual migration)
-- Run this manually to add To-Do list support

-- Todo Lists table
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

-- Todo Tasks table
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

-- Indexes
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

-- Foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'todo_tasks_listId_fkey') THEN
        ALTER TABLE "public"."todo_tasks" ADD CONSTRAINT "todo_tasks_listId_fkey"
        FOREIGN KEY ("listId") REFERENCES "public"."todo_lists"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
