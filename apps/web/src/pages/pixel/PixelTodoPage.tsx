import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PixelLayout } from '@/layouts/PixelLayout';
import { PixelCard, PixelButton, PixelEmpty, PixelTitle, PixelBadge, PixelCheckbox } from '@/components/pixel/PixelComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function PixelTodoPage() {
    const [lists, setLists] = useState<TodoList[]>([{ id: '1', name: 'QUEST LOG', tasks: [{ id: '1', text: 'Defeat the tutorial boss', completed: false }] }]);
    const [selectedListId, setSelectedListId] = useState<string>('1');
    const [newTask, setNewTask] = useState('');
    const [newListName, setNewListName] = useState('');

    const selectedList = lists.find(l => l.id === selectedListId);
    const addTask = () => { if (!newTask.trim() || !selectedList) return; setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: [...l.tasks, { id: Date.now().toString(), text: newTask.trim(), completed: false }] } : l)); setNewTask(''); };
    const toggleTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) } : l)); };
    const deleteTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l)); };
    const addList = () => { if (!newListName.trim()) return; const list: TodoList = { id: Date.now().toString(), name: newListName.trim().toUpperCase(), tasks: [] }; setLists([...lists, list]); setSelectedListId(list.id); setNewListName(''); };

    return (
        <PixelLayout>
            <PixelTitle subtitle="> COMPLETE YOUR QUESTS">📋 TASKS</PixelTitle>
            <div className="grid grid-cols-4 gap-6">
                <PixelCard>
                    <h3 style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', marginBottom: '16px', color: 'var(--pixel-cyan)' }}>QUEST LOGS</h3>
                    <div className="flex gap-2 mb-4"><input type="text" placeholder="> NEW..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="pixel-input flex-1" style={{ fontSize: '1rem' }} /><PixelButton variant="primary" onClick={addList}><Plus className="w-4 h-4" /></PixelButton></div>
                    {lists.map(list => (<button key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("w-full text-left p-3 mb-2 flex items-center justify-between border-2", selectedListId === list.id ? "border-[var(--pixel-cyan)] bg-[rgba(41,173,255,0.1)]" : "border-[var(--pixel-border)]")}><span style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem' }}>{list.name}</span><PixelBadge>{list.tasks.length}</PixelBadge></button>))}
                </PixelCard>
                <div className="col-span-3">
                    {selectedList && (
                        <PixelCard>
                            <h3 style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.5rem', marginBottom: '16px', color: 'var(--pixel-yellow)' }}>{selectedList.name}</h3>
                            <div className="flex gap-3 mb-6"><input type="text" placeholder="> ADD QUEST..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="pixel-input flex-1" /><PixelButton variant="primary" onClick={addTask}><Plus className="w-4 h-4" /> ADD</PixelButton></div>
                            {selectedList.tasks.length === 0 ? <PixelEmpty text="NO QUESTS YET" /> : (
                                <div className="space-y-3">
                                    {selectedList.tasks.map(task => (
                                        <div key={task.id} className={cn("flex items-center gap-4 p-3 border-2 border-[var(--pixel-border)]", task.completed && "opacity-50 bg-[rgba(0,228,54,0.1)]")}>
                                            <PixelCheckbox checked={task.completed} onChange={() => toggleTask(task.id)} />
                                            <span className={cn("flex-1", task.completed && "line-through text-[var(--pixel-green)]")}>{task.text}</span>
                                            {task.completed && <PixelBadge color="green">+100 XP</PixelBadge>}
                                            <button onClick={() => deleteTask(task.id)} className="text-[var(--pixel-red)]"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </PixelCard>
                    )}
                </div>
            </div>
        </PixelLayout>
    );
}
