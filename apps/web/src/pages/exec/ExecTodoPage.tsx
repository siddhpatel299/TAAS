import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { ExecLayout } from '@/layouts/ExecLayout';
import { ExecCard, ExecButton, ExecEmpty, ExecTitle, ExecBadge } from '@/components/exec/ExecComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function ExecTodoPage() {
    const [lists, setLists] = useState<TodoList[]>([{ id: '1', name: 'Action Items', tasks: [{ id: '1', text: 'Review quarterly reports', completed: false }] }]);
    const [selectedListId, setSelectedListId] = useState<string>('1');
    const [newTask, setNewTask] = useState('');
    const [newListName, setNewListName] = useState('');

    const selectedList = lists.find(l => l.id === selectedListId);
    const addTask = () => { if (!newTask.trim() || !selectedList) return; setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: [...l.tasks, { id: Date.now().toString(), text: newTask.trim(), completed: false }] } : l)); setNewTask(''); };
    const toggleTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) } : l)); };
    const deleteTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l)); };
    const addList = () => { if (!newListName.trim()) return; const list: TodoList = { id: Date.now().toString(), name: newListName.trim(), tasks: [] }; setLists([...lists, list]); setSelectedListId(list.id); setNewListName(''); };

    return (
        <ExecLayout>
            <ExecTitle subtitle="Manage your priorities">Action Items</ExecTitle>
            <div className="grid grid-cols-4 gap-8">
                <ExecCard>
                    <h3 className="text-[var(--exec-gold)] uppercase tracking-wider text-sm mb-6" style={{ fontFamily: 'var(--font-exec-heading)' }}>Agendas</h3>
                    <div className="flex gap-2 mb-6"><input type="text" placeholder="New agenda..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="exec-input flex-1" /><ExecButton variant="primary" onClick={addList}><Plus className="w-4 h-4" /></ExecButton></div>
                    {lists.map(list => (<button key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("w-full text-left p-4 mb-2 flex items-center justify-between border transition-all", selectedListId === list.id ? "border-[var(--exec-gold)] bg-[rgba(201,164,86,0.05)]" : "border-transparent hover:border-[var(--exec-border)]")}><span>{list.name}</span><ExecBadge>{list.tasks.length}</ExecBadge></button>))}
                </ExecCard>
                <div className="col-span-3">
                    {selectedList && (
                        <ExecCard>
                            <h3 className="text-[var(--exec-gold)] uppercase tracking-wider text-sm mb-4" style={{ fontFamily: 'var(--font-exec-heading)' }}>{selectedList.name}</h3>
                            <div className="flex gap-3 mb-8"><input type="text" placeholder="Add action item..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="exec-input flex-1" /><ExecButton variant="primary" onClick={addTask}><Plus className="w-4 h-4" /> Add</ExecButton></div>
                            {selectedList.tasks.length === 0 ? <ExecEmpty text="No action items on this agenda" /> : (
                                <div className="space-y-3">
                                    {selectedList.tasks.map(task => (
                                        <div key={task.id} className={cn("flex items-center gap-4 p-4 border border-[var(--exec-border)] transition-all", task.completed && "opacity-50")}>
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-6 h-6 flex items-center justify-center border transition-all", task.completed ? "bg-[var(--exec-gold)] border-[var(--exec-gold)]" : "border-[var(--exec-border)]")}>{task.completed && <Check className="w-4 h-4 text-[var(--exec-bg)]" />}</button>
                                            <span className={cn("flex-1", task.completed && "line-through")}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="text-[var(--exec-text-muted)] hover:text-[var(--exec-gold)]"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ExecCard>
                    )}
                </div>
            </div>
        </ExecLayout>
    );
}
