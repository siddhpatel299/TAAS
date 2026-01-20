import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { ArtDecoLayout } from '@/layouts/ArtDecoLayout';
import { DecoCard, DecoButton, DecoEmpty, DecoTitle, DecoBadge, DecoDivider } from '@/components/artdeco/ArtDecoComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function ArtDecoTodoPage() {
    const [lists, setLists] = useState<TodoList[]>([{ id: '1', name: 'Main', tasks: [{ id: '1', text: 'Sample task', completed: false }] }]);
    const [selectedListId, setSelectedListId] = useState<string>('1');
    const [newTask, setNewTask] = useState('');
    const [newListName, setNewListName] = useState('');

    const selectedList = lists.find(l => l.id === selectedListId);
    const addTask = () => { if (!newTask.trim() || !selectedList) return; setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: [...l.tasks, { id: Date.now().toString(), text: newTask.trim(), completed: false }] } : l)); setNewTask(''); };
    const toggleTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) } : l)); };
    const deleteTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l)); };
    const addList = () => { if (!newListName.trim()) return; const list: TodoList = { id: Date.now().toString(), name: newListName.trim(), tasks: [] }; setLists([...lists, list]); setSelectedListId(list.id); setNewListName(''); };

    const completed = selectedList?.tasks.filter(t => t.completed).length || 0;
    const total = selectedList?.tasks.length || 0;

    return (
        <ArtDecoLayout>
            <DecoTitle>Todo Lists</DecoTitle>
            <div className="grid grid-cols-4 gap-6">
                <div>
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="New list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="deco-input flex-1" />
                        <DecoButton variant="primary" onClick={addList}><Plus className="w-5 h-5" /></DecoButton>
                    </div>
                    <div className="space-y-2">
                        {lists.map(list => (
                            <DecoCard key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("!p-4 flex items-center justify-between", selectedListId === list.id && "!border-[var(--deco-gold-light)]")}>
                                <span className="font-medium">{list.name}</span>
                                <DecoBadge>{list.tasks.length}</DecoBadge>
                            </DecoCard>
                        ))}
                    </div>
                </div>
                <div className="col-span-3">
                    {selectedList && (
                        <DecoCard>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">{selectedList.name}</h2>
                                <DecoBadge color="sage">{completed}/{total} completed</DecoBadge>
                            </div>
                            <DecoDivider />
                            <div className="flex gap-3 mb-6">
                                <input type="text" placeholder="Add a task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="deco-input flex-1" />
                                <DecoButton variant="primary" onClick={addTask}><Plus className="w-5 h-5" /> Add</DecoButton>
                            </div>
                            {selectedList.tasks.length === 0 ? <DecoEmpty text="No tasks yet" /> : (
                                <div className="space-y-3">
                                    {selectedList.tasks.map(task => (
                                        <div key={task.id} className={cn("flex items-center gap-4 p-4 border border-[var(--deco-gold-dark)]", task.completed && "opacity-60")}>
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-6 h-6 border border-[var(--deco-gold)] flex items-center justify-center", task.completed && "bg-[var(--deco-gold)]")}>{task.completed && <Check className="w-4 h-4 text-black" />}</button>
                                            <span className={cn("flex-1", task.completed && "line-through")}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="text-[var(--deco-rose)]"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </DecoCard>
                    )}
                </div>
            </div>
        </ArtDecoLayout>
    );
}
