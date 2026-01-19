import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Plus, Trash2, Check, Leaf } from 'lucide-react';
import { ForestLayout } from '@/layouts/ForestLayout';
import { ForestCard, ForestPageHeader, ForestButton, ForestEmpty, ForestBadge, ForestDivider } from '@/components/forest/ForestComponents';
import { cn } from '@/lib/utils';

interface Task {
    id: string;
    title: string;
    completed: boolean;
}

interface TodoList {
    id: string;
    name: string;
    tasks: Task[];
}

export function ForestTodoPage() {
    const [lists, setLists] = useState<TodoList[]>([
        {
            id: '1', name: 'Personal', tasks: [
                { id: 't1', title: 'Morning walk', completed: true },
                { id: 't2', title: 'Read a book', completed: false },
            ]
        },
        {
            id: '2', name: 'Work', tasks: [
                { id: 't3', title: 'Review pull requests', completed: false },
                { id: 't4', title: 'Update documentation', completed: false },
            ]
        },
    ]);
    const [selectedListId, setSelectedListId] = useState<string | null>(lists[0]?.id || null);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const selectedList = lists.find(l => l.id === selectedListId);

    const toggleTask = (taskId: string) => {
        setLists(lists.map(list => ({
            ...list,
            tasks: list.tasks.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            ),
        })));
    };

    const addTask = () => {
        if (!newTaskTitle.trim() || !selectedListId) return;
        setLists(lists.map(list =>
            list.id === selectedListId
                ? { ...list, tasks: [...list.tasks, { id: Date.now().toString(), title: newTaskTitle, completed: false }] }
                : list
        ));
        setNewTaskTitle('');
    };

    const deleteTask = (taskId: string) => {
        setLists(lists.map(list => ({
            ...list,
            tasks: list.tasks.filter(task => task.id !== taskId),
        })));
    };

    const completedCount = selectedList?.tasks.filter(t => t.completed).length || 0;
    const totalCount = selectedList?.tasks.length || 0;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <ForestLayout>
            <ForestPageHeader
                title="Todo Lists"
                subtitle="Stay organized and productive"
                icon={<CheckSquare className="w-6 h-6" />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Lists Sidebar */}
                <div className="lg:col-span-1">
                    <ForestCard>
                        <h3 className="text-sm font-semibold text-[var(--forest-moss)] mb-3">Your Lists</h3>
                        <div className="space-y-2">
                            {lists.map((list) => {
                                const completed = list.tasks.filter(t => t.completed).length;
                                return (
                                    <button
                                        key={list.id}
                                        onClick={() => setSelectedListId(list.id)}
                                        className={cn(
                                            "w-full p-3 rounded-lg text-left transition-all",
                                            selectedListId === list.id
                                                ? "bg-[var(--forest-gradient-primary)] text-white"
                                                : "hover:bg-[rgba(74,124,89,0.1)]"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{list.name}</span>
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full",
                                                selectedListId === list.id ? "bg-white/20" : "bg-[rgba(74,124,89,0.1)]"
                                            )}>
                                                {completed}/{list.tasks.length}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </ForestCard>
                </div>

                {/* Tasks */}
                <div className="lg:col-span-3">
                    {selectedList ? (
                        <ForestCard>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-[var(--forest-moss)]">{selectedList.name}</h2>
                                    <p className="text-sm text-[var(--forest-wood)]">{progress}% complete</p>
                                </div>
                                <ForestBadge variant={progress === 100 ? 'success' : 'default'}>
                                    {completedCount} of {totalCount}
                                </ForestBadge>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 bg-[rgba(74,124,89,0.1)] rounded-full mb-6 overflow-hidden">
                                <motion.div
                                    className="h-full bg-[var(--forest-gradient-primary)] rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>

                            {/* Add task */}
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Add a new task..."
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                                    className="forest-input flex-1"
                                />
                                <ForestButton variant="primary" onClick={addTask}>
                                    <Plus className="w-4 h-4" />
                                </ForestButton>
                            </div>

                            <ForestDivider />

                            {/* Tasks list */}
                            <div className="space-y-2">
                                {selectedList.tasks.length === 0 ? (
                                    <ForestEmpty
                                        icon={<Leaf className="w-full h-full" />}
                                        title="No tasks yet"
                                        description="Add a task to get started"
                                    />
                                ) : (
                                    selectedList.tasks.map((task, index) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg transition-all",
                                                task.completed ? "bg-[rgba(104,180,104,0.1)]" : "hover:bg-[rgba(74,124,89,0.05)]"
                                            )}
                                        >
                                            <button
                                                onClick={() => toggleTask(task.id)}
                                                className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                                    task.completed
                                                        ? "bg-[var(--forest-success)] border-[var(--forest-success)]"
                                                        : "border-[var(--forest-leaf)]"
                                                )}
                                            >
                                                {task.completed && <Check className="w-4 h-4 text-white" />}
                                            </button>
                                            <span className={cn(
                                                "flex-1",
                                                task.completed ? "line-through text-[var(--forest-wood)]" : "text-[var(--forest-moss)]"
                                            )}>
                                                {task.title}
                                            </span>
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="p-1.5 rounded-lg hover:bg-[rgba(196,92,92,0.1)] text-[var(--forest-danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </ForestCard>
                    ) : (
                        <ForestCard>
                            <ForestEmpty
                                icon={<CheckSquare className="w-full h-full" />}
                                title="Select a list"
                                description="Choose a list from the sidebar to view tasks"
                            />
                        </ForestCard>
                    )}
                </div>
            </div>
        </ForestLayout>
    );
}
