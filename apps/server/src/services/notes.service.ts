import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/error.middleware';
import { Prisma } from '@prisma/client';

// Interfaces
interface CreateNoteInput {
  userId: string;
  title: string;
  content?: string;
  contentHtml?: string;
  folderId?: string;
  tags?: string[];
  color?: string;
  icon?: string;
  coverImage?: string;
}

interface UpdateNoteInput {
  title?: string;
  content?: string;
  contentHtml?: string;
  folderId?: string;
  isPinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  tags?: string[];
  color?: string;
  icon?: string;
  coverImage?: string;
}

interface GetNotesParams {
  userId: string;
  folderId?: string;
  search?: string;
  tags?: string[];
  isPinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'lastEditedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface CreateFolderInput {
  userId: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

interface CreateTemplateInput {
  userId: string;
  name: string;
  description?: string;
  content?: string;
  contentHtml?: string;
  category?: string;
  icon?: string;
}

// Helper functions
function calculateWordCount(content: string | null | undefined): number {
  if (!content) return 0;
  // Strip HTML tags and count words
  const text = content.replace(/<[^>]*>/g, '').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function calculateReadingTime(wordCount: number): number {
  // Average reading speed: 200 words per minute
  return Math.ceil(wordCount / 200);
}

// Main Service
export const notesService = {
  // ==================== Notes ====================
  
  async getNotes(params: GetNotesParams) {
    const {
      userId,
      folderId,
      search,
      tags,
      isPinned,
      isFavorite,
      isArchived = false,
      isTrashed = false,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = params;

    const where: Prisma.NoteWhereInput = {
      userId,
      isArchived,
      isTrashed,
      ...(folderId !== undefined && { folderId }),
      ...(isPinned !== undefined && { isPinned }),
      ...(isFavorite !== undefined && { isFavorite }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(tags && tags.length > 0 && {
        tags: { hasSome: tags }
      })
    };

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { [sortBy]: sortOrder }
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          folder: {
            select: { id: true, name: true, color: true, icon: true }
          },
          _count: {
            select: { versions: true, shares: true }
          }
        }
      }),
      prisma.note.count({ where })
    ]);

    return {
      notes,
      total,
      page,
      limit,
      hasMore: page * limit < total
    };
  },

  async getNote(userId: string, id: string) {
    const note = await prisma.note.findFirst({
      where: { id, userId },
      include: {
        folder: {
          select: { id: true, name: true, color: true, icon: true }
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 10,
          select: {
            id: true,
            version: true,
            title: true,
            createdAt: true
          }
        },
        shares: {
          select: {
            id: true,
            token: true,
            isPublic: true,
            allowEdit: true,
            expiresAt: true,
            viewCount: true,
            createdAt: true
          }
        },
        _count: {
          select: { versions: true, shares: true }
        }
      }
    });

    if (!note) {
      throw new ApiError('Note not found', 404);
    }

    return note;
  },

  async createNote(data: CreateNoteInput) {
    const wordCount = calculateWordCount(data.content);
    const readingTime = calculateReadingTime(wordCount);

    const note = await prisma.note.create({
      data: {
        userId: data.userId,
        title: data.title,
        content: data.content,
        contentHtml: data.contentHtml,
        folderId: data.folderId,
        tags: data.tags || [],
        color: data.color,
        icon: data.icon,
        coverImage: data.coverImage,
        wordCount,
        readingTime,
        lastEditedAt: new Date()
      },
      include: {
        folder: {
          select: { id: true, name: true, color: true, icon: true }
        }
      }
    });

    return note;
  },

  async updateNote(userId: string, id: string, data: UpdateNoteInput, createVersion = true) {
    const existingNote = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!existingNote) {
      throw new ApiError('Note not found', 404);
    }

    // Create version before updating if content changed
    if (createVersion && (data.content !== undefined || data.title !== undefined)) {
      const lastVersion = await prisma.noteVersion.findFirst({
        where: { noteId: id },
        orderBy: { version: 'desc' }
      });

      await prisma.noteVersion.create({
        data: {
          noteId: id,
          title: existingNote.title,
          content: existingNote.content,
          contentHtml: existingNote.contentHtml,
          version: (lastVersion?.version || 0) + 1
        }
      });
    }

    const updateData: any = { ...data };

    // Recalculate word count and reading time if content changed
    if (data.content !== undefined) {
      updateData.wordCount = calculateWordCount(data.content);
      updateData.readingTime = calculateReadingTime(updateData.wordCount);
      updateData.lastEditedAt = new Date();
    }

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
      include: {
        folder: {
          select: { id: true, name: true, color: true, icon: true }
        }
      }
    });

    return note;
  },

  async deleteNote(userId: string, id: string, permanent = false) {
    const note = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!note) {
      throw new ApiError('Note not found', 404);
    }

    if (permanent) {
      await prisma.note.delete({
        where: { id }
      });
    } else {
      // Move to trash
      await prisma.note.update({
        where: { id },
        data: {
          isTrashed: true,
          trashedAt: new Date()
        }
      });
    }

    return { deleted: true };
  },

  async restoreNote(userId: string, id: string) {
    const note = await prisma.note.findFirst({
      where: { id, userId, isTrashed: true }
    });

    if (!note) {
      throw new ApiError('Note not found in trash', 404);
    }

    await prisma.note.update({
      where: { id },
      data: {
        isTrashed: false,
        trashedAt: null
      }
    });

    return { restored: true };
  },

  async duplicateNote(userId: string, id: string) {
    const note = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!note) {
      throw new ApiError('Note not found', 404);
    }

    const duplicatedNote = await prisma.note.create({
      data: {
        userId,
        title: `${note.title} (Copy)`,
        content: note.content,
        contentHtml: note.contentHtml,
        folderId: note.folderId,
        tags: note.tags,
        color: note.color,
        icon: note.icon,
        wordCount: note.wordCount,
        readingTime: note.readingTime,
        lastEditedAt: new Date()
      },
      include: {
        folder: {
          select: { id: true, name: true, color: true, icon: true }
        }
      }
    });

    return duplicatedNote;
  },

  // ==================== Versions ====================

  async getNoteVersions(userId: string, noteId: string) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId }
    });

    if (!note) {
      throw new ApiError('Note not found', 404);
    }

    return await prisma.noteVersion.findMany({
      where: { noteId },
      orderBy: { version: 'desc' }
    });
  },

  async restoreVersion(userId: string, noteId: string, versionId: string) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId }
    });

    if (!note) {
      throw new ApiError('Note not found', 404);
    }

    const version = await prisma.noteVersion.findFirst({
      where: { id: versionId, noteId }
    });

    if (!version) {
      throw new ApiError('Version not found', 404);
    }

    // Create a new version with current content before restoring
    const lastVersion = await prisma.noteVersion.findFirst({
      where: { noteId },
      orderBy: { version: 'desc' }
    });

    await prisma.noteVersion.create({
      data: {
        noteId,
        title: note.title,
        content: note.content,
        contentHtml: note.contentHtml,
        version: (lastVersion?.version || 0) + 1
      }
    });

    // Restore the selected version
    const wordCount = calculateWordCount(version.content);
    const readingTime = calculateReadingTime(wordCount);

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        title: version.title,
        content: version.content,
        contentHtml: version.contentHtml,
        wordCount,
        readingTime,
        lastEditedAt: new Date()
      }
    });

    return updatedNote;
  },

  // ==================== Folders ====================

  async getFolders(userId: string, parentId?: string) {
    return await prisma.noteFolder.findMany({
      where: { 
        userId,
        parentId: parentId || null
      },
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: { notes: true, children: true }
        }
      }
    });
  },

  async getFolderTree(userId: string) {
    const folders = await prisma.noteFolder.findMany({
      where: { userId },
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: { notes: true, children: true }
        }
      }
    });

    // Build tree structure
    const folderMap = new Map();
    const rootFolders: any[] = [];

    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    folders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id);
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folderWithChildren);
        }
      } else {
        rootFolders.push(folderWithChildren);
      }
    });

    return rootFolders;
  },

  async createFolder(data: CreateFolderInput) {
    // Get max position for ordering
    const maxPosition = await prisma.noteFolder.findFirst({
      where: { userId: data.userId, parentId: data.parentId || null },
      orderBy: { position: 'desc' }
    });

    return await prisma.noteFolder.create({
      data: {
        ...data,
        position: (maxPosition?.position || 0) + 1
      },
      include: {
        _count: {
          select: { notes: true, children: true }
        }
      }
    });
  },

  async updateFolder(userId: string, id: string, data: Partial<CreateFolderInput>) {
    const existing = await prisma.noteFolder.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new ApiError('Folder not found', 404);
    }

    return await prisma.noteFolder.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { notes: true, children: true }
        }
      }
    });
  },

  async deleteFolder(userId: string, id: string) {
    const existing = await prisma.noteFolder.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new ApiError('Folder not found', 404);
    }

    // Move all notes in this folder to no folder
    await prisma.note.updateMany({
      where: { userId, folderId: id },
      data: { folderId: null }
    });

    // Move child folders to parent
    await prisma.noteFolder.updateMany({
      where: { userId, parentId: id },
      data: { parentId: existing.parentId }
    });

    await prisma.noteFolder.delete({
      where: { id }
    });

    return { deleted: true };
  },

  // ==================== Templates ====================

  async getTemplates(userId: string, category?: string) {
    return await prisma.noteTemplate.findMany({
      where: {
        userId,
        ...(category && { category })
      },
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { name: 'asc' }
      ]
    });
  },

  async getTemplate(userId: string, id: string) {
    const template = await prisma.noteTemplate.findFirst({
      where: { id, userId }
    });

    if (!template) {
      throw new ApiError('Template not found', 404);
    }

    return template;
  },

  async createTemplate(data: CreateTemplateInput) {
    return await prisma.noteTemplate.create({
      data
    });
  },

  async updateTemplate(userId: string, id: string, data: Partial<CreateTemplateInput>) {
    const existing = await prisma.noteTemplate.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new ApiError('Template not found', 404);
    }

    return await prisma.noteTemplate.update({
      where: { id },
      data
    });
  },

  async deleteTemplate(userId: string, id: string) {
    const existing = await prisma.noteTemplate.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new ApiError('Template not found', 404);
    }

    await prisma.noteTemplate.delete({
      where: { id }
    });

    return { deleted: true };
  },

  async useTemplate(userId: string, templateId: string, folderId?: string) {
    const template = await prisma.noteTemplate.findFirst({
      where: { id: templateId, userId }
    });

    if (!template) {
      throw new ApiError('Template not found', 404);
    }

    // Increment usage count
    await prisma.noteTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } }
    });

    // Create note from template
    const note = await this.createNote({
      userId,
      title: template.name,
      content: template.content || '',
      contentHtml: template.contentHtml || undefined,
      folderId,
      icon: template.icon || undefined
    });

    return note;
  },

  // ==================== Sharing ====================

  async createShare(userId: string, noteId: string, options: {
    isPublic?: boolean;
    allowEdit?: boolean;
    password?: string;
    expiresAt?: Date;
  } = {}) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId }
    });

    if (!note) {
      throw new ApiError('Note not found', 404);
    }

    return await prisma.noteShare.create({
      data: {
        noteId,
        userId,
        isPublic: options.isPublic ?? true,
        allowEdit: options.allowEdit ?? false,
        password: options.password,
        expiresAt: options.expiresAt
      }
    });
  },

  async getSharedNote(token: string, password?: string) {
    const share = await prisma.noteShare.findUnique({
      where: { token },
      include: {
        note: {
          include: {
            folder: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!share) {
      throw new ApiError('Shared note not found', 404);
    }

    // Check expiration
    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new ApiError('This share link has expired', 410);
    }

    // Check password
    if (share.password && share.password !== password) {
      throw new ApiError('Invalid password', 401);
    }

    // Increment view count
    await prisma.noteShare.update({
      where: { id: share.id },
      data: { viewCount: { increment: 1 } }
    });

    return {
      note: share.note,
      allowEdit: share.allowEdit
    };
  },

  async deleteShare(userId: string, shareId: string) {
    const share = await prisma.noteShare.findFirst({
      where: { id: shareId, userId }
    });

    if (!share) {
      throw new ApiError('Share not found', 404);
    }

    await prisma.noteShare.delete({
      where: { id: shareId }
    });

    return { deleted: true };
  },

  // ==================== Dashboard Stats ====================

  async getDashboardStats(userId: string) {
    const [
      totalNotes,
      pinnedCount,
      favoriteCount,
      archivedCount,
      trashedCount,
      folderCount,
      recentNotes,
      tagStats
    ] = await Promise.all([
      prisma.note.count({ where: { userId, isTrashed: false } }),
      prisma.note.count({ where: { userId, isPinned: true, isTrashed: false } }),
      prisma.note.count({ where: { userId, isFavorite: true, isTrashed: false } }),
      prisma.note.count({ where: { userId, isArchived: true, isTrashed: false } }),
      prisma.note.count({ where: { userId, isTrashed: true } }),
      prisma.noteFolder.count({ where: { userId } }),
      prisma.note.findMany({
        where: { userId, isTrashed: false, isArchived: false },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          content: true,
          updatedAt: true,
          isPinned: true,
          isFavorite: true,
          color: true,
          icon: true,
          folder: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.note.findMany({
        where: { userId, isTrashed: false },
        select: { tags: true }
      })
    ]);

    // Calculate tag frequency
    const tagFrequency: Record<string, number> = {};
    tagStats.forEach(note => {
      note.tags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return {
      totalNotes,
      pinnedCount,
      favoriteCount,
      archivedCount,
      trashedCount,
      folderCount,
      recentNotes,
      topTags
    };
  },

  // ==================== Search ====================

  async searchNotes(userId: string, query: string, options: {
    folderId?: string;
    tags?: string[];
    limit?: number;
  } = {}) {
    const { folderId, tags, limit = 20 } = options;

    return await prisma.note.findMany({
      where: {
        userId,
        isTrashed: false,
        ...(folderId && { folderId }),
        ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
        isPinned: true,
        isFavorite: true,
        color: true,
        tags: true,
        folder: {
          select: { id: true, name: true }
        }
      }
    });
  },

  // ==================== Bulk Operations ====================

  async emptyTrash(userId: string) {
    await prisma.note.deleteMany({
      where: { userId, isTrashed: true }
    });

    return { success: true };
  },

  async moveNotesToFolder(userId: string, noteIds: string[], folderId: string | null) {
    await prisma.note.updateMany({
      where: {
        id: { in: noteIds },
        userId
      },
      data: { folderId }
    });

    return { success: true };
  },

  async bulkDelete(userId: string, noteIds: string[], permanent = false) {
    if (permanent) {
      await prisma.note.deleteMany({
        where: {
          id: { in: noteIds },
          userId
        }
      });
    } else {
      await prisma.note.updateMany({
        where: {
          id: { in: noteIds },
          userId
        },
        data: {
          isTrashed: true,
          trashedAt: new Date()
        }
      });
    }

    return { success: true };
  }
};
