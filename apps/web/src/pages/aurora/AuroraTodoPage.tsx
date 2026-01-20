import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { AuroraLayout } from '@/layouts/AuroraLayout';
import { AuroraCard, AuroraButton, AuroraEmpty, AuroraTitle, AuroraBadge } from '@/components/aurora/AuroraComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function AuroraTodoPage() {
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
        <AuroraLayout>
            <AuroraTitle subtitle="Stay organized">Todo Lists</AuroraTitle>
            <div className="grid grid-cols-4 gap-6">
                <AuroraCard>
                    <h3 className="font-semibold mb-4">Lists</h3>
                    <div className="flex gap-2 mb-4"><input type="text" placeholder="New list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="aurora-input flex-1" /><AuroraButton variant="primary" onClick={addList}><Plus className="w-4 h-4" /></AuroraButton></div>
                    {lists.map(list => (<button key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("w-full text-left p-3 rounded-xl mb-2 flex items-center justify-between", selectedListId === list.id ? "bg-[rgba(102,126,234,0.2)]" : "hover:bg-[rgba(102,126,234,0.1)]")}><span className="font-medium">{list.name}</span><AuroraBadge>{list.tasks.length}</AuroraBadge></button>))}
                </AuroraCard>
                <div className="col-span-3">
                    {selectedList && (
                        <AuroraCard>
                            <h3 className="font-semibold mb-4">{selectedList.name}</h3>
                            <div className="flex gap-3 mb-6"><input type="text" placeholder="New task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="aurora-input flex-1" /><AuroraButton variant="primary" onClick={addTask}><Plus className="w-4 h-4" /> Add</AuroraButton></div>
                            {selectedList.tasks.length === 0 ? <AuroraEmpty text="No tasks" /> : (
                                <div className="space-y-2">
                                    {selectedList.tasks.map(task => (
                                        <div key={task.id} className={cn("flex items-center gap-4 p-4 rounded-xl border border-[var(--aurora-border)]", task.completed && "opacity-60")}>
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", task.completed ? "bg-gradient-to-br from-[var(--aurora-gradient-1)] to-[var(--aurora-gradient-2)] border-transparent" : "border-[var(--aurora-border)]")}>{task.completed && <Check className="w-4 h-4 text-white" />}</button>
                                            <span className={cn("flex-1", task.completed && "line-through")}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="aurora-btn aurora-btn-ghost !p-2"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </AuroraCard>
                    )}
                </div>
            </div>
        </AuroraLayout>
    );
}
