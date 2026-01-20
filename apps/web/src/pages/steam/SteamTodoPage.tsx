import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { SteamLayout } from '@/layouts/SteamLayout';
import { SteamPanel, SteamButton, SteamEmpty, SteamTitle, SteamBadge } from '@/components/steam/SteamComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function SteamTodoPage() {
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
        <SteamLayout>
            <SteamTitle>Task Register</SteamTitle>
            <div className="grid grid-cols-4 gap-6">
                <div>
                    <SteamPanel title="Lists">
                        <div className="flex gap-2 mb-4"><input type="text" placeholder="New list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="steam-input flex-1" /><SteamButton variant="primary" onClick={addList}><Plus className="w-4 h-4" /></SteamButton></div>
                        {lists.map(list => (<SteamPanel key={list.id} className={cn("mb-2 cursor-pointer", selectedListId === list.id && "!border-[var(--steam-brass-light)]")} onClick={() => setSelectedListId(list.id)}><div className="flex items-center justify-between"><span>{list.name}</span><SteamBadge>{list.tasks.length}</SteamBadge></div></SteamPanel>))}
                    </SteamPanel>
                </div>
                <div className="col-span-3">
                    {selectedList && (
                        <SteamPanel title={selectedList.name}>
                            <div className="flex gap-3 mb-6"><input type="text" placeholder="New task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="steam-input flex-1" /><SteamButton variant="primary" onClick={addTask}><Plus className="w-4 h-4" /> Add</SteamButton></div>
                            {selectedList.tasks.length === 0 ? <SteamEmpty text="No tasks registered" /> : (
                                <div className="space-y-2">
                                    {selectedList.tasks.map(task => (
                                        <div key={task.id} className={cn("flex items-center gap-4 p-4 border border-[var(--steam-iron)]", task.completed && "opacity-60")}>
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-6 h-6 border-2 flex items-center justify-center transition-all", task.completed ? "bg-[var(--steam-brass)] border-[var(--steam-brass)]" : "border-[var(--steam-brass)]")}>{task.completed && <Check className="w-4 h-4 text-[var(--steam-bg)]" />}</button>
                                            <span className={cn("flex-1", task.completed && "line-through")}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="steam-btn steam-btn-danger !p-2"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SteamPanel>
                    )}
                </div>
            </div>
        </SteamLayout>
    );
}
