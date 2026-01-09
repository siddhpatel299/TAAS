-- =====================================
-- NOTES & DOCUMENTS PLUGIN MIGRATION
-- =====================================

-- Create Note table
CREATE TABLE "nd_notes" (
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
    "wordCount" INTEGER DEFAULT 0,
    "readingTime" INTEGER DEFAULT 0,
    "lastEditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nd_notes_pkey" PRIMARY KEY ("id")
);

-- Create NoteFolder table
CREATE TABLE "nd_folders" (
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

-- Create NoteVersion table for version history
CREATE TABLE "nd_versions" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "contentHtml" TEXT,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nd_versions_pkey" PRIMARY KEY ("id")
);

-- Create NoteTemplate table
CREATE TABLE "nd_templates" (
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

-- Create NoteShare table for sharing notes
CREATE TABLE "nd_shares" (
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

-- Create indexes for Note
CREATE INDEX "nd_notes_userId_idx" ON "nd_notes"("userId");
CREATE INDEX "nd_notes_folderId_idx" ON "nd_notes"("folderId");
CREATE INDEX "nd_notes_isPinned_idx" ON "nd_notes"("isPinned");
CREATE INDEX "nd_notes_isFavorite_idx" ON "nd_notes"("isFavorite");
CREATE INDEX "nd_notes_isArchived_idx" ON "nd_notes"("isArchived");
CREATE INDEX "nd_notes_isTrashed_idx" ON "nd_notes"("isTrashed");
CREATE INDEX "nd_notes_title_idx" ON "nd_notes"("title");
CREATE INDEX "nd_notes_createdAt_idx" ON "nd_notes"("createdAt");
CREATE INDEX "nd_notes_updatedAt_idx" ON "nd_notes"("updatedAt");

-- Create indexes for NoteFolder
CREATE INDEX "nd_folders_userId_idx" ON "nd_folders"("userId");
CREATE INDEX "nd_folders_parentId_idx" ON "nd_folders"("parentId");

-- Create indexes for NoteVersion
CREATE INDEX "nd_versions_noteId_idx" ON "nd_versions"("noteId");
CREATE INDEX "nd_versions_version_idx" ON "nd_versions"("version");

-- Create indexes for NoteTemplate
CREATE INDEX "nd_templates_userId_idx" ON "nd_templates"("userId");
CREATE INDEX "nd_templates_category_idx" ON "nd_templates"("category");

-- Create indexes for NoteShare
CREATE INDEX "nd_shares_noteId_idx" ON "nd_shares"("noteId");
CREATE INDEX "nd_shares_token_idx" ON "nd_shares"("token");
CREATE UNIQUE INDEX "nd_shares_token_key" ON "nd_shares"("token");

-- Add foreign key constraints
ALTER TABLE "nd_notes" ADD CONSTRAINT "nd_notes_folderId_fkey" 
    FOREIGN KEY ("folderId") REFERENCES "nd_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "nd_folders" ADD CONSTRAINT "nd_folders_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "nd_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "nd_versions" ADD CONSTRAINT "nd_versions_noteId_fkey" 
    FOREIGN KEY ("noteId") REFERENCES "nd_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nd_shares" ADD CONSTRAINT "nd_shares_noteId_fkey" 
    FOREIGN KEY ("noteId") REFERENCES "nd_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default templates for all users
INSERT INTO "nd_templates" ("id", "userId", "name", "description", "content", "category", "icon", "isDefault")
SELECT 
    gen_random_uuid()::text,
    u.id,
    t.name,
    t.description,
    t.content,
    t.category,
    t.icon,
    true
FROM "users" u
CROSS JOIN (VALUES 
    ('Meeting Notes', 'Template for meeting notes', '# Meeting Notes

**Date:** 
**Attendees:** 

## Agenda
- 

## Discussion Points
- 

## Action Items
- [ ] 

## Next Steps
- ', 'work', 'users'),
    ('Daily Journal', 'Template for daily journaling', '# Daily Journal - {{date}}

## Gratitude
What am I grateful for today?
- 

## Goals
What do I want to accomplish today?
- [ ] 

## Reflections
How do I feel today?

## Notes
', 'personal', 'book-open'),
    ('Project Plan', 'Template for project planning', '# Project: 

## Overview
Brief description of the project.

## Goals
- 

## Timeline
| Phase | Start | End | Status |
|-------|-------|-----|--------|
|       |       |     |        |

## Tasks
- [ ] 

## Resources
- 

## Notes
', 'work', 'folder'),
    ('Quick Note', 'Simple quick note template', '# Quick Note

', 'general', 'file-text')
) AS t(name, description, content, category, icon)
WHERE NOT EXISTS (
    SELECT 1 FROM "nd_templates" 
    WHERE "userId" = u.id AND "name" = t.name
);
