import { useState } from 'react';
import { CheckSquare, Plus, Trash2, Check } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalButton, TerminalEmpty } from '@/components/terminal/TerminalComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function TerminalTodoPage() {
    const [lists, setLists] = useState<TodoList[]>([
        { id: '1', name: 'WORK', tasks: [{ id: '1', text: 'Review pull requests', completed: true }, { id: '2', text: 'Update documentation', completed: false }] },
        { id: '2', name: 'PERSONAL', tasks: [{ id: '3', text: 'Call mom', completed: false }] },
    ]);
    const [selectedList, setSelectedList] = useState<string>('1');
    const [newTask, setNewTask] = useState('');

    const currentList = lists.find(l => l.id === selectedList);

    const addTask = () => {
        if (!newTask.trim() || !currentList) return;
        const updated = lists.map(l => l.id === selectedList ? { ...l, tasks: [...l.tasks, { id: Date.now().toString(), text: newTask.trim(), completed: false }] } : l);
        setLists(updated);
        setNewTask('');
    };

    const toggleTask = (taskId: string) => {
        const updated = lists.map(l => l.id === selectedList ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) } : l);
        setLists(updated);
    };

    const deleteTask = (taskId: string) => {
        const updated = lists.map(l => l.id === selectedList ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l);
        setLists(updated);
    };

    const completed = currentList?.tasks.filter(t => t.completed).length || 0;
    const total = currentList?.tasks.length || 0;

    return (
        <TerminalLayout>
            <TerminalHeader title="Todo Lists" subtitle={currentList ? `${completed}/${total} complete` : ''} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Lists */}
                <TerminalPanel title="Lists">
                    {lists.map(list => (
                        <button
                            key={list.id}
                            onClick={() => setSelectedList(list.id)}
                            className={cn("w-full text-left p-2 text-xs border-b border-[var(--terminal-border)] transition-colors", selectedList === list.id ? "bg-[rgba(255,176,0,0.1)] text-[var(--terminal-amber)]" : "hover:bg-[var(--terminal-dark)]")}
                        >
                            <span className="font-bold">{list.name}</span>
                            <span className="ml-2 text-[var(--terminal-text-dim)]">({list.tasks.filter(t => !t.completed).length})</span>
                        </button>
                    ))}
                </TerminalPanel>

                {/* Tasks */}
                <div className="lg:col-span-3">
                    <TerminalPanel title={currentList?.name || 'SELECT LIST'}>
                        {/* Add Task */}
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[var(--terminal-border)]">
                            <input type="text" placeholder="New task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="terminal-input flex-1 !py-1" />
                            <TerminalButton variant="primary" onClick={addTask}><Plus className="w-3 h-3 mr-1" /> Add</TerminalButton>
                        </div>

                        {currentList?.tasks.length === 0 ? (
                            <TerminalEmpty icon={<CheckSquare className="w-full h-full" />} text="No tasks" />
                        ) : (
                            <div>
                                {currentList?.tasks.map(task => (
                                    <div key={task.id} className={cn("flex items-center gap-3 p-2 border-b border-[var(--terminal-border)]", task.completed && "opacity-50")}>
                                        <button onClick={() => toggleTask(task.id)} className={cn("w-4 h-4 border flex items-center justify-center", task.completed ? "border-[var(--terminal-green)] bg-[var(--terminal-green)]" : "border-[var(--terminal-border)]")}>
                                            {task.completed && <Check className="w-3 h-3 text-black" />}
                                        </button>
                                        <span className={cn("flex-1 text-xs", task.completed && "line-through")}>{task.text}</span>
                                        <button onClick={() => deleteTask(task.id)} className="p-1 text-[var(--terminal-red)]"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TerminalPanel>
                </div>
            </div>
        </TerminalLayout>
    );
}
