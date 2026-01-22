import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNexusStore } from '@/stores/nexus.store';
import { NexusTask } from '@/lib/nexus-api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function NexusTaskModal() {
    const {
        activeTask, setActiveTask, updateTask, deleteTask, newTaskInput, createTask, closeCreateTask,
        activeTaskComments, activeTaskActivity, createComment
    } = useNexusStore();

    // Local state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
    const [newComment, setNewComment] = useState('');
    const [points, setPoints] = useState<number | undefined>(undefined);
    const [priority, setPriority] = useState<NexusTask['priority']>('medium');
    const [status, setStatus] = useState<NexusTask['status']>('todo');
    const [epicId, setEpicId] = useState<string | null>(null);
    const [sprintId, setSprintId] = useState<string | null>(null);

    const { currentProject } = useNexusStore();
    const epics = currentProject?.epics || [];
    const sprints = currentProject?.sprints || [];

    // Determine mode
    const isEditing = !!activeTask;
    const isCreating = !!newTaskInput;
    const isOpen = isEditing || isCreating;

    useEffect(() => {
        if (activeTask) {
            setTitle(activeTask.title);
            setDescription(activeTask.description || '');
            setPoints(activeTask.points);
            setPriority(activeTask.priority);
            setStatus(activeTask.status);
            setEpicId(activeTask.epicId || null);
            setSprintId(activeTask.sprintId || null);
            setActiveTab('details');
        } else if (newTaskInput) {
            setTitle('');
            setDescription('');
            setPoints(undefined);
            setPriority('medium');
            setStatus(newTaskInput.status as NexusTask['status']);
            setEpicId(null);
            setSprintId(null); // Could pre-fill if created from Sprint Board
        }
    }, [activeTask, newTaskInput]);

    if (!isOpen) return null;

    const handleClose = () => {
        if (isEditing) setActiveTask(null);
        if (isCreating) closeCreateTask();
    };

    const handleSave = async () => {
        if (!title.trim()) return;

        if (isEditing && activeTask) {
            await updateTask(activeTask.id, {
                title,
                description,
                points,
                priority: priority as any,
                status: status as any,
                epicId: epicId || undefined,
                sprintId: sprintId || undefined
            });
            handleClose();
        } else if (isCreating && newTaskInput) {
            await createTask(newTaskInput.projectId, {
                title,
                description,
                points,
                priority,
                status,
                epicId: epicId || undefined,
                sprintId: sprintId || undefined
            });
            handleClose();
        }
    };

    const handleDelete = async () => {
        if (!isEditing || !activeTask || !confirm('Are you sure you want to delete this task?')) return;
        await deleteTask(activeTask.id);
        handleClose();
    };

    const handleSendComment = async () => {
        if (!newComment.trim() || !activeTask) return;
        await createComment(activeTask.id, newComment);
        setNewComment('');
    };

    const priorities = [
        { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
        { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
        { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
        { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' }
    ];

    const statuses = [
        { value: 'todo', label: 'To Do', icon: AlertCircle },
        { value: 'in_progress', label: 'In Progress', icon: CheckCircle2 },
        { value: 'done', label: 'Done', icon: CheckCircle2 },
        { value: 'blocked', label: 'Blocked', icon: AlertCircle },
        { value: 'backlog', label: 'Backlog', icon: AlertCircle }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
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
                            {isEditing ? (
                                <>
                                    <span className="bg-slate-100 px-2 py-0.5 rounded">
                                        {activeTask.sprintId ? 'SPRINT-' + activeTask.sprintId.substring(0, 4) : 'BACKLOG'}
                                    </span>
                                    <span>/</span>
                                    <span>TASK-{activeTask.id.substring(activeTask.id.length - 4)}</span>
                                </>
                            ) : (
                                <span className="font-semibold text-indigo-600">New Task</span>
                            )}
                        </div>
                        <button
                            onClick={handleClose}
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
                                autoFocus={isCreating}
                            />
                        </div>

                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Main Content */}
                            <div className="flex-1 space-y-6">
                                {/* Tabs */}
                                {isEditing && (
                                    <div className="flex items-center gap-6 border-b border-slate-200">
                                        <button
                                            onClick={() => setActiveTab('details')}
                                            className={cn(
                                                "pb-3 text-sm font-medium transition-colors relative",
                                                activeTab === 'details' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            Details
                                            {activeTab === 'details' && (
                                                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('activity')}
                                            className={cn(
                                                "pb-3 text-sm font-medium transition-colors relative",
                                                activeTab === 'activity' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            Activity
                                            {activeTab === 'activity' && (
                                                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                                            )}
                                        </button>
                                    </div>
                                )}

                                {activeTab === 'details' ? (
                                    <>
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

                                        {isEditing && activeTask && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Metadata</label>
                                                <div className="text-sm text-slate-500 flex gap-4">
                                                    <span>Created {format(new Date(activeTask.createdAt), 'PPP')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="space-y-6">
                                        {/* New Comment */}
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                                                ME
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <textarea
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    placeholder="Leave a comment..."
                                                    rows={3}
                                                    className="w-full text-sm border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendComment();
                                                        }
                                                    }}
                                                />
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={handleSendComment}
                                                        disabled={!newComment.trim()}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                    >
                                                        Comment
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activity List */}
                                        <div className="space-y-4">
                                            {/* Combine comments and activity sorted by date if needed. For now just listing. */}
                                            {[...activeTaskComments, ...activeTaskActivity]
                                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                .map((item: any) => (
                                                    <div key={item.id} className="flex gap-3 text-sm">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-xs">
                                                            {item.user?.avatarUrl ? (
                                                                <img src={item.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="font-medium text-slate-500">{(item.user?.firstName?.[0] || 'U')}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-slate-900">
                                                                    {item.user?.firstName || 'Unknown'} {item.user?.lastName || ''}
                                                                </span>
                                                                <span className="text-slate-400 text-xs">
                                                                    {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                                                                </span>
                                                            </div>
                                                            {'type' in item ? (
                                                                <div className="text-slate-500 italic">
                                                                    {item.content}
                                                                </div>
                                                            ) : (
                                                                <div className="text-slate-700 whitespace-pre-wrap">
                                                                    {item.content}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Options */}
                            <div className="w-full md:w-64 space-y-6">
                                {/* Status */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => {
                                            setStatus(e.target.value as NexusTask['status']);
                                            if (isEditing) updateTask(activeTask.id, { status: e.target.value as any });
                                        }}
                                        className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500"
                                    >
                                        {statuses.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
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
                                                onClick={() => {
                                                    setPriority(p.value as NexusTask['priority']);
                                                    if (isEditing) updateTask(activeTask.id, { priority: p.value as any });
                                                }}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs font-medium rounded-md border transition-all",
                                                    priority === p.value
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
                                        onBlur={() => {
                                            if (isEditing) updateTask(activeTask.id, { points });
                                        }}
                                        className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500"
                                        placeholder="Points..."
                                    />
                                </div>

                                {/* Epic & Sprint */}
                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sprint</label>
                                        <select
                                            value={sprintId || ''}
                                            onChange={(e) => {
                                                const val = e.target.value || null;
                                                setSprintId(val);
                                                if (isEditing) updateTask(activeTask.id, { sprintId: val || undefined });
                                            }}
                                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500"
                                        >
                                            <option value="">No Sprint</option>
                                            {sprints.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Epic</label>
                                        <select
                                            value={epicId || ''}
                                            onChange={(e) => {
                                                const val = e.target.value || null;
                                                setEpicId(val);
                                                if (isEditing) updateTask(activeTask.id, { epicId: val || undefined });
                                            }}
                                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500"
                                        >
                                            <option value="">No Epic</option>
                                            {epics.map(e => (
                                                <option key={e.id} value={e.id}>{e.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Dates */}
                                {isEditing && activeTask.dueDate && (
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
                        {isEditing ? (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Task
                            </button>
                        ) : (
                            <div /> // Spacer
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!title.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isCreating ? 'Create Task' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
