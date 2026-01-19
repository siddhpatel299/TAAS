import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckSquare,
    Plus,
    Trash2,
    Check,
    Circle,
    ListTodo,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel, HUDButton } from '@/components/hud/HUDComponents';
import { cn } from '@/lib/utils';

interface Todo {
    id: string;
    title: string;
    completed: boolean;
}

interface TodoList {
    id: string;
    name: string;
    todos: Todo[];
}

// Simple local state todo - full integration pending backend API
export function HUDTodoPage() {
    const [lists, setLists] = useState<TodoList[]>([
        { id: '1', name: 'General', todos: [] },
    ]);
    const [activeList, setActiveList] = useState<string>('1');
    const [newTodoText, setNewTodoText] = useState('');
    const [newListName, setNewListName] = useState('');
    const [showNewListInput, setShowNewListInput] = useState(false);

    const currentList = lists.find(l => l.id === activeList);

    const handleAddTodo = () => {
        if (!newTodoText.trim() || !activeList) return;
        setLists(prev => prev.map(list =>
            list.id === activeList
                ? { ...list, todos: [...list.todos, { id: Date.now().toString(), title: newTodoText.trim(), completed: false }] }
                : list
        ));
        setNewTodoText('');
    };

    const handleToggleTodo = (todoId: string) => {
        setLists(prev => prev.map(list =>
            list.id === activeList
                ? { ...list, todos: list.todos.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t) }
                : list
        ));
    };

    const handleDeleteTodo = (todoId: string) => {
        setLists(prev => prev.map(list =>
            list.id === activeList
                ? { ...list, todos: list.todos.filter(t => t.id !== todoId) }
                : list
        ));
    };

    const handleCreateList = () => {
        if (!newListName.trim()) return;
        const newList = { id: Date.now().toString(), name: newListName.trim(), todos: [] };
        setLists(prev => [...prev, newList]);
        setActiveList(newList.id);
        setNewListName('');
        setShowNewListInput(false);
    };

    const completedCount = currentList?.todos.filter(t => t.completed).length || 0;
    const totalCount = currentList?.todos.length || 0;

    return (
        <HUDLayout>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <CheckSquare className="w-10 h-10 text-green-400" style={{ filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))' }} />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold text-cyan-400 tracking-wide" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                                TASK MANAGER
                            </h1>
                            <p className="text-cyan-600/70 mt-1 font-mono">
                                {lists.length} lists • {lists.reduce((acc, l) => acc + l.todos.length, 0)} tasks
                            </p>
                        </div>
                    </div>

                    <HUDButton variant="primary" onClick={() => setShowNewListInput(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New List
                    </HUDButton>
                </div>

                <motion.div
                    className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-green-500 to-transparent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1 }}
                />
            </motion.div>

            {/* New list input */}
            {showNewListInput && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <HUDPanel className="p-4" glow>
                        <div className="flex items-center gap-3">
                            <ListTodo className="w-5 h-5 text-cyan-400" />
                            <input
                                type="text"
                                placeholder="List name..."
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                                className="hud-input flex-1"
                                autoFocus
                            />
                            <HUDButton variant="primary" onClick={handleCreateList}>Create</HUDButton>
                            <button
                                onClick={() => { setShowNewListInput(false); setNewListName(''); }}
                                className="p-2 text-cyan-600 hover:text-red-400"
                            >
                                ×
                            </button>
                        </div>
                    </HUDPanel>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Lists sidebar */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <HUDPanel className="p-4">
                        <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ListTodo className="w-4 h-4" />
                            Lists
                        </h3>
                        <div className="space-y-2">
                            {lists.map((list) => {
                                const done = list.todos.filter(t => t.completed).length;
                                const total = list.todos.length;
                                return (
                                    <button
                                        key={list.id}
                                        onClick={() => setActiveList(list.id)}
                                        className={cn(
                                            "w-full p-3 rounded-lg text-left transition-all flex items-center justify-between",
                                            activeList === list.id
                                                ? "bg-cyan-500/20 border border-cyan-500/50"
                                                : "border border-transparent hover:border-cyan-500/30 hover:bg-cyan-500/10"
                                        )}
                                    >
                                        <span className="text-cyan-200">{list.name}</span>
                                        <span className="text-xs text-cyan-600 font-mono">{done}/{total}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </HUDPanel>
                </motion.div>

                {/* Active list */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-3"
                >
                    {currentList ? (
                        <HUDPanel className="p-6">
                            {/* List header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-cyan-300">{currentList.name}</h2>
                                    <p className="text-sm text-cyan-600 font-mono">
                                        {completedCount} of {totalCount} completed
                                    </p>
                                </div>
                                {/* Progress bar */}
                                {totalCount > 0 && (
                                    <div className="w-32">
                                        <div className="h-2 bg-cyan-900/30 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-green-500 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Add todo input */}
                            <div className="flex items-center gap-3 mb-6">
                                <input
                                    type="text"
                                    placeholder="Add a task..."
                                    value={newTodoText}
                                    onChange={(e) => setNewTodoText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                                    className="hud-input flex-1"
                                />
                                <HUDButton variant="primary" onClick={handleAddTodo}>
                                    <Plus className="w-4 h-4" />
                                </HUDButton>
                            </div>

                            {/* Todos */}
                            <div className="space-y-2">
                                {currentList.todos.map((todo, index) => (
                                    <motion.div
                                        key={todo.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border transition-all group",
                                            todo.completed
                                                ? "border-green-500/30 bg-green-500/5"
                                                : "border-cyan-500/20 hover:border-cyan-500/40"
                                        )}
                                    >
                                        <button
                                            onClick={() => handleToggleTodo(todo.id)}
                                            className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                todo.completed
                                                    ? "border-green-500 bg-green-500"
                                                    : "border-cyan-500/50 hover:border-cyan-400"
                                            )}
                                        >
                                            {todo.completed && <Check className="w-4 h-4 text-white" />}
                                        </button>
                                        <span className={cn(
                                            "flex-1",
                                            todo.completed ? "text-cyan-600 line-through" : "text-cyan-200"
                                        )}>
                                            {todo.title}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteTodo(todo.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))}
                                {currentList.todos.length === 0 && (
                                    <div className="text-center py-12">
                                        <Circle className="w-12 h-12 mx-auto mb-4 text-cyan-700" />
                                        <p className="text-cyan-600">No tasks yet</p>
                                        <p className="text-sm text-cyan-700 mt-1">Add a task above</p>
                                    </div>
                                )}
                            </div>
                        </HUDPanel>
                    ) : (
                        <HUDPanel className="p-8 text-center">
                            <ListTodo className="w-12 h-12 mx-auto mb-4 text-cyan-600" />
                            <p className="text-cyan-400 mb-2">Select or create a list</p>
                        </HUDPanel>
                    )}
                </motion.div>
            </div>
        </HUDLayout>
    );
}
