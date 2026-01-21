import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

// ====================
// TYPES
// ====================

export interface CreateNoteInput {
    userId: string;
    title: string;
    content?: string;
    contentJson?: Prisma.InputJsonValue;
    contentHtml?: string;
    folderId?: string;
    icon?: string;
    coverImage?: string;
    color?: string;
    metadata?: Prisma.InputJsonValue;
    tagIds?: string[];
}

export interface UpdateNoteInput {
    title?: string;
    content?: string;
    contentJson?: Prisma.InputJsonValue;
    contentHtml?: string;
    folderId?: string | null;
    icon?: string | null;
    coverImage?: string | null;
    color?: string | null;
    metadata?: Prisma.InputJsonValue;
    isPinned?: boolean;
    isFavorite?: boolean;
    isArchived?: boolean;
    tagIds?: string[];
    createVersion?: boolean;
}

export interface GetNotesParams {
    userId: string;
    folderId?: string | null;
    search?: string;
    tagIds?: string[];
    isPinned?: boolean;
    isFavorite?: boolean;
    isArchived?: boolean;
    isTrashed?: boolean;
    sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'lastEditedAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface CreateFolderInput {
    userId: string;
    name: string;
    parentId?: string;
    icon?: string;
    color?: string;
}

export interface UpdateFolderInput {
    name?: string;
    parentId?: string | null;
    icon?: string | null;
    color?: string | null;
    position?: number;
}

export interface CreateTagInput {
    userId: string;
    name: string;
    color?: string;
}

// ====================
// HELPER FUNCTIONS
// ====================

function calculateWordCount(text?: string | null): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function calculateReadingTime(wordCount: number): number {
    // Average reading speed: 200 words per minute
    return Math.ceil(wordCount / 200);
}

// ====================
// NOTES SERVICE
// ====================

export const notesService = {
    // ==================== NOTES ====================

    async getNotes(params: GetNotesParams) {
        const {
            userId,
            folderId,
            search,
            tagIds,
            isPinned,
            isFavorite,
            isArchived = false,
            isTrashed = false,
            sortBy = 'updatedAt',
            sortOrder = 'desc',
            page = 1,
            limit = 50,
        } = params;

        const where: Prisma.NoteWhereInput = {
            userId,
            isTrashed,
            isArchived,
        };

        // Folder filter (null means root level only)
        if (folderId !== undefined) {
            where.folderId = folderId;
        }

        if (isPinned !== undefined) where.isPinned = isPinned;
        if (isFavorite !== undefined) where.isFavorite = isFavorite;

        // Full-text search on title and content
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Tag filter (notes must have ALL specified tags)
        if (tagIds && tagIds.length > 0) {
            where.noteTags = {
                some: {
                    tagId: { in: tagIds },
                },
            };
        }

        const [notes, total] = await Promise.all([
            prisma.note.findMany({
                where,
                orderBy: [
                    { isPinned: 'desc' }, // Pinned notes first
                    { [sortBy]: sortOrder },
                ],
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    folder: {
                        select: { id: true, name: true, icon: true, color: true },
                    },
                    noteTags: {
                        include: {
                            tag: true,
                        },
                    },
                    _count: {
                        select: { versions: true, shares: true },
                    },
                },
            }),
            prisma.note.count({ where }),
        ]);

        // Transform to flatten tags
        const transformedNotes = notes.map((note) => ({
            ...note,
            tags: note.noteTags.map((nt) => nt.tag),
            noteTags: undefined,
        }));

        return {
            data: transformedNotes,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            },
        };
    },

    async getNote(noteId: string, userId: string) {
        const note = await prisma.note.findFirst({
            where: { id: noteId, userId },
            include: {
                folder: {
                    select: { id: true, name: true, icon: true, color: true },
                },
                noteTags: {
                    include: { tag: true },
                },
                versions: {
                    orderBy: { version: 'desc' },
                    take: 10,
                },
                shares: true,
                _count: {
                    select: { versions: true, shares: true },
                },
            },
        });

        if (!note) return null;

        return {
            ...note,
            tags: note.noteTags.map((nt) => nt.tag),
            noteTags: undefined,
        };
    },

    async createNote(input: CreateNoteInput) {
        console.log('[DEBUG] Service createNote input:', input);
        const { userId, title, content, contentJson, contentHtml, folderId, icon, coverImage, color, metadata, tagIds } = input;

        const wordCount = calculateWordCount(content);
        const readingTime = calculateReadingTime(wordCount);

        const note = await prisma.note.create({
            data: {
                userId,
                title,
                content,
                contentJson,
                contentHtml,
                folderId: folderId || null,
                icon,
                coverImage,
                color,
                metadata,
                wordCount,
                readingTime,
                lastEditedAt: new Date(),
                noteTags: tagIds?.length
                    ? {
                        create: tagIds.map((tagId) => ({ tagId })),
                    }
                    : undefined,
            },
            include: {
                folder: {
                    select: { id: true, name: true, icon: true, color: true },
                },
                noteTags: {
                    include: { tag: true },
                },
            },
        });

        return {
            ...note,
            tags: note.noteTags.map((nt) => nt.tag),
            noteTags: undefined,
        };
    },

    async updateNote(noteId: string, userId: string, input: UpdateNoteInput) {
        const existingNote = await prisma.note.findFirst({
            where: { id: noteId, userId },
        });

        if (!existingNote) {
            throw new Error('Note not found');
        }

        // Create version before updating if requested
        if (input.createVersion) {
            const latestVersion = await prisma.noteVersion.findFirst({
                where: { noteId },
                orderBy: { version: 'desc' },
            });

            await prisma.noteVersion.create({
                data: {
                    noteId,
                    title: existingNote.title,
                    content: existingNote.content,
                    contentJson: existingNote.contentJson || undefined,
                    contentHtml: existingNote.contentHtml,
                    version: (latestVersion?.version || 0) + 1,
                },
            });
        }

        const { tagIds, createVersion, ...updateData } = input;

        // Calculate word count if content is updated
        if (updateData.content !== undefined) {
            (updateData as any).wordCount = calculateWordCount(updateData.content);
            (updateData as any).readingTime = calculateReadingTime((updateData as any).wordCount);
        }

        // Update tags if provided
        if (tagIds !== undefined) {
            // Remove existing tags
            await prisma.noteTagsOnNotes.deleteMany({
                where: { noteId },
            });

            // Add new tags
            if (tagIds.length > 0) {
                await prisma.noteTagsOnNotes.createMany({
                    data: tagIds.map((tagId) => ({ noteId, tagId })),
                });
            }
        }

        const note = await prisma.note.update({
            where: { id: noteId },
            data: {
                ...updateData,
                lastEditedAt: new Date(),
            },
            include: {
                folder: {
                    select: { id: true, name: true, icon: true, color: true },
                },
                noteTags: {
                    include: { tag: true },
                },
            },
        });

        return {
            ...note,
            tags: note.noteTags.map((nt) => nt.tag),
            noteTags: undefined,
        };
    },

    async deleteNote(noteId: string, userId: string, permanent = false) {
        const note = await prisma.note.findFirst({
            where: { id: noteId, userId },
        });

        if (!note) {
            throw new Error('Note not found');
        }

        if (permanent) {
            await prisma.note.delete({ where: { id: noteId } });
        } else {
            await prisma.note.update({
                where: { id: noteId },
                data: { isTrashed: true, trashedAt: new Date() },
            });
        }

        return { deleted: true };
    },

    async restoreNote(noteId: string, userId: string) {
        await prisma.note.updateMany({
            where: { id: noteId, userId },
            data: { isTrashed: false, trashedAt: null },
        });
        return { restored: true };
    },

    async duplicateNote(noteId: string, userId: string) {
        const original = await prisma.note.findFirst({
            where: { id: noteId, userId },
            include: {
                noteTags: true,
            },
        });

        if (!original) {
            throw new Error('Note not found');
        }

        const duplicate = await prisma.note.create({
            data: {
                userId,
                folderId: original.folderId,
                title: `${original.title} (Copy)`,
                content: original.content,
                contentJson: original.contentJson || undefined,
                contentHtml: original.contentHtml,
                icon: original.icon,
                coverImage: original.coverImage,
                color: original.color,
                metadata: original.metadata || undefined,
                wordCount: original.wordCount,
                readingTime: original.readingTime,
                lastEditedAt: new Date(),
                noteTags: {
                    create: original.noteTags.map((nt: { tagId: string }) => ({ tagId: nt.tagId })),
                },
            },
            include: {
                folder: {
                    select: { id: true, name: true, icon: true, color: true },
                },
                noteTags: {
                    include: { tag: true },
                },
            },
        });

        return {
            ...duplicate,
            tags: duplicate.noteTags.map((nt: { tag: any }) => nt.tag),
            noteTags: undefined,
        };
    },

    // ==================== FOLDERS ====================

    async getFolders(userId: string, parentId?: string | null) {
        return prisma.noteFolder.findMany({
            where: {
                userId,
                parentId: parentId === undefined ? undefined : parentId,
            },
            orderBy: [{ position: 'asc' }, { name: 'asc' }],
            include: {
                _count: {
                    select: {
                        notes: { where: { isTrashed: false } },
                        children: true,
                    },
                },
            },
        });
    },

    async getFolderTree(userId: string) {
        const allFolders = await prisma.noteFolder.findMany({
            where: { userId },
            orderBy: [{ position: 'asc' }, { name: 'asc' }],
            include: {
                _count: {
                    select: {
                        notes: { where: { isTrashed: false } },
                        children: true,
                    },
                },
            },
        });

        // Build tree structure
        const folderMap = new Map(allFolders.map((f) => [f.id, { ...f, children: [] as any[] }]));
        const rootFolders: any[] = [];

        allFolders.forEach((folder) => {
            const folderWithChildren = folderMap.get(folder.id)!;
            if (folder.parentId && folderMap.has(folder.parentId)) {
                folderMap.get(folder.parentId)!.children.push(folderWithChildren);
            } else {
                rootFolders.push(folderWithChildren);
            }
        });

        return rootFolders;
    },

    async createFolder(input: CreateFolderInput) {
        const { userId, name, parentId, icon, color } = input;

        // Get max position in parent
        const maxPosition = await prisma.noteFolder.aggregate({
            where: { userId, parentId: parentId || null },
            _max: { position: true },
        });

        return prisma.noteFolder.create({
            data: {
                userId,
                name,
                parentId: parentId || null,
                icon,
                color,
                position: (maxPosition._max.position || 0) + 1,
            },
            include: {
                _count: {
                    select: { notes: true, children: true },
                },
            },
        });
    },

    async updateFolder(folderId: string, userId: string, input: UpdateFolderInput) {
        // Prevent circular reference
        if (input.parentId !== undefined) {
            // Check if new parent is a descendant of current folder
            const isCircular = await this.checkCircularReference(folderId, input.parentId, userId);
            if (isCircular) {
                throw new Error('Cannot move folder into its own descendant');
            }
        }

        return prisma.noteFolder.update({
            where: { id: folderId },
            data: input,
            include: {
                _count: {
                    select: { notes: true, children: true },
                },
            },
        });
    },

    async checkCircularReference(folderId: string, newParentId: string | null, userId: string): Promise<boolean> {
        if (!newParentId || folderId === newParentId) return folderId === newParentId;

        let currentId: string | null = newParentId;
        const visited = new Set<string>();

        while (currentId) {
            if (currentId === folderId) return true;
            if (visited.has(currentId)) return false;
            visited.add(currentId);

            const foundFolder: { parentId: string | null } | null = await prisma.noteFolder.findFirst({
                where: { id: currentId, userId },
                select: { parentId: true },
            });
            currentId = foundFolder?.parentId ?? null;
        }

        return false;
    },

    async deleteFolder(folderId: string, userId: string) {
        // Cascade delete handled by Prisma (notes move to root, children deleted)
        await prisma.noteFolder.deleteMany({
            where: { id: folderId, userId },
        });
        return { deleted: true };
    },

    // ==================== TAGS ====================

    async getTags(userId: string) {
        return prisma.noteTag.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { notes: true },
                },
            },
        });
    },

    async createTag(input: CreateTagInput) {
        return prisma.noteTag.create({
            data: input,
        });
    },

    async updateTag(tagId: string, userId: string, data: { name?: string; color?: string }) {
        return prisma.noteTag.update({
            where: { id: tagId },
            data,
        });
    },

    async deleteTag(tagId: string, userId: string) {
        await prisma.noteTag.deleteMany({
            where: { id: tagId, userId },
        });
        return { deleted: true };
    },

    // ==================== DASHBOARD ====================

    async getDashboard(userId: string) {
        const [
            totalNotes,
            pinnedCount,
            favoriteCount,
            archivedCount,
            trashedCount,
            folderCount,
            tagCount,
            recentNotes,
        ] = await Promise.all([
            prisma.note.count({ where: { userId, isTrashed: false, isArchived: false } }),
            prisma.note.count({ where: { userId, isPinned: true, isTrashed: false } }),
            prisma.note.count({ where: { userId, isFavorite: true, isTrashed: false } }),
            prisma.note.count({ where: { userId, isArchived: true, isTrashed: false } }),
            prisma.note.count({ where: { userId, isTrashed: true } }),
            prisma.noteFolder.count({ where: { userId } }),
            prisma.noteTag.count({ where: { userId } }),
            prisma.note.findMany({
                where: { userId, isTrashed: false, isArchived: false },
                orderBy: { lastEditedAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    title: true,
                    icon: true,
                    color: true,
                    lastEditedAt: true,
                    updatedAt: true,
                    folder: {
                        select: { id: true, name: true },
                    },
                },
            }),
        ]);

        return {
            totalNotes,
            pinnedCount,
            favoriteCount,
            archivedCount,
            trashedCount,
            folderCount,
            tagCount,
            recentNotes,
        };
    },

    // ==================== BULK OPERATIONS ====================

    async emptyTrash(userId: string) {
        await prisma.note.deleteMany({
            where: { userId, isTrashed: true },
        });
        return { success: true };
    },

    async moveNotesToFolder(noteIds: string[], userId: string, folderId: string | null) {
        await prisma.note.updateMany({
            where: { id: { in: noteIds }, userId },
            data: { folderId },
        });
        return { success: true };
    },

    async bulkDelete(noteIds: string[], userId: string, permanent = false) {
        if (permanent) {
            await prisma.note.deleteMany({
                where: { id: { in: noteIds }, userId },
            });
        } else {
            await prisma.note.updateMany({
                where: { id: { in: noteIds }, userId },
                data: { isTrashed: true, trashedAt: new Date() },
            });
        }
        return { success: true };
    },

    // ==================== VERSIONS ====================

    async getVersions(noteId: string, userId: string) {
        const note = await prisma.note.findFirst({
            where: { id: noteId, userId },
        });
        if (!note) throw new Error('Note not found');

        return prisma.noteVersion.findMany({
            where: { noteId },
            orderBy: { version: 'desc' },
        });
    },

    async restoreVersion(noteId: string, versionId: string, userId: string) {
        const note = await prisma.note.findFirst({
            where: { id: noteId, userId },
        });
        if (!note) throw new Error('Note not found');

        const version = await prisma.noteVersion.findFirst({
            where: { id: versionId, noteId },
        });
        if (!version) throw new Error('Version not found');

        // Create a new version from current state
        const latestVersion = await prisma.noteVersion.findFirst({
            where: { noteId },
            orderBy: { version: 'desc' },
        });

        await prisma.noteVersion.create({
            data: {
                noteId,
                title: note.title,
                content: note.content,
                contentJson: note.contentJson || undefined,
                contentHtml: note.contentHtml,
                version: (latestVersion?.version || 0) + 1,
            },
        });

        // Restore the selected version
        return prisma.note.update({
            where: { id: noteId },
            data: {
                title: version.title,
                content: version.content,
                contentJson: version.contentJson || undefined,
                contentHtml: version.contentHtml,
                lastEditedAt: new Date(),
            },
        });
    },
};
