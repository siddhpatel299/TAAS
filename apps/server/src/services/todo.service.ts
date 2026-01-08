import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/error.middleware';

interface TaskFilters {
  listId?: string | null;
  status?: string;
  priority?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
  label?: string;
}

export const todoService = {
  async getLists(userId: string) {
    const [lists, counts] = await Promise.all([
      prisma.todoList.findMany({
        where: { userId },
        orderBy: { position: 'asc' },
      }),
      prisma.todoTask.groupBy({
        by: ['listId', 'status'],
        where: { userId },
        _count: { _all: true },
      }),
    ]);

    const countMap: Record<string, { total: number; done: number }> = {};
    counts.forEach((item) => {
      const key = item.listId || 'inbox';
      if (!countMap[key]) {
        countMap[key] = { total: 0, done: 0 };
      }
      countMap[key].total += item._count._all;
      if (item.status === 'done') {
        countMap[key].done += item._count._all;
      }
    });

    const inboxCounts = countMap['inbox'] || { total: 0, done: 0 };

    const mappedLists = lists.map((list) => ({
      ...list,
      counts: countMap[list.id] || { total: 0, done: 0 },
    }));

    return [
      {
        id: 'inbox',
        userId,
        name: 'Inbox',
        color: '#EEF2FF',
        icon: 'inbox',
        position: -1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        counts: inboxCounts,
      },
      ...mappedLists,
    ];
  },

  async createList(userId: string, data: { name: string; color?: string; icon?: string }) {
    const position = await prisma.todoList.count({ where: { userId } });
    return prisma.todoList.create({
      data: { userId, name: data.name, color: data.color, icon: data.icon, position },
    });
  },

  async updateList(userId: string, listId: string, data: Partial<{ name: string; color: string; icon: string; position: number }>) {
    await this.ensureListOwnership(userId, listId);
    return prisma.todoList.update({
      where: { id: listId },
      data,
    });
  },

  async deleteList(userId: string, listId: string) {
    await this.ensureListOwnership(userId, listId);
    await prisma.todoList.delete({ where: { id: listId } });
    return { success: true };
  },

  async getTasks(userId: string, filters: TaskFilters = {}) {
    const where: any = { userId };

    if (typeof filters.listId !== 'undefined') {
      where.listId = filters.listId === 'inbox' ? null : filters.listId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.dueFrom || filters.dueTo) {
      where.dueDate = {};
      if (filters.dueFrom) where.dueDate.gte = new Date(filters.dueFrom);
      if (filters.dueTo) where.dueDate.lte = new Date(filters.dueTo);
    }

    if (filters.label) {
      where.labels = { has: filters.label };
    }

    const tasks = await prisma.todoTask.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { position: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const stats = await this.getStats(userId);

    return { tasks, stats };
  },

  async createTask(
    userId: string,
    data: {
      title: string;
      listId?: string | null;
      description?: string;
      priority?: string;
      dueDate?: string | Date | null;
      labels?: string[];
      status?: string;
      isPinned?: boolean;
    }
  ) {
    if (data.listId) {
      await this.ensureListOwnership(userId, data.listId);
    }

    const position = await prisma.todoTask.count({
      where: { userId, listId: data.listId || null },
    });

    return prisma.todoTask.create({
      data: {
        userId,
        listId: data.listId || null,
        title: data.title,
        description: data.description,
        priority: data.priority || 'medium',
        status: data.status || 'todo',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        labels: data.labels || [],
        isPinned: data.isPinned ?? false,
        position,
      },
    });
  },

  async updateTask(
    userId: string,
    taskId: string,
    data: Partial<{ title: string; description: string; priority: string; status: string; dueDate: string | Date | null; labels: string[]; listId: string | null; isPinned: boolean; position: number }>
  ) {
    await this.ensureTaskOwnership(userId, taskId);

    if (data.listId) {
      await this.ensureListOwnership(userId, data.listId);
    }

    const updates: any = { ...data };
    if (typeof data.dueDate !== 'undefined') {
      updates.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    return prisma.todoTask.update({
      where: { id: taskId },
      data: updates,
    });
  },

  async updateTaskStatus(userId: string, taskId: string, status: string) {
    await this.ensureTaskOwnership(userId, taskId);
    const completedAt = status === 'done' ? new Date() : null;
    return prisma.todoTask.update({
      where: { id: taskId },
      data: { status, completedAt },
    });
  },

  async deleteTask(userId: string, taskId: string) {
    await this.ensureTaskOwnership(userId, taskId);
    await prisma.todoTask.delete({ where: { id: taskId } });
    return { success: true };
  },

  async getStats(userId: string) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [total, completed, overdue, today] = await Promise.all([
      prisma.todoTask.count({ where: { userId } }),
      prisma.todoTask.count({ where: { userId, status: 'done' } }),
      prisma.todoTask.count({ where: { userId, status: { not: 'done' }, dueDate: { lt: now } } }),
      prisma.todoTask.count({ where: { userId, dueDate: { gte: todayStart, lte: todayEnd } } }),
    ]);

    return { total, completed, overdue, today };
  },

  async ensureListOwnership(userId: string, listId: string) {
    const list = await prisma.todoList.findFirst({ where: { id: listId, userId } });
    if (!list) {
      throw new ApiError('List not found', 404);
    }
  },

  async ensureTaskOwnership(userId: string, taskId: string) {
    const task = await prisma.todoTask.findFirst({ where: { id: taskId, userId } });
    if (!task) {
      throw new ApiError('Task not found', 404);
    }
  },
};
