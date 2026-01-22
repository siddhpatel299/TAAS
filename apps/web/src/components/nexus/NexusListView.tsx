import { useMemo } from 'react';
import { NexusTask } from '@/lib/nexus-api';
import { useNexusStore } from '@/stores/nexus.store';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface NexusListViewProps {
    tasks: NexusTask[];
    projectId: string;
}

export function NexusListView({ tasks }: Omit<NexusListViewProps, 'projectId'>) {
    const { setActiveTask } = useNexusStore();

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => a.position - b.position);
    }, [tasks]);

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'critical': return <ArrowUp className="w-4 h-4 text-red-600" />;
            case 'high': return <ArrowUp className="w-4 h-4 text-orange-500" />;
            case 'medium': return <Minus className="w-4 h-4 text-yellow-500" />;
            case 'low': return <ArrowDown className="w-4 h-4 text-slate-400" />;
            default: return <Minus className="w-4 h-4 text-slate-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done': return 'bg-green-100 text-green-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'todo': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                        <th className="px-6 py-4">Task</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Priority</th>
                        <th className="px-6 py-4">Points</th>
                        <th className="px-6 py-4">Due Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {sortedTasks.map(task => (
                        <tr
                            key={task.id}
                            onClick={() => setActiveTask(task)}
                            className="hover:bg-slate-50 cursor-pointer transition-colors group"
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {task.title}
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono">
                                        #{task.id.substring(task.id.length - 4)}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", getStatusColor(task.status))}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2" title={task.priority}>
                                    {getPriorityIcon(task.priority)}
                                    <span className="capitalize text-slate-600">{task.priority}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {task.points ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-mono text-xs">
                                        {task.points}
                                    </span>
                                ) : (
                                    <span className="text-slate-300">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                                {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                            </td>
                        </tr>
                    ))}
                    {sortedTasks.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                No tasks found in this project. Create one to get started!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
