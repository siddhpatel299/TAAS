import { prisma } from '../lib/prisma';
import { NexusProject, NexusEpic, NexusSprint, NexusTask } from '@prisma/client';
import { flowService } from './flow.service';

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

        const task = await prisma.nexusTask.create({
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

        // Emit Event
        flowService.emitEvent('NEXUS_TASK_CREATED', task, userId).catch(console.error);

        return task;
    },

    async updateTask(userId: string, taskId: string, data: Partial<NexusTask>) {
        const task = await prisma.nexusTask.findFirst({
            where: { id: taskId, project: { userId } }
        });
        if (!task) throw new Error('Task not found');

        const updatedTask = await prisma.nexusTask.update({
            where: { id: taskId },
            data,
            include: {
                epic: true,
                sprint: true,
                labels: { include: { label: true } }
            }
        });

        // Emit Event if status changed to done
        if (data.status === 'done' && task.status !== 'done') {
            flowService.emitEvent('NEXUS_TASK_COMPLETED', updatedTask, userId).catch(console.error);
        }

        return updatedTask;
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
    },

    // ==================== EPICS ====================
    async getEpics(userId: string, projectId: string) {
        const project = await prisma.nexusProject.findFirst({ where: { id: projectId, userId } });
        if (!project) throw new Error('Project not found');

        return prisma.nexusEpic.findMany({
            where: { projectId },
            include: {
                _count: { select: { tasks: true } }
            },
            orderBy: { position: 'asc' }
        });
    },

    async createEpic(userId: string, projectId: string, data: { title: string; description?: string; startDate?: Date; endDate?: Date }) {
        const project = await prisma.nexusProject.findFirst({ where: { id: projectId, userId } });
        if (!project) throw new Error('Project not found');

        return prisma.nexusEpic.create({
            data: {
                projectId,
                ...data
            }
        });
    },

    async updateEpic(userId: string, epicId: string, data: Partial<NexusEpic>) {
        const epic = await prisma.nexusEpic.findFirst({
            where: { id: epicId, project: { userId } }
        });
        if (!epic) throw new Error('Epic not found');

        return prisma.nexusEpic.update({
            where: { id: epicId },
            data
        });
    },

    async deleteEpic(userId: string, epicId: string) {
        const epic = await prisma.nexusEpic.findFirst({
            where: { id: epicId, project: { userId } }
        });
        if (!epic) throw new Error('Epic not found');

        return prisma.nexusEpic.delete({ where: { id: epicId } });
    },

    // ==================== SPRINTS ====================
    async getSprints(userId: string, projectId: string) {
        const project = await prisma.nexusProject.findFirst({ where: { id: projectId, userId } });
        if (!project) throw new Error('Project not found');

        return prisma.nexusSprint.findMany({
            where: { projectId },
            include: {
                _count: { select: { tasks: true } }
            },
            orderBy: { startDate: 'desc' }
        });
    },

    async createSprint(userId: string, projectId: string, data: { name: string; goal?: string; startDate: Date; endDate: Date }) {
        const project = await prisma.nexusProject.findFirst({ where: { id: projectId, userId } });
        if (!project) throw new Error('Project not found');

        return prisma.nexusSprint.create({
            data: {
                projectId,
                ...data
            }
        });
    },

    async updateSprint(userId: string, sprintId: string, data: Partial<NexusSprint>) {
        const sprint = await prisma.nexusSprint.findFirst({
            where: { id: sprintId, project: { userId } }
        });
        if (!sprint) throw new Error('Sprint not found');

        return prisma.nexusSprint.update({
            where: { id: sprintId },
            data
        });
    },

    async deleteSprint(userId: string, sprintId: string) {
        const sprint = await prisma.nexusSprint.findFirst({
            where: { id: sprintId, project: { userId } }
        });
        if (!sprint) throw new Error('Sprint not found');

        return prisma.nexusSprint.delete({ where: { id: sprintId } });
    },

    // ==================== COMMENTS & ACTIVITY ====================
    async getComments(userId: string, taskId: string) {
        // Verify access (via project)
        const task = await prisma.nexusTask.findFirst({
            where: { id: taskId, project: { userId } }
        });
        if (!task) throw new Error('Task not found');

        return prisma.nexusComment.findMany({
            where: { taskId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    },

    async createComment(userId: string, taskId: string, content: string) {
        const task = await prisma.nexusTask.findFirst({
            where: { id: taskId, project: { userId } }
        });
        if (!task) throw new Error('Task not found');

        const comment = await prisma.nexusComment.create({
            data: {
                taskId,
                userId,
                content
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Log activity
        await prisma.nexusActivity.create({
            data: {
                taskId,
                userId,
                type: 'comment',
                content: 'commented on this task'
            }
        });

        return comment;
    },

    async deleteComment(userId: string, commentId: string) {
        const comment = await prisma.nexusComment.findFirst({
            where: { id: commentId, userId }
        });
        if (!comment) throw new Error('Comment not found or access denied');

        return prisma.nexusComment.delete({ where: { id: commentId } });
    },

    async getActivity(userId: string, taskId: string) {
        // Verify access
        const task = await prisma.nexusTask.findFirst({
            where: { id: taskId, project: { userId } }
        });
        if (!task) throw new Error('Task not found');

        return prisma.nexusActivity.findMany({
            where: { taskId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
};
