import { useState, useMemo } from 'react';
import { useNexusStore } from '@/stores/nexus.store';
import { NexusTask, NexusSprint } from '@/lib/nexus-api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, Plus, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Component for a single Sprint container
function SprintContainer({ sprint, tasks, onAddTask }: { sprint: NexusSprint, tasks: NexusTask[], onAddTask: () => void }) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-6">
            <div
                className="flex items-center justify-between p-4 bg-white border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <div>
                        <h3 className="font-semibold text-slate-800 text-sm">{sprint.name}</h3>
                        <div className="text-xs text-slate-500 mt-0.5">
                            {format(new Date(sprint.startDate), 'MMM d')} - {format(new Date(sprint.endDate), 'MMM d')} • {tasks.length} issues
                        </div>
                    </div>
                    {sprint.status === 'active' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                            Active
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {sprint.status === 'planned' && (
                        <button className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
                            Start Sprint
                        </button>
                    )}
                    <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-2 space-y-1">
                            {tasks.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 bg-slate-50/50">
                                    <span className="text-sm">Plan a sprint by dragging issues here</span>
                                </div>
                            ) : (
                                tasks.map(task => (
                                    <div key={task.id} className="group flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-slate-400 w-16">
                                                {task.id.slice(-6).toUpperCase()}
                                            </span>
                                            <span className="text-sm text-slate-700 group-hover:text-indigo-600 font-medium transition-colors">
                                                {task.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {task.points && (
                                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-mono">
                                                    {task.points}
                                                </span>
                                            )}
                                            <div className={cn("w-2 h-2 rounded-full",
                                                task.priority === 'critical' ? 'bg-red-500' :
                                                    task.priority === 'high' ? 'bg-orange-500' :
                                                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-slate-300'
                                            )} />
                                            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 w-20 text-center">
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddTask(); }}
                                className="w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-dashed border-transparent hover:border-indigo-200"
                            >
                                <Plus className="w-3 h-3" />
                                Create Issue
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function NexusBacklogView({ tasks, projectId }: { tasks: NexusTask[], projectId: string }) {
    const { currentProject, openCreateTask, createSprint } = useNexusStore();
    const sprints = currentProject?.sprints || [];

    // Group tasks
    const { sprintTasks, backlogTasks } = useMemo(() => {
        const sprintTasks: Record<string, NexusTask[]> = {};
        const backlogTasks: NexusTask[] = [];

        tasks.forEach(task => {
            if (task.sprintId) {
                if (!sprintTasks[task.sprintId]) sprintTasks[task.sprintId] = [];
                sprintTasks[task.sprintId].push(task);
            } else {
                backlogTasks.push(task);
            }
        });

        return { sprintTasks, backlogTasks };
    }, [tasks]);

    const handleCreateSprint = () => {
        // Create a basic 2-week sprint
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 14);

        createSprint(projectId, {
            name: `Sprint ${sprints.length + 1}`,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: 'planned'
        });
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h2 className="font-semibold text-slate-800">Backlog</h2>
                <button
                    onClick={handleCreateSprint}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Create Sprint
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8 bg-white">
                {/* Active & Planned Sprints */}
                <div className="space-y-4">
                    {sprints.map(sprint => (
                        <SprintContainer
                            key={sprint.id}
                            sprint={sprint}
                            tasks={sprintTasks[sprint.id] || []}
                            onAddTask={() => openCreateTask('todo')} // TODO: Pre-fill sprint ID
                        />
                    ))}
                </div>

                {/* Backlog */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800 text-sm">Backlog</h3>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                                {backlogTasks.length} issues
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200 min-h-[200px]">
                        {backlogTasks.map(task => (
                            <div key={task.id} className="group flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-slate-400 w-16">
                                        {task.id.slice(-6).toUpperCase()}
                                    </span>
                                    <span className="text-sm text-slate-700 group-hover:text-indigo-600 font-medium transition-colors">
                                        {task.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {task.points && (
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-mono">
                                            {task.points}
                                        </span>
                                    )}
                                    <div className={cn("w-2 h-2 rounded-full",
                                        task.priority === 'critical' ? 'bg-red-500' :
                                            task.priority === 'high' ? 'bg-orange-500' :
                                                task.priority === 'medium' ? 'bg-yellow-500' : 'bg-slate-300'
                                    )} />
                                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 w-20 text-center">
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => openCreateTask('todo')}
                            className="w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-dashed border-transparent hover:border-indigo-200"
                        >
                            <Plus className="w-3 h-3" />
                            Create Issue in Backlog
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
