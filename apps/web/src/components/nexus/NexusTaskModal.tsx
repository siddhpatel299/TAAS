import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNexusStore } from '@/stores/nexus.store';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function NexusTaskModal() {
    const { activeTask, setActiveTask, updateTask, deleteTask } = useNexusStore();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [points, setPoints] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (activeTask) {
            setTitle(activeTask.title);
            setDescription(activeTask.description || '');
            setPoints(activeTask.points);
        }
    }, [activeTask]);

    if (!activeTask) return null;

    const handleSave = async () => {
        if (!activeTask) return;
        await updateTask(activeTask.id, {
            title,
            description,
            points
        });
        setActiveTask(null);
    };

    const handleDelete = async () => {
        if (!activeTask || !confirm('Are you sure you want to delete this task?')) return;
        await deleteTask(activeTask.id);
        setActiveTask(null);
    };

    const priorities = [
        { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
        { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
        { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
        { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' }
    ];

    const statuses = [
        { value: 'todo', label: 'To Do', icon: AlertCircle },
        { value: 'in_progress', label: 'In Progress', icon: CheckCircle2 },
        { value: 'done', label: 'Done', icon: CheckCircle2 }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setActiveTask(null)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-mono">
                            <span className="bg-slate-100 px-2 py-0.5 rounded">
                                {activeTask.sprintId ? 'SPRINT-' + activeTask.sprintId.substring(0, 4) : 'BACKLOG'}
                            </span>
                            <span>/</span>
                            <span>TASK-{activeTask.id.substring(activeTask.id.length - 4)}</span>
                        </div>
                        <button
                            onClick={() => setActiveTask(null)}
                            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Title Section */}
                        <div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-2xl font-bold text-slate-900 border-none focus:ring-0 p-0 placeholder:text-slate-300"
                                placeholder="Task title"
                            />
                        </div>

                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Main Content */}
                            <div className="flex-1 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={6}
                                        className="w-full text-sm text-slate-600 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        placeholder="Add more details to this task..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Activity</label>
                                    <div className="text-sm text-slate-500 italic">
                                        Created {format(new Date(activeTask.createdAt), 'PPT')}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Options */}
                            <div className="w-full md:w-64 space-y-6">
                                {/* Status */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                                    <select
                                        value={activeTask.status}
                                        onChange={(e) => updateTask(activeTask.id, { status: e.target.value as any })}
                                        className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500"
                                    >
                                        {statuses.map(status => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                                    <div className="flex flex-wrap gap-2">
                                        {priorities.map(p => (
                                            <button
                                                key={p.value}
                                                onClick={() => updateTask(activeTask.id, { priority: p.value as any })}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs font-medium rounded-md border transition-all",
                                                    activeTask.priority === p.value
                                                        ? p.color + " border-transparent ring-2 ring-offset-1 ring-indigo-500"
                                                        : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                                                )}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Points */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Story Points</label>
                                    <input
                                        type="number"
                                        value={points ?? ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setPoints(isNaN(val) ? undefined : val);
                                        }}
                                        onBlur={() => updateTask(activeTask.id, { points })}
                                        className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500"
                                        placeholder="Points..."
                                    />
                                </div>

                                {/* Dates */}
                                {activeTask.dueDate && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Due Date</label>
                                        <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {format(new Date(activeTask.dueDate), 'PPP')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Task
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActiveTask(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
