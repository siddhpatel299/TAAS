import { useMemo, useState } from 'react';
import { DndContext, DragOverlay, useDroppable, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { NexusTask } from '@/lib/nexus-api';
import { NexusTaskCard } from './NexusTaskCard';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useNexusStore } from '@/stores/nexus.store';

interface NexusKanbanBoardProps {
    tasks: NexusTask[];
    projectId: string; // Passed to trigger refresh/create
}

const COLUMNS = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
];

export function NexusKanbanBoard({ tasks }: Omit<NexusKanbanBoardProps, 'projectId'>) {
    const { moveTask } = useNexusStore();
    const [activeTask, setActiveTask] = useState<NexusTask | null>(null);

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const acc: Record<string, NexusTask[]> = { todo: [], in_progress: [], done: [] };
        tasks.forEach(task => {
            if (acc[task.status]) acc[task.status].push(task);
            else acc['todo']?.push(task); // Fallback
        });
        return acc;
    }, [tasks]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveTask(event.active.data.current?.task);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the task object
        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        // 1. Dropped on a Column (move to new status, append to end)
        if (COLUMNS.find(c => c.id === overId)) {
            if (activeTask.status !== overId) {
                // Moving to empty column or end of column
                // Find max position in that column
                const tasksInColumn = tasksByStatus[overId] || [];
                const maxPos = tasksInColumn.length > 0
                    ? Math.max(...tasksInColumn.map(t => t.position))
                    : 0;

                moveTask(activeId, overId, maxPos + 1000);
            }
            return;
        }

        // 2. Dropped on another Task (reorder)
        const overTask = tasks.find(t => t.id === overId);
        if (overTask) {
            // Determine new status (take status of the valid drop target)
            const newStatus = overTask.status;

            // Calculate new position
            // If dragging down: overTask.position + 1 (or avg with next)
            // If dragging up: overTask.position - 1 (or avg with prev)
            // Simpler: just set it to overTask.position and let backend handle collision or shift
            // Better: find unique position.

            // For now, let's just swap positions or place "before"
            // We'll increment position by 1 if dropping "after"
            // This is naive but works for a prototype. A robust impl needs LEXORANK.
            // Let's use avg position logic.

            // NOTE: Since the UI is "unsorted" inside the column relying on array order, 
            // we really rely on `moveTask` to update the state `tasks` array order for immediate feedback.

            // Let's just pass the index for now.
            moveTask(activeId, newStatus, overTask.position);
        }
    };

    // Quick Add Task
    const handleQuickAdd = async (status: string) => {
        useNexusStore.getState().openCreateTask(status);
    }

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-6 overflow-x-auto pb-4">
                {COLUMNS.map(col => (
                    <Column
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        tasks={tasksByStatus[col.id] || []}
                        onQuickAdd={() => handleQuickAdd(col.id)}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <div className="opacity-80 rotate-2">
                        <NexusTaskCard task={activeTask} onClick={() => { }} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function Column({ id, title, tasks, onQuickAdd }: { id: string, title: string, tasks: NexusTask[], onQuickAdd: () => void }) {
    const { setNodeRef } = useDroppable({
        id: id,
        data: { type: 'Column', id }
    });

    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-72 flex flex-col h-full rounded-xl bg-slate-100/50 border border-slate-200/60">
            {/* Header */}
            <div className="p-3 flex items-center justify-between border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                        {tasks.length}
                    </span>
                </div>
                <div className="flex gap-1">
                    <button onClick={onQuickAdd} className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-indigo-600">
                        <Plus className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-slate-200 rounded text-slate-500">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 p-2 overflow-y-auto space-y-2">
                {tasks.map(task => (
                    <NexusTaskCard
                        key={task.id}
                        task={task}
                        onClick={() => {
                            // This is handled by the parent passing the store action
                            useNexusStore.getState().setActiveTask(task);
                        }}
                    />
                ))}
            </div>

            {/* Add Button at bottom */}
            <button onClick={onQuickAdd} className="m-2 p-2 flex items-center gap-2 rounded-lg text-sm text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
            </button>
        </div>
    );
}
