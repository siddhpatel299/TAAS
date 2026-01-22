import { useDraggable } from '@dnd-kit/core';
import { NexusTask } from '@/lib/nexus-api';
import { Calendar, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface NexusTaskCardProps {
    task: NexusTask;
    onClick: () => void;
}

const priorityColors = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-blue-50 text-blue-600',
    high: 'bg-orange-50 text-orange-600',
    critical: 'bg-red-50 text-red-600'
};

export function NexusTaskCard({ task, onClick }: NexusTaskCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { type: 'Task', task }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={cn(
                "bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors group relative",
                isDragging && "opacity-50"
            )}
        >
            {/* Labels */}
            <div className="flex flex-wrap gap-1.5 mb-2">
                {task.labels?.map((l) => (
                    <div
                        key={l.label.id}
                        className="h-1.5 w-6 rounded-full"
                        style={{ backgroundColor: l.label.color }}
                        title={l.label.name}
                    />
                ))}
            </div>

            <h4 className="text-sm font-medium text-slate-800 mb-1 leading-snug group-hover:text-indigo-600 transition-colors">
                {task.title}
            </h4>

            {/* Quick Indicators */}
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                {task.dueDate && (
                    <div className={cn(
                        "flex items-center gap-1",
                        new Date(task.dueDate) < new Date() ? "text-red-500" : ""
                    )}>
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.dueDate), 'MMM d')}
                    </div>
                )}

                {(task._count?.subtasks || 0) > 0 && (
                    <div className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />
                        {task._count?.subtasks}
                    </div>
                )}

                {task.points && (
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                        {task.points}
                    </div>
                )}

                <div className={cn("ml-auto px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider", priorityColors[task.priority])}>
                    {task.priority}
                </div>
            </div>
        </div>
    );
}
