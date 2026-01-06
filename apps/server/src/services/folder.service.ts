import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

interface CreateFolderParams {
  userId: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

export class FolderService {
  // Create folder
  async createFolder(params: CreateFolderParams) {
    const { userId, name, parentId, color, icon } = params;

    // Validate parent exists if provided
    if (parentId) {
      const parent = await prisma.folder.findFirst({
        where: { id: parentId, userId },
      });
      if (!parent) {
        throw new Error('Parent folder not found');
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId,
        userId,
        color,
        icon,
      },
    });

    return folder;
  }

  // Get folders - with optional search
  async getFolders(userId: string, parentId?: string, search?: string) {
    // When searching, search across ALL folders (not just current parent)
    const where: any = {
      userId,
    };
    
    if (search) {
      // Search all folders by name
      where.name = { contains: search, mode: 'insensitive' };
    } else {
      // Not searching - filter by parent
      where.parentId = parentId ?? null;
    }
    
    const folders = await prisma.folder.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            files: true,
            children: true,
          },
        },
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    return folders;
  }

  // Get folder by ID with breadcrumb path
  async getFolder(userId: string, folderId: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
      include: {
        _count: {
          select: {
            files: true,
            children: true,
          },
        },
      },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    // Build breadcrumb path
    const breadcrumb = await this.getBreadcrumb(userId, folderId);

    return { folder, breadcrumb };
  }

  // Get breadcrumb path for a folder
  async getBreadcrumb(userId: string, folderId: string) {
    const breadcrumb: { id: string; name: string }[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folderData: { id: string; name: string; parentId: string | null } | null = await prisma.folder.findFirst({
        where: { id: currentId, userId },
        select: { id: true, name: true, parentId: true },
      });

      if (!folderData) break;

      breadcrumb.unshift({ id: folderData.id, name: folderData.name });
      currentId = folderData.parentId;
    }

    return breadcrumb;
  }

  // Rename folder
  async renameFolder(userId: string, folderId: string, newName: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data: { name: newName },
    });

    return updated;
  }

  // Move folder
  async moveFolder(userId: string, folderId: string, newParentId: string | null) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    // Prevent moving to itself or its children
    if (newParentId) {
      if (newParentId === folderId) {
        throw new Error('Cannot move folder into itself');
      }

      // Check if newParentId is a descendant of folderId
      const isDescendant = await this.isDescendant(userId, folderId, newParentId);
      if (isDescendant) {
        throw new Error('Cannot move folder into its own subfolder');
      }

      const newParent = await prisma.folder.findFirst({
        where: { id: newParentId, userId },
      });
      if (!newParent) {
        throw new Error('Destination folder not found');
      }
    }

    await prisma.folder.update({
      where: { id: folderId },
      data: { parentId: newParentId },
    });

    return { moved: true };
  }

  // Check if targetId is a descendant of folderId
  private async isDescendant(userId: string, folderId: string, targetId: string): Promise<boolean> {
    let currentId: string | null = targetId;

    while (currentId) {
      if (currentId === folderId) {
        return true;
      }

      const parentFolder: { parentId: string | null } | null = await prisma.folder.findFirst({
        where: { id: currentId, userId },
        select: { parentId: true },
      });

      if (!parentFolder) break;
      currentId = parentFolder.parentId;
    }

    return false;
  }

  // Update folder appearance
  async updateFolderAppearance(
    userId: string,
    folderId: string,
    updates: { color?: string; icon?: string }
  ) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data: updates,
    });

    return updated;
  }

  // Delete folder (and all contents)
  async deleteFolder(userId: string, folderId: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    // Prisma cascade will handle children folders
    // Files will have folderId set to null (SetNull)
    await prisma.folder.delete({
      where: { id: folderId },
    });

    return { deleted: true };
  }

  // Get folder tree
  async getFolderTree(userId: string) {
    const folders = await prisma.folder.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    // Build tree structure
    const folderMap = new Map<string, any>();
    const rootFolders: any[] = [];

    folders.forEach((folder) => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    folders.forEach((folder) => {
      const node = folderMap.get(folder.id)!;
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId)!.children.push(node);
      } else {
        rootFolders.push(node);
      }
    });

    return rootFolders;
  }
}

export const folderService = new FolderService();
