import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    CheckSquare,
    AlignLeft,
    Trash2,
    Plus,
    X,
    Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { JobApplication, JobTask, DOCUMENT_TYPES } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

interface JobContentAreaProps {
    application: JobApplication;
    onUpdate: (data: Partial<JobApplication>) => void;
    // Task handlers
    onAddTask: (task: Partial<JobTask>) => void;
    onUpdateTask: (id: string, data: Partial<JobTask>) => void;
    onDeleteTask: (id: string) => void;
    // Document handlers
    onAddDocument: () => void;
    onRemoveDocument: (id: string) => void;
}

export function JobContentArea({
    application,
    onUpdate,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
    onAddDocument,
    onRemoveDocument
}: JobContentAreaProps) {
    const [activeTab, setActiveTab] = useState<'notes' | 'tasks' | 'documents' | 'description'>('description'); // Default to description as it's important
    const [notes, setNotes] = useState(application.notes || '');
    const [jobDescription, setJobDescription] = useState(application.jobDescription || '');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');

    const tabs = [
        { id: 'description', label: 'Job Description', icon: Briefcase, count: undefined },
        { id: 'notes', label: 'Notes & Strategy', icon: AlignLeft, count: undefined },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: application.tasks?.length },
        { id: 'documents', label: 'Documents', icon: FileText, count: application.documents?.length },
    ] as const;

    const handleSaveNotes = () => {
        onUpdate({ notes });
    };

    const handleSaveDescription = () => {
        onUpdate({ jobDescription });
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        onAddTask({
            title: newTaskTitle,
            priority: 'medium',
            status: 'pending',
            dueDate: newTaskDate || undefined
        });
        setNewTaskTitle('');
        setNewTaskDate('');
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative",
                            activeTab === tab.id
                                ? "bg-white text-sky-700 shadow-sm ring-1 ring-gray-200"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="p-6 flex-1">
                <AnimatePresence mode="wait">
                    {activeTab === 'notes' && (
                        <motion.div
                            key="notes"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full flex flex-col"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-medium text-gray-900">Personal Notes</h3>
                                <Button
                                    size="sm"
                                    onClick={handleSaveNotes}
                                    disabled={notes === application.notes}
                                    className={cn(
                                        "transition-all",
                                        notes !== application.notes ? "bg-sky-600 hover:bg-sky-700" : "bg-gray-100 text-gray-400 hover:bg-gray-100"
                                    )}
                                >
                                    Save Changes
                                </Button>
                            </div>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Write down interview notes, questions to ask, or application details..."
                                className="flex-1 resize-none text-base leading-relaxed p-4 bg-gray-50 border-gray-100 focus:bg-white transition-colors"
                            />
                        </motion.div>
                    )}

                    {activeTab === 'tasks' && (
                        <motion.div
                            key="tasks"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Add a new task..."
                                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                                />
                                <input
                                    type="date"
                                    value={newTaskDate}
                                    onChange={(e) => setNewTaskDate(e.target.value)}
                                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                                />
                                <Button type="submit" disabled={!newTaskTitle.trim()}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add
                                </Button>
                            </form>

                            <div className="space-y-2">
                                {application.tasks?.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No tasks yet</p>
                                    </div>
                                ) : (
                                    application.tasks?.map(task => (
                                        <div
                                            key={task.id}
                                            className="group flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
                                        >
                                            <button
                                                onClick={() => onUpdateTask(task.id, {
                                                    status: task.status === 'completed' ? 'pending' : 'completed'
                                                })}
                                                className={cn(
                                                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                                    task.status === 'completed'
                                                        ? "bg-sky-500 border-sky-500 text-white"
                                                        : "border-gray-300 hover:border-sky-500 bg-white"
                                                )}
                                            >
                                                {task.status === 'completed' && <CheckSquare className="w-3 h-3" />}
                                            </button>
                                            <span className={cn(
                                                "flex-1 font-medium transition-colors",
                                                task.status === 'completed' ? "text-gray-400 line-through" : "text-gray-700"
                                            )}>
                                                {task.title}
                                            </span>
                                            <button
                                                onClick={() => onDeleteTask(task.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'documents' && (
                        <motion.div
                            key="documents"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-medium text-gray-900">Attached Documents</h3>
                                <Button variant="outline" size="sm" onClick={onAddDocument}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Upload
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {application.documents?.length === 0 ? (
                                    <div className="col-span-full text-center py-12 text-gray-400">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No documents attached</p>
                                    </div>
                                ) : (
                                    application.documents?.map(doc => (
                                        <div
                                            key={doc.id}
                                            className="group relative p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-sky-200 hover:bg-sky-50 transition-all"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-red-500">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate pr-6">{doc.label || 'Untitled'}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {DOCUMENT_TYPES.find(t => t.value === doc.documentType)?.label || doc.documentType}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => onRemoveDocument(doc.id)}
                                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                    {activeTab === 'description' && (
                        <motion.div
                            key="description"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full flex flex-col"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-medium text-gray-900">Job Description</h3>
                                <Button
                                    size="sm"
                                    onClick={handleSaveDescription}
                                    disabled={jobDescription === application.jobDescription}
                                    className={cn(
                                        "transition-all",
                                        jobDescription !== application.jobDescription ? "bg-sky-600 hover:bg-sky-700" : "bg-gray-100 text-gray-400 hover:bg-gray-100"
                                    )}
                                >
                                    Save Changes
                                </Button>
                            </div>
                            <Textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the job description here..."
                                className="flex-1 resize-none text-base leading-relaxed p-4 bg-gray-50 border-gray-100 focus:bg-white transition-colors min-h-[400px]"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
