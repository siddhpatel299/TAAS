import { api } from './api';

export interface NexusProject {
    id: string;
    name: string;
    description?: string;
    key: string;
    icon?: string;
    color?: string;
    status: string;
    position: number;
    _count?: {
        tasks: number;
        epics: number;
        sprints: number;
    };
}

export interface NexusTask {
    id: string;
    projectId: string;
    epicId?: string;
    sprintId?: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done' | 'blocked' | 'backlog';
    priority: 'low' | 'medium' | 'high' | 'critical';
    points?: number;
    position: number;
    parentId?: string;
    dueDate?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
    labels: { label: NexusLabel }[];
    epic?: NexusEpic;
    sprint?: NexusSprint;
    subtasks?: NexusTask[];
    _count?: {
        subtasks: number;
    };
}

export interface NexusEpic {
    id: string;
    projectId: string;
    title: string;
    status: string;
    startDate?: string;
    endDate?: string;
}

export interface NexusSprint {
    id: string;
    projectId: string;
    name: string;
    status: 'planned' | 'active' | 'completed';
    startDate: string;
    endDate: string;
    goal?: string;
}

export interface NexusLabel {
    id: string;
    projectId: string;
    name: string;
    color: string;
}

export interface NexusComment {
    id: string;
    taskId: string;
    userId: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        avatarUrl: string | null;
    };
}

export interface NexusActivity {
    id: string;
    taskId: string;
    userId: string;
    type: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        avatarUrl: string | null;
    };
}

export const nexusApi = {
    // Projects
    getProjects: () =>
        api.get<{ success: boolean; data: NexusProject[] }>('/nexus/projects'),

    getProject: (projectId: string) =>
        api.get<{ success: boolean; data: NexusProject & { epics: NexusEpic[]; sprints: NexusSprint[] } }>(`/nexus/projects/${projectId}`),

    createProject: (data: Partial<NexusProject>) =>
        api.post<{ success: boolean; data: NexusProject }>('/nexus/projects', data),

    // Tasks
    getTasks: (projectId: string, filters?: any) =>
        api.get<{ success: boolean; data: NexusTask[] }>(`/nexus/projects/${projectId}/tasks`, { params: filters }),

    createTask: (projectId: string, data: Partial<NexusTask>) =>
        api.post<{ success: boolean; data: NexusTask }>(`/nexus/projects/${projectId}/tasks`, data),

    updateTask: (taskId: string, data: Partial<NexusTask>) =>
        api.patch<{ success: boolean; data: NexusTask }>(`/nexus/tasks/${taskId}`, data),

    deleteTask: (taskId: string) =>
        api.delete(`/nexus/tasks/${taskId}`),

    // Epics
    getEpics: (projectId: string) =>
        api.get<{ success: boolean; data: NexusEpic[] }>(`/nexus/projects/${projectId}/epics`),

    createEpic: (projectId: string, data: Partial<NexusEpic>) =>
        api.post<{ success: boolean; data: NexusEpic }>(`/nexus/projects/${projectId}/epics`, data),

    updateEpic: (epicId: string, data: Partial<NexusEpic>) =>
        api.patch<{ success: boolean; data: NexusEpic }>(`/nexus/epics/${epicId}`, data),

    deleteEpic: (epicId: string) =>
        api.delete(`/nexus/epics/${epicId}`),

    // Sprints
    getSprints: (projectId: string) =>
        api.get<{ success: boolean; data: NexusSprint[] }>(`/nexus/projects/${projectId}/sprints`),

    createSprint: (projectId: string, data: Partial<NexusSprint>) =>
        api.post<{ success: boolean; data: NexusSprint }>(`/nexus/projects/${projectId}/sprints`, data),

    updateSprint: (sprintId: string, data: Partial<NexusSprint>) =>
        api.patch<{ success: boolean; data: NexusSprint }>(`/nexus/sprints/${sprintId}`, data),

    deleteSprint: (sprintId: string) =>
        api.delete(`/nexus/sprints/${sprintId}`),

    // Comments & Activity
    getComments: (taskId: string) =>
        api.get<{ success: boolean; data: NexusComment[] }>(`/nexus/tasks/${taskId}/comments`),

    createComment: (taskId: string, content: string) =>
        api.post<{ success: boolean; data: NexusComment }>(`/nexus/tasks/${taskId}/comments`, { content }),

    deleteComment: (commentId: string) =>
        api.delete(`/nexus/comments/${commentId}`),

    getActivity: (taskId: string) =>
        api.get<{ success: boolean; data: NexusActivity[] }>(`/nexus/tasks/${taskId}/activity`),
};
