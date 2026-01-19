import { useState } from 'react';
import { CheckSquare, Plus, Trash2, Check } from 'lucide-react';
import { MidnightLayout } from '@/layouts/MidnightLayout';
import { MidnightCard, MidnightHeader, MidnightButton, MidnightEmpty, MidnightBadge } from '@/components/midnight/MidnightComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function MidnightTodoPage() {
    const [lists, setLists] = useState<TodoList[]>([
        { id: '1', name: 'Personal', tasks: [{ id: '1', text: 'Sample task', completed: false }] },
    ]);
    const [selectedListId, setSelectedListId] = useState<string>('1');
    const [newTask, setNewTask] = useState('');
    const [newListName, setNewListName] = useState('');

    const selectedList = lists.find(l => l.id === selectedListId);

    const addTask = () => {
        if (!newTask.trim() || !selectedList) return;
        const task: Task = { id: Date.now().toString(), text: newTask.trim(), completed: false };
        setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: [...l.tasks, task] } : l));
        setNewTask('');
    };

    const toggleTask = (taskId: string) => {
        setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) } : l));
    };

    const deleteTask = (taskId: string) => {
        setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l));
    };

    const addList = () => {
        if (!newListName.trim()) return;
        const list: TodoList = { id: Date.now().toString(), name: newListName.trim(), tasks: [] };
        setLists([...lists, list]);
        setSelectedListId(list.id);
        setNewListName('');
    };

    const completedCount = selectedList?.tasks.filter(t => t.completed).length || 0;
    const totalCount = selectedList?.tasks.length || 0;

    return (
        <MidnightLayout>
            <MidnightHeader title="Todo Lists" subtitle="Manage your tasks" />

            <div className="midnight-grid" style={{ gridTemplateColumns: '280px 1fr' }}>
                {/* Sidebar */}
                <MidnightCard className="!p-0 overflow-hidden">
                    <div className="p-4 border-b border-[var(--midnight-border)]">
                        <div className="flex gap-2">
                            <input type="text" placeholder="New list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="midnight-input !py-2 flex-1" />
                            <MidnightButton onClick={addList}><Plus className="w-4 h-4" /></MidnightButton>
                        </div>
                    </div>
                    {lists.map(list => (
                        <button key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("w-full text-left p-4 border-b border-[var(--midnight-border)] flex items-center justify-between", selectedListId === list.id ? "bg-[rgba(212,175,55,0.1)]" : "hover:bg-[var(--midnight-surface-hover)]")}>
                            <span className={cn("font-medium", selectedListId === list.id && "text-[var(--midnight-gold)]")}>{list.name}</span>
                            <MidnightBadge variant={selectedListId === list.id ? 'gold' : 'default'}>{list.tasks.length}</MidnightBadge>
                        </button>
                    ))}
                </MidnightCard>

                {/* Tasks */}
                <MidnightCard>
                    {selectedList && (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold">{selectedList.name}</h2>
                                    <p className="text-sm text-[var(--midnight-text-dim)]">{completedCount}/{totalCount} completed</p>
                                </div>
                                <div className="h-2 w-32 bg-[var(--midnight-surface)] rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--midnight-gold)] rounded-full transition-all" style={{ width: totalCount ? `${(completedCount / totalCount) * 100}%` : '0%' }} />
                                </div>
                            </div>

                            <div className="flex gap-3 mb-6">
                                <input type="text" placeholder="Add a task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="midnight-input flex-1" />
                                <MidnightButton variant="primary" onClick={addTask}><Plus className="w-4 h-4 mr-2" /> Add</MidnightButton>
                            </div>

                            {selectedList.tasks.length === 0 ? (
                                <MidnightEmpty icon={<CheckSquare className="w-8 h-8" />} text="No tasks yet" />
                            ) : (
                                <div className="space-y-2">
                                    {selectedList.tasks.map(task => (
                                        <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--midnight-surface)] group">
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all", task.completed ? "bg-[var(--midnight-gold)] border-[var(--midnight-gold)]" : "border-[var(--midnight-border)]")}>
                                                {task.completed && <Check className="w-4 h-4 text-[var(--midnight-bg)]" />}
                                            </button>
                                            <span className={cn("flex-1", task.completed && "line-through text-[var(--midnight-text-dim)]")}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-[var(--midnight-error)]"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </MidnightCard>
            </div>
        </MidnightLayout>
    );
}
