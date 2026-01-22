import { useMemo } from 'react';
import { NexusTask } from '@/lib/nexus-api';
import { useNexusStore } from '@/stores/nexus.store';
import { format, isSameDay, addDays, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface NexusTimelineViewProps {
    tasks: NexusTask[];
}

export function NexusTimelineView({ tasks }: NexusTimelineViewProps) {
    const { setActiveTask } = useNexusStore();

    // Group tasks by date (if due date exists, else backlog)
    const tasksByDate = useMemo(() => {
        const grouped: Record<string, NexusTask[]> = {};
        const backlog: NexusTask[] = [];

        tasks.forEach(task => {
            if (task.dueDate) {
                const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
                if (!grouped[dateKey]) grouped[dateKey] = [];
                grouped[dateKey].push(task);
            } else {
                backlog.push(task);
            }
        });

        return { grouped, backlog };
    }, [tasks]);

    // Generate next 14 days for the view
    const days = useMemo(() => {
        const start = new Date();
        const end = addDays(start, 13);
        return eachDayOfInterval({ start, end });
    }, []);

    return (
        <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Timeline Header */}
            <div className="flex border-b border-slate-200 divide-x divide-slate-100">
                <div className="w-64 p-4 font-semibold text-slate-700 bg-slate-50 flex-shrink-0">
                    Unscheduled ({tasksByDate.backlog.length})
                </div>
                <div className="flex-1 flex overflow-x-auto hide-scrollbar">
                    {days.map(day => (
                        <div key={day.toISOString()} className="w-48 p-3 text-center flex-shrink-0 border-r border-slate-100 last:border-0">
                            <div className="text-xs font-semibold text-slate-500 uppercase">{format(day, 'EEE')}</div>
                            <div className={cn(
                                "text-sm font-bold",
                                isSameDay(day, new Date()) ? "text-indigo-600" : "text-slate-700"
                            )}>
                                {format(day, 'MMM d')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Backlog Sidebar */}
                <div className="w-64 border-r border-slate-200 bg-slate-50/50 p-4 overflow-y-auto flex-shrink-0">
                    <div className="space-y-3">
                        {tasksByDate.backlog.map(task => (
                            <div
                                key={task.id}
                                onClick={() => setActiveTask(task)}
                                className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 cursor-pointer transition-colors"
                            >
                                <div className="text-sm font-medium text-slate-900 truncate mb-1">{task.title}</div>
                                <div className="flex items-center gap-2">
                                    <span className={cn("inline-block w-2 h-2 rounded-full",
                                        task.priority === 'critical' ? 'bg-red-500' :
                                            task.priority === 'high' ? 'bg-orange-500' :
                                                task.priority === 'medium' ? 'bg-yellow-500' : 'bg-slate-300'
                                    )} />
                                    <span className="text-xs text-slate-500 capitalize">{task.status.replace('_', ' ')}</span>
                                </div>
                            </div>
                        ))}
                        {tasksByDate.backlog.length === 0 && (
                            <div className="text-xs text-center text-slate-400 py-4">
                                No unscheduled tasks
                            </div>
                        )}
                    </div>
                </div>

                {/* Days Columns */}
                <div className="flex-1 flex overflow-auto">
                    {days.map(day => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const daysTasks = tasksByDate.grouped[dateKey] || [];

                        return (
                            <div key={day.toISOString()} className="w-48 border-r border-slate-100 flex-shrink-0 p-3 space-y-3 min-h-full hover:bg-slate-50 transition-colors">
                                {daysTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => setActiveTask(task)}
                                        className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-indigo-500 hover:shadow-md cursor-pointer transition-all"
                                    >
                                        <div className="text-sm font-medium text-slate-900 line-clamp-2 mb-1">{task.title}</div>
                                        <div className="text-xs text-slate-500">
                                            {task.points ? `${task.points} pts` : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
