import { prisma } from '../lib/prisma';
import { NexusProject, NexusEpic, NexusSprint, NexusTask } from '@prisma/client';

export const nexusService = {
    // ==================== PROJECTS ====================
    async getProjects(userId: string) {
        return prisma.nexusProject.findMany({
            where: { userId, status: 'active' },
            include: {
                _count: {
                    select: { tasks: true, epics: true, sprints: true }
                }
            },
            orderBy: { position: 'asc' }
        });
    },

    async getProject(userId: string, projectId: string) {
        return prisma.nexusProject.findFirst({
            where: { id: projectId, userId },
            include: {
                epics: {
                    where: { status: { not: 'done' } },
                    orderBy: { position: 'asc' }
                },
                sprints: {
                    where: { status: 'active' },
                    orderBy: { endDate: 'asc' }
                },
                labels: true,
            }
        });
    },

    async createProject(userId: string, data: { name: string; key: string; description?: string; color?: string; icon?: string }) {
        // Check if key exists
        const existing = await prisma.nexusProject.findUnique({
            where: { userId_key: { userId, key: data.key } }
        });

        if (existing) {
            throw new Error('Project key already exists');
        }

        return prisma.nexusProject.create({
            data: {
                userId,
                ...data
            }
        });
    },

    async updateProject(userId: string, projectId: string, data: Partial<NexusProject>) {
        // Verify ownership
        const project = await prisma.nexusProject.findFirst({ where: { id: projectId, userId } });
        if (!project) throw new Error('Project not found');

        return prisma.nexusProject.update({
            where: { id: projectId },
            data
        });
    },

    // ==================== TASKS ====================
    async getTasks(userId: string, projectId: string, filters?: {
        status?: string;
        sprintId?: string | null;
        epicId?: string | null;
        search?: string;
    }) {
        // Verify project access
        const project = await prisma.nexusProject.findFirst({ where: { id: projectId, userId } });
        if (!project) throw new Error('Project not found');

        const where: any = { projectId };

        if (filters?.status) where.status = filters.status;
        if (filters?.sprintId !== undefined) where.sprintId = filters.sprintId;
        if (filters?.epicId !== undefined) where.epicId = filters.epicId;
        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        return prisma.nexusTask.findMany({
            where,
            include: {
                epic: true,
                sprint: true,
                labels: { include: { label: true } },
                _count: { select: { subtasks: true } }
            },
            orderBy: { position: 'asc' }
        });
    },

    async createTask(userId: string, projectId: string, data: {
        title: string;
        description?: string;
        status?: string;
        priority?: string;
        points?: number;
        epicId?: string;
        sprintId?: string;
        parentId?: string;
    }) {
        // Verify project access
        const project = await prisma.nexusProject.findFirst({ where: { id: projectId, userId } });
        if (!project) throw new Error('Project not found');

        // Get max position
        const lastTask = await prisma.nexusTask.findFirst({
            where: { projectId, status: data.status || 'todo' },
            orderBy: { position: 'desc' }
        });
        const position = (lastTask?.position || 0) + 1000;

        return prisma.nexusTask.create({
            data: {
                projectId,
                ...data,
                position
            },
            include: {
                epic: true,
                sprint: true,
                labels: { include: { label: true } }
            }
        });
    },

    async updateTask(userId: string, taskId: string, data: Partial<NexusTask>) {
        const task = await prisma.nexusTask.findFirst({
            where: { id: taskId, project: { userId } }
        });
        if (!task) throw new Error('Task not found');

        return prisma.nexusTask.update({
            where: { id: taskId },
            data,
            include: {
                epic: true,
                sprint: true,
                labels: { include: { label: true } }
            }
        });
    },

    async moveTask(userId: string, taskId: string, status: string, newIndex: number) {
        const task = await prisma.nexusTask.findFirst({
            where: { id: taskId, project: { userId } }
        });
        if (!task) throw new Error('Task not found');

        // Simple status update for now - real DnD reordering logic would go here
        return prisma.nexusTask.update({
            where: { id: taskId },
            data: { status, position: newIndex }
        });
    },

    async deleteTask(userId: string, taskId: string) {
        const task = await prisma.nexusTask.findFirst({
            where: { id: taskId, project: { userId } }
        });
        if (!task) throw new Error('Task not found');

        return prisma.nexusTask.delete({ where: { id: taskId } });
    }
};
