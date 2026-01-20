import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { GlassLayout } from '@/layouts/GlassLayout';
import { GlassCard, GlassButton, GlassEmpty, GlassTitle, GlassBadge } from '@/components/glass/GlassComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function GlassTodoPage() {
    const [lists, setLists] = useState<TodoList[]>([{ id: '1', name: 'My Tasks', tasks: [{ id: '1', text: 'Sample task', completed: false }] }]);
    const [selectedListId, setSelectedListId] = useState<string>('1');
    const [newTask, setNewTask] = useState('');
    const [newListName, setNewListName] = useState('');

    const selectedList = lists.find(l => l.id === selectedListId);
    const addTask = () => { if (!newTask.trim() || !selectedList) return; setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: [...l.tasks, { id: Date.now().toString(), text: newTask.trim(), completed: false }] } : l)); setNewTask(''); };
    const toggleTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) } : l)); };
    const deleteTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l)); };
    const addList = () => { if (!newListName.trim()) return; const list: TodoList = { id: Date.now().toString(), name: newListName.trim(), tasks: [] }; setLists([...lists, list]); setSelectedListId(list.id); setNewListName(''); };

    const completedCount = selectedList?.tasks.filter(t => t.completed).length || 0;
    const totalCount = selectedList?.tasks.length || 0;

    return (
        <GlassLayout>
            <GlassTitle>Todo Lists</GlassTitle>
            <div className="grid grid-cols-4 gap-6">
                <div>
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="New list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="glass-input flex-1" />
                        <GlassButton variant="primary" onClick={addList}><Plus className="w-5 h-5" /></GlassButton>
                    </div>
                    <div className="space-y-2">
                        {lists.map(list => (
                            <GlassCard key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("flex items-center justify-between !p-4", selectedListId === list.id && "!bg-white/20")}>
                                <span className="font-medium">{list.name}</span>
                                <GlassBadge>{list.tasks.length}</GlassBadge>
                            </GlassCard>
                        ))}
                    </div>
                </div>

                <div className="col-span-3">
                    {selectedList && (
                        <GlassCard>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold">{selectedList.name}</h2>
                                <GlassBadge color="purple">{completedCount}/{totalCount}</GlassBadge>
                            </div>
                            <div className="flex gap-3 mb-6">
                                <input type="text" placeholder="Add a task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="glass-input flex-1" />
                                <GlassButton variant="primary" onClick={addTask}><Plus className="w-5 h-5" /> Add</GlassButton>
                            </div>
                            {selectedList.tasks.length === 0 ? <GlassEmpty text="No tasks yet" /> : (
                                <div className="space-y-3">
                                    {selectedList.tasks.map(task => (
                                        <div key={task.id} className={cn("flex items-center gap-4 p-4 rounded-xl transition-all", task.completed ? "bg-white/5" : "bg-white/10")}>
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", task.completed ? "bg-[var(--glass-accent)] border-[var(--glass-accent)]" : "border-white/30")}>{task.completed && <Check className="w-4 h-4 text-black" />}</button>
                                            <span className={cn("flex-1", task.completed && "line-through text-[var(--glass-text-muted)]")}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="p-2 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    )}
                </div>
            </div>
        </GlassLayout>
    );
}
