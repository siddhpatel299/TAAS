-- Notes & Documents Plugin Tables

-- Note Folders
CREATE TABLE IF NOT EXISTS "public"."nd_folders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nd_folders_pkey" PRIMARY KEY ("id")
);

-- Notes
CREATE TABLE IF NOT EXISTS "public"."nd_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "contentHtml" TEXT,
    "folderId" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isTrashed" BOOLEAN NOT NULL DEFAULT false,
    "trashedAt" TIMESTAMP(3),
    "color" TEXT,
    "icon" TEXT,
    "coverImage" TEXT,
    "tags" TEXT[],
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "readingTime" INTEGER NOT NULL DEFAULT 0,
    "lastEditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nd_notes_pkey" PRIMARY KEY ("id")
);

-- Note Versions
CREATE TABLE IF NOT EXISTS "public"."nd_versions" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "contentHtml" TEXT,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nd_versions_pkey" PRIMARY KEY ("id")
);

-- Note Templates
CREATE TABLE IF NOT EXISTS "public"."nd_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "contentHtml" TEXT,
    "category" TEXT,
    "icon" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nd_templates_pkey" PRIMARY KEY ("id")
);

-- Note Shares
CREATE TABLE IF NOT EXISTS "public"."nd_shares" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "allowEdit" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nd_shares_pkey" PRIMARY KEY ("id")
);

-- Unique constraint for share token
ALTER TABLE "public"."nd_shares" ADD CONSTRAINT "nd_shares_token_key" UNIQUE ("token");

-- Foreign Keys
ALTER TABLE "public"."nd_folders" ADD CONSTRAINT "nd_folders_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "public"."nd_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."nd_notes" ADD CONSTRAINT "nd_notes_folderId_fkey" 
    FOREIGN KEY ("folderId") REFERENCES "public"."nd_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."nd_versions" ADD CONSTRAINT "nd_versions_noteId_fkey" 
    FOREIGN KEY ("noteId") REFERENCES "public"."nd_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."nd_shares" ADD CONSTRAINT "nd_shares_noteId_fkey" 
    FOREIGN KEY ("noteId") REFERENCES "public"."nd_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "nd_folders_userId_idx" ON "public"."nd_folders"("userId");
CREATE INDEX IF NOT EXISTS "nd_folders_parentId_idx" ON "public"."nd_folders"("parentId");

CREATE INDEX IF NOT EXISTS "nd_notes_userId_idx" ON "public"."nd_notes"("userId");
CREATE INDEX IF NOT EXISTS "nd_notes_folderId_idx" ON "public"."nd_notes"("folderId");
CREATE INDEX IF NOT EXISTS "nd_notes_isPinned_idx" ON "public"."nd_notes"("isPinned");
CREATE INDEX IF NOT EXISTS "nd_notes_isFavorite_idx" ON "public"."nd_notes"("isFavorite");
CREATE INDEX IF NOT EXISTS "nd_notes_isArchived_idx" ON "public"."nd_notes"("isArchived");
CREATE INDEX IF NOT EXISTS "nd_notes_isTrashed_idx" ON "public"."nd_notes"("isTrashed");
CREATE INDEX IF NOT EXISTS "nd_notes_title_idx" ON "public"."nd_notes"("title");
CREATE INDEX IF NOT EXISTS "nd_notes_createdAt_idx" ON "public"."nd_notes"("createdAt");

CREATE INDEX IF NOT EXISTS "nd_versions_noteId_idx" ON "public"."nd_versions"("noteId");
CREATE INDEX IF NOT EXISTS "nd_versions_version_idx" ON "public"."nd_versions"("version");

CREATE INDEX IF NOT EXISTS "nd_templates_userId_idx" ON "public"."nd_templates"("userId");
CREATE INDEX IF NOT EXISTS "nd_templates_category_idx" ON "public"."nd_templates"("category");

CREATE INDEX IF NOT EXISTS "nd_shares_noteId_idx" ON "public"."nd_shares"("noteId");
CREATE INDEX IF NOT EXISTS "nd_shares_token_idx" ON "public"."nd_shares"("token");
