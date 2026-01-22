import { create } from 'zustand';
import { nexusApi, NexusProject, NexusTask, NexusEpic, NexusSprint, NexusComment, NexusActivity } from '@/lib/nexus-api';

interface NexusState {
    // Data
    projects: NexusProject[];
    currentProject: (NexusProject & { epics: NexusEpic[]; sprints: NexusSprint[] }) | null;
    tasks: NexusTask[];
    activeTask: NexusTask | null;
    activeTaskComments: NexusComment[];
    activeTaskActivity: NexusActivity[];
    newTaskInput: { status: string; projectId: string } | null;

    // UI State
    viewMode: 'kanban' | 'list' | 'timeline' | 'backlog';
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchProjects: () => Promise<void>;
    setCurrentProject: (projectId: string) => Promise<void>;
    createProject: (data: Partial<NexusProject>) => Promise<NexusProject>;

    fetchTasks: (projectId: string, filters?: any) => Promise<void>;
    createTask: (projectId: string, data: Partial<NexusTask>) => Promise<void>;
    updateTask: (taskId: string, data: Partial<NexusTask>) => Promise<void>;
    moveTask: (taskId: string, status: string, newIndex: number) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;

    fetchEpics: (projectId: string) => Promise<void>;
    createEpic: (projectId: string, data: Partial<NexusEpic>) => Promise<void>;
    updateEpic: (epicId: string, data: Partial<NexusEpic>) => Promise<void>;
    deleteEpic: (epicId: string) => Promise<void>;

    fetchSprints: (projectId: string) => Promise<void>;
    createSprint: (projectId: string, data: Partial<NexusSprint>) => Promise<void>;
    updateSprint: (sprintId: string, data: Partial<NexusSprint>) => Promise<void>;
    deleteSprint: (sprintId: string) => Promise<void>;

    fetchComments: (taskId: string) => Promise<void>;
    createComment: (taskId: string, content: string) => Promise<void>;
    deleteComment: (commentId: string) => Promise<void>;
    fetchActivity: (taskId: string) => Promise<void>;

    setViewMode: (mode: 'kanban' | 'list' | 'timeline' | 'backlog') => void;
    setActiveTask: (task: NexusTask | null) => void;
    openCreateTask: (status: string) => void;
    closeCreateTask: () => void;
    clearError: () => void;
}

export const useNexusStore = create<NexusState>((set, get) => ({
    projects: [],
    currentProject: null,
    tasks: [],
    activeTask: null,
    activeTaskComments: [],
    activeTaskActivity: [],
    newTaskInput: null,
    viewMode: 'kanban',
    isLoading: false,
    error: null,

    fetchProjects: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await nexusApi.getProjects();
            set({ projects: response.data.data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    setCurrentProject: async (projectId: string) => {
        set({ isLoading: true, error: null });
        try {
            // Fetch full project details
            const response = await nexusApi.getProject(projectId);
            set({ currentProject: response.data.data });

            // Fetch tasks for this project
            await get().fetchTasks(projectId);
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    createProject: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await nexusApi.createProject(data);
            const project = response.data.data;
            set(state => ({
                projects: [...state.projects, project],
                isLoading: false
            }));
            return project;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    fetchTasks: async (projectId, filters) => {
        set({ isLoading: true, error: null });
        try {
            const response = await nexusApi.getTasks(projectId, filters);
            set({ tasks: response.data.data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    createTask: async (projectId, data) => {
        try {
            await nexusApi.createTask(projectId, data);
            await get().fetchTasks(projectId);
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    updateTask: async (taskId, data) => {
        try {
            // Optimistic update
            set(state => ({
                tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...data } : t)
            }));

            await nexusApi.updateTask(taskId, data);

            // Refresh to ensure consistency
            const currentProject = get().currentProject;
            if (currentProject) {
                await get().fetchTasks(currentProject.id);
            }
        } catch (error: any) {
            set({ error: error.message });
            // Revert optimism if needed (complex without snapshot)
            const currentProject = get().currentProject;
            if (currentProject) await get().fetchTasks(currentProject.id);
        }
    },

    moveTask: async (taskId, status, newIndex) => {
        // Optimistic update
        set(state => {
            const task = state.tasks.find(t => t.id === taskId);
            if (!task) return state;

            const updatedTask = { ...task, status: status as NexusTask['status'] };
            // Simple optimistic update: just change status, position handling is harder locally
            return {
                tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t)
            };
        });

        try {
            await nexusApi.updateTask(taskId, { status: status as any, position: newIndex });
            // Refresh to ensure consistency
            const currentProject = get().currentProject;
            if (currentProject) {
                await get().fetchTasks(currentProject.id);
            }
        } catch (error: any) {
            set({ error: error.message });
            const currentProject = get().currentProject;
            if (currentProject) await get().fetchTasks(currentProject.id);
        }
    },

    deleteTask: async (taskId) => {
        try {
            await nexusApi.deleteTask(taskId);
            set(state => ({
                tasks: state.tasks.filter(t => t.id !== taskId)
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    fetchEpics: async (projectId) => {
        try {
            const response = await nexusApi.getEpics(projectId);
            set(state => ({
                currentProject: state.currentProject ? { ...state.currentProject, epics: response.data.data } : null
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    createEpic: async (projectId, data) => {
        try {
            const response = await nexusApi.createEpic(projectId, data);
            const epic = response.data.data;
            set(state => ({
                currentProject: state.currentProject ? {
                    ...state.currentProject,
                    epics: [...state.currentProject.epics, epic]
                } : null
            }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    updateEpic: async (epicId, data) => {
        try {
            await nexusApi.updateEpic(epicId, data);
            const currentProject = get().currentProject;
            if (currentProject) await get().fetchEpics(currentProject.id);
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    deleteEpic: async (epicId) => {
        try {
            await nexusApi.deleteEpic(epicId);
            set(state => ({
                currentProject: state.currentProject ? {
                    ...state.currentProject,
                    epics: state.currentProject.epics.filter(e => e.id !== epicId)
                } : null
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    fetchSprints: async (projectId) => {
        try {
            const response = await nexusApi.getSprints(projectId);
            set(state => ({
                currentProject: state.currentProject ? { ...state.currentProject, sprints: response.data.data } : null
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    createSprint: async (projectId, data) => {
        try {
            const response = await nexusApi.createSprint(projectId, data);
            const sprint = response.data.data;
            set(state => ({
                currentProject: state.currentProject ? {
                    ...state.currentProject,
                    sprints: [...state.currentProject.sprints, sprint]
                } : null
            }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    updateSprint: async (sprintId, data) => {
        try {
            await nexusApi.updateSprint(sprintId, data);
            const currentProject = get().currentProject;
            if (currentProject) await get().fetchSprints(currentProject.id);
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    deleteSprint: async (sprintId) => {
        try {
            await nexusApi.deleteSprint(sprintId);
            set(state => ({
                currentProject: state.currentProject ? {
                    ...state.currentProject,
                    sprints: state.currentProject.sprints.filter(s => s.id !== sprintId)
                } : null
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    fetchComments: async (taskId) => {
        try {
            const response = await nexusApi.getComments(taskId);
            set({ activeTaskComments: response.data.data });
        } catch (error: any) {
            console.error('Failed to fetch comments', error);
        }
    },

    createComment: async (taskId, content) => {
        try {
            const response = await nexusApi.createComment(taskId, content);
            set(state => ({
                activeTaskComments: [...state.activeTaskComments, response.data.data],
                // Optimistically add activity
                activeTaskActivity: [{
                    id: 'temp-' + Date.now(),
                    taskId,
                    userId: 'me', // placeholder
                    type: 'comment',
                    content: 'commented on this task',
                    createdAt: new Date().toISOString(),
                    user: response.data.data.user
                } as NexusActivity, ...state.activeTaskActivity]
            }));
            // Refresh activity to get real data
            get().fetchActivity(taskId);
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    deleteComment: async (commentId) => {
        try {
            await nexusApi.deleteComment(commentId);
            set(state => ({
                activeTaskComments: state.activeTaskComments.filter(c => c.id !== commentId)
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    fetchActivity: async (taskId) => {
        try {
            const response = await nexusApi.getActivity(taskId);
            set({ activeTaskActivity: response.data.data });
        } catch (error: any) {
            console.error('Failed to fetch activity', error);
        }
    },

    setViewMode: (mode) => set({ viewMode: mode }),
    setActiveTask: (task) => {
        set({ activeTask: task, newTaskInput: null, activeTaskComments: [], activeTaskActivity: [] });
        if (task) {
            get().fetchComments(task.id);
            get().fetchActivity(task.id);
        }
    },
    openCreateTask: (status) => {
        const currentProject = get().currentProject;
        if (currentProject) {
            set({ newTaskInput: { status, projectId: currentProject.id }, activeTask: null });
        }
    },
    closeCreateTask: () => set({ newTaskInput: null }),
    clearError: () => set({ error: null })
}));
