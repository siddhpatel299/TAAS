import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { ZenLayout } from '@/layouts/ZenLayout';
import { ZenCard, ZenButton, ZenEmpty, ZenTitle, ZenBadge, ZenSection } from '@/components/zen/ZenComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function ZenTodoPage() {
    const [lists, setLists] = useState<TodoList[]>([{ id: '1', name: 'Main', tasks: [{ id: '1', text: 'Sample task', completed: false }] }]);
    const [selectedListId, setSelectedListId] = useState<string>('1');
    const [newTask, setNewTask] = useState('');
    const [newListName, setNewListName] = useState('');

    const selectedList = lists.find(l => l.id === selectedListId);
    const addTask = () => { if (!newTask.trim() || !selectedList) return; setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: [...l.tasks, { id: Date.now().toString(), text: newTask.trim(), completed: false }] } : l)); setNewTask(''); };
    const toggleTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) } : l)); };
    const deleteTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l)); };
    const addList = () => { if (!newListName.trim()) return; const list: TodoList = { id: Date.now().toString(), name: newListName.trim(), tasks: [] }; setLists([...lists, list]); setSelectedListId(list.id); setNewListName(''); };

    return (
        <ZenLayout>
            <ZenTitle subtitle="Stay organized">Tasks</ZenTitle>
            <div className="grid grid-cols-4 gap-10">
                <ZenSection title="Lists">
                    <ZenCard>
                        <div className="flex gap-3" style={{ marginBottom: '24px' }}><input type="text" placeholder="New list" value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="zen-input flex-1" /><ZenButton variant="primary" onClick={addList}><Plus className="w-3 h-3" /></ZenButton></div>
                        {lists.map(list => (<button key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("w-full text-left p-4 border-b border-[var(--zen-border-light)] flex items-center justify-between", selectedListId === list.id && "bg-[var(--zen-bg)]")}><span>{list.name}</span><ZenBadge>{list.tasks.length}</ZenBadge></button>))}
                    </ZenCard>
                </ZenSection>
                <div className="col-span-3">
                    {selectedList && (
                        <ZenSection title={selectedList.name}>
                            <ZenCard>
                                <div className="flex gap-4" style={{ marginBottom: '40px' }}><input type="text" placeholder="New task" value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="zen-input flex-1" /><ZenButton variant="primary" onClick={addTask}><Plus className="w-3 h-3" /> Add</ZenButton></div>
                                {selectedList.tasks.length === 0 ? <ZenEmpty text="No tasks" /> : (
                                    <div>
                                        {selectedList.tasks.map(task => (
                                            <div key={task.id} className={cn("flex items-center gap-6 p-4 border-b border-[var(--zen-border-light)]", task.completed && "opacity-50")}>
                                                <button onClick={() => toggleTask(task.id)} className={cn("w-5 h-5 border flex items-center justify-center", task.completed ? "bg-[var(--zen-accent)] border-[var(--zen-accent)]" : "border-[var(--zen-border)]")}>{task.completed && <Check className="w-3 h-3 text-[var(--zen-surface)]" />}</button>
                                                <span className={cn("flex-1", task.completed && "line-through")}>{task.text}</span>
                                                <button onClick={() => deleteTask(task.id)} className="text-[var(--zen-text-light)] hover:text-[var(--zen-text)]"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ZenCard>
                        </ZenSection>
                    )}
                </div>
            </div>
        </ZenLayout>
    );
}
