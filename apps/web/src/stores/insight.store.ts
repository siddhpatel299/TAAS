import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WidgetConfig {
    id: string;
    type: 'finance' | 'job' | 'outreach' | 'goal' | 'cross-domain';
    title: string;
    size: 'small' | 'medium' | 'large' | 'full';
    position: number;
    settings?: Record<string, any>;
}

export interface Goal {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
    deadline?: string;
    type: 'daily' | 'weekly' | 'monthly' | 'total';
    category: 'finance' | 'productivity' | 'health' | 'other';
}

interface InsightState {
    widgets: WidgetConfig[];
    goals: Goal[];
    isEditMode: boolean;

    // Actions
    addWidget: (widget: Omit<WidgetConfig, 'id' | 'position'>) => void;
    removeWidget: (id: string) => void;
    updateWidget: (id: string, updates: Partial<WidgetConfig>) => void;
    reorderWidgets: (startIndex: number, endIndex: number) => void;

    addGoal: (goal: Omit<Goal, 'id'>) => void;
    updateGoal: (id: string, updates: Partial<Goal>) => void;
    removeGoal: (id: string) => void;

    toggleEditMode: () => void;
}

export const useInsightStore = create<InsightState>()(
    persist(
        (set, get) => ({
            widgets: [
                {
                    id: 'default-finance',
                    type: 'finance',
                    title: 'Monthly Spending',
                    size: 'medium',
                    position: 0,
                },
                {
                    id: 'default-jobs',
                    type: 'job',
                    title: 'Application Pipeline',
                    size: 'medium',
                    position: 1,
                },
                {
                    id: 'default-goals',
                    type: 'goal',
                    title: 'Active Goals',
                    size: 'large',
                    position: 2,
                },
            ],
            goals: [],
            isEditMode: false,

            addWidget: (widget) => {
                set((state) => ({
                    widgets: [
                        ...state.widgets,
                        {
                            ...widget,
                            id: crypto.randomUUID(),
                            position: state.widgets.length,
                        },
                    ],
                }));
            },

            removeWidget: (id) => {
                set((state) => ({
                    widgets: state.widgets.filter((w) => w.id !== id),
                }));
            },

            updateWidget: (id, updates) => {
                set((state) => ({
                    widgets: state.widgets.map((w) =>
                        w.id === id ? { ...w, ...updates } : w
                    ),
                }));
            },

            reorderWidgets: (startIndex, endIndex) => {
                set((state) => {
                    const newWidgets = Array.from(state.widgets);
                    const [removed] = newWidgets.splice(startIndex, 1);
                    newWidgets.splice(endIndex, 0, removed);

                    // Update positions
                    return {
                        widgets: newWidgets.map((w, index) => ({ ...w, position: index })),
                    };
                });
            },

            addGoal: (goal) => {
                set((state) => ({
                    goals: [
                        ...state.goals,
                        { ...goal, id: crypto.randomUUID() },
                    ],
                }));
            },

            updateGoal: (id, updates) => {
                set((state) => ({
                    goals: state.goals.map((g) =>
                        g.id === id ? { ...g, ...updates } : g
                    ),
                }));
            },

            removeGoal: (id) => {
                set((state) => ({
                    goals: state.goals.filter((g) => g.id !== id),
                }));
            },

            toggleEditMode: () => {
                set((state) => ({ isEditMode: !state.isEditMode }));
            },
        }),
        {
            name: 'insight-store',
        }
    )
);
