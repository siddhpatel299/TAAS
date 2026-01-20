import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { SkeuLayout } from '@/layouts/SkeuLayout';
import { SkeuCard, SkeuButton, SkeuEmpty, SkeuTitle, SkeuBadge } from '@/components/skeu/SkeuComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function SkeuTodoPage() {
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
        <SkeuLayout>
            <SkeuTitle subtitle="Task management system">Todo Lists</SkeuTitle>
            <div className="grid grid-cols-4 gap-6">
                <SkeuCard>
                    <h3 className="font-semibold mb-4">Lists</h3>
                    <div className="flex gap-2 mb-4"><input type="text" placeholder="New list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="skeu-input flex-1" /><SkeuButton variant="primary" onClick={addList}><Plus className="w-4 h-4" /></SkeuButton></div>
                    {lists.map(list => (<button key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("w-full text-left p-3 rounded-lg mb-2 flex items-center justify-between border", selectedListId === list.id ? "bg-[rgba(255,255,255,0.05)] border-[var(--skeu-led-blue)]" : "border-transparent hover:bg-[rgba(255,255,255,0.02)]")}><span className="font-medium">{list.name}</span><SkeuBadge>{list.tasks.length}</SkeuBadge></button>))}
                </SkeuCard>
                <div className="col-span-3">
                    {selectedList && (
                        <SkeuCard>
                            <h3 className="font-semibold mb-4">{selectedList.name}</h3>
                            <div className="flex gap-3 mb-6"><input type="text" placeholder="Add new task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="skeu-input flex-1" /><SkeuButton variant="primary" onClick={addTask}><Plus className="w-4 h-4" /> Add Task</SkeuButton></div>
                            {selectedList.tasks.length === 0 ? <SkeuEmpty text="No tasks in this list" /> : (
                                <div className="space-y-2">
                                    {selectedList.tasks.map(task => (
                                        <div key={task.id} className={cn("flex items-center gap-4 p-4 rounded-lg border border-[var(--skeu-border)]", task.completed && "opacity-60")}>
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-6 h-6 rounded flex items-center justify-center border-2 transition-all", task.completed ? "bg-[var(--skeu-led-green)] border-[var(--skeu-led-green)]" : "border-[var(--skeu-border)]")} style={task.completed ? { boxShadow: '0 0 8px var(--skeu-led-green)' } : {}}>{task.completed && <Check className="w-4 h-4 text-black" />}</button>
                                            <span className={cn("flex-1", task.completed && "line-through")}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="skeu-btn skeu-btn-ghost !p-2"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SkeuCard>
                    )}
                </div>
            </div>
        </SkeuLayout>
    );
}
