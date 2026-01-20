import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { ArchiveLayout } from '@/layouts/ArchiveLayout';
import { ArchiveSection, ArchiveCard, ArchiveButton, ArchiveEmpty, ArchiveTitle, ArchiveBadge } from '@/components/archive/ArchiveComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function ArchiveTodoPage() {
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
        <ArchiveLayout>
            <ArchiveTitle>Task Index</ArchiveTitle>
            <div className="grid grid-cols-4 gap-8">
                <div>
                    <ArchiveSection title="Lists">
                        <div className="flex gap-2 mb-4"><input type="text" placeholder="New list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="archive-input flex-1" /><ArchiveButton variant="primary" onClick={addList}><Plus className="w-4 h-4" /></ArchiveButton></div>
                        {lists.map(list => (<ArchiveCard key={list.id} featured={selectedListId === list.id} onClick={() => setSelectedListId(list.id)}><div className="flex items-center justify-between"><span className="font-medium">{list.name}</span><ArchiveBadge>{list.tasks.length}</ArchiveBadge></div></ArchiveCard>))}
                    </ArchiveSection>
                </div>
                <div className="col-span-3">
                    {selectedList && (
                        <ArchiveSection title={selectedList.name} count={selectedList.tasks.length}>
                            <div className="flex gap-3 mb-8"><input type="text" placeholder="Add new entry..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="archive-input flex-1" /><ArchiveButton variant="primary" onClick={addTask}><Plus className="w-4 h-4" /> Add</ArchiveButton></div>
                            {selectedList.tasks.length === 0 ? <ArchiveEmpty title="No entries" text="Add your first task to this list." /> : (
                                <div className="space-y-2">
                                    {selectedList.tasks.map((task, i) => (
                                        <div key={task.id} className={cn("flex items-center gap-4 p-4 border border-[var(--archive-border)]", task.completed && "bg-[var(--archive-bg)]")}>
                                            <span className="text-[var(--archive-text-muted)] font-medium w-8">{String(i + 1).padStart(2, '0')}</span>
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-5 h-5 border-2 flex items-center justify-center transition-all", task.completed ? "bg-[var(--archive-accent)] border-[var(--archive-accent)]" : "border-[var(--archive-border-dark)]")}>{task.completed && <Check className="w-3 h-3 text-white" />}</button>
                                            <span className={cn("flex-1", task.completed && "line-through text-[var(--archive-text-muted)]")}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="p-1 hover:text-[var(--archive-accent)]"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ArchiveSection>
                    )}
                </div>
            </div>
        </ArchiveLayout>
    );
}
