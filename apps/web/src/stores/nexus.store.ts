import { create } from 'zustand';
import { nexusApi, NexusProject, NexusTask, NexusEpic, NexusSprint } from '@/lib/nexus-api';

interface NexusState {
    // Data
    projects: NexusProject[];
    currentProject: (NexusProject & { epics: NexusEpic[]; sprints: NexusSprint[] }) | null;
    tasks: NexusTask[];
    activeTask: NexusTask | null;

    // UI State
    viewMode: 'kanban' | 'list' | 'timeline';
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

    setViewMode: (mode: 'kanban' | 'list' | 'timeline') => void;
    setActiveTask: (task: NexusTask | null) => void;
    clearError: () => void;
}

export const useNexusStore = create<NexusState>((set, get) => ({
    projects: [],
    currentProject: null,
    tasks: [],
    activeTask: null,
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

    setViewMode: (mode) => set({ viewMode: mode }),
    setActiveTask: (task) => set({ activeTask: task }),
    clearError: () => set({ error: null })
}));
