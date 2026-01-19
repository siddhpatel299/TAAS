import { useState } from 'react';
import { CheckSquare, Plus, Trash2, Check } from 'lucide-react';
import { OrigamiLayout } from '@/layouts/OrigamiLayout';
import { OrigamiCard, OrigamiHeader, OrigamiButton, OrigamiEmpty, OrigamiBadge } from '@/components/origami/OrigamiComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function OrigamiTodoPage() {
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
        <OrigamiLayout>
            <OrigamiHeader title="Todo Lists" subtitle="Organize your tasks" />

            <div className="grid gap-6" style={{ gridTemplateColumns: '280px 1fr' }}>
                {/* Sidebar */}
                <OrigamiCard className="!p-0 overflow-hidden">
                    <div className="p-4 border-b border-[var(--origami-crease)]">
                        <div className="flex gap-2">
                            <input type="text" placeholder="New list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="origami-input !py-2 flex-1" />
                            <OrigamiButton onClick={addList}><Plus className="w-4 h-4" /></OrigamiButton>
                        </div>
                    </div>
                    {lists.map(list => (
                        <button key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("w-full text-left p-4 border-b border-[var(--origami-crease)] flex items-center justify-between", selectedListId === list.id ? "bg-[var(--origami-bg)]" : "hover:bg-[var(--origami-bg)]")}>
                            <span className={cn("font-medium", selectedListId === list.id && "text-[var(--origami-terracotta)]")}>{list.name}</span>
                            <OrigamiBadge variant={selectedListId === list.id ? 'terracotta' : 'default'}>{list.tasks.length}</OrigamiBadge>
                        </button>
                    ))}
                </OrigamiCard>

                {/* Tasks */}
                <OrigamiCard>
                    {selectedList && (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-medium">{selectedList.name}</h2>
                                    <p className="text-sm text-[var(--origami-text-dim)]">{completedCount}/{totalCount} completed</p>
                                </div>
                                <div className="h-2 w-32 bg-[var(--origami-bg)] rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--origami-terracotta)] rounded-full transition-all" style={{ width: totalCount ? `${(completedCount / totalCount) * 100}%` : '0%' }} />
                                </div>
                            </div>

                            <div className="flex gap-3 mb-6">
                                <input type="text" placeholder="Add a task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="origami-input flex-1" />
                                <OrigamiButton variant="primary" onClick={addTask}><Plus className="w-4 h-4 mr-2" /> Add</OrigamiButton>
                            </div>

                            {selectedList.tasks.length === 0 ? (
                                <OrigamiEmpty icon={<CheckSquare className="w-8 h-8" />} text="No tasks yet" />
                            ) : (
                                <div className="space-y-2">
                                    {selectedList.tasks.map(task => (
                                        <div key={task.id} className="flex items-center gap-3 p-4 border border-[var(--origami-crease)] rounded group">
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-5 h-5 rounded border flex items-center justify-center transition-all", task.completed ? "bg-[var(--origami-terracotta)] border-[var(--origami-terracotta)]" : "border-[var(--origami-crease)]")}>
                                                {task.completed && <Check className="w-3 h-3 text-white" />}
                                            </button>
                                            <span className={cn("flex-1", task.completed && "line-through text-[var(--origami-text-dim)]")}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-[var(--origami-error)]"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </OrigamiCard>
            </div>
        </OrigamiLayout>
    );
}
