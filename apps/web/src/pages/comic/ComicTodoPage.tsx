import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { ComicLayout } from '@/layouts/ComicLayout';
import { ComicPanel, ComicButton, ComicEmpty, ComicTitle, ComicBadge } from '@/components/comic/ComicComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function ComicTodoPage() {
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
        <ComicLayout>
            <ComicTitle>Todo Lists!</ComicTitle>
            <div className="grid grid-cols-4 gap-6">
                <div>
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="New list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="comic-input flex-1" />
                        <ComicButton variant="primary" onClick={addList}><Plus className="w-5 h-5" /></ComicButton>
                    </div>
                    {lists.map(list => (
                        <ComicPanel key={list.id} className={cn("cursor-pointer mb-2", selectedListId === list.id && "!bg-[var(--comic-yellow)]")} onClick={() => setSelectedListId(list.id)}>
                            <div className="flex items-center justify-between font-bold">
                                <span>{list.name}</span>
                                <ComicBadge>{list.tasks.length}</ComicBadge>
                            </div>
                        </ComicPanel>
                    ))}
                </div>
                <div className="col-span-3">
                    {selectedList && (
                        <ComicPanel title={selectedList.name.toUpperCase() + "!"}>
                            <div className="flex gap-3 mb-6">
                                <input type="text" placeholder="Add a task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="comic-input flex-1" />
                                <ComicButton variant="primary" onClick={addTask}><Plus className="w-5 h-5" /> POW!</ComicButton>
                            </div>
                            {selectedList.tasks.length === 0 ? <ComicEmpty text="No tasks yet!" /> : (
                                <div className="space-y-2">
                                    {selectedList.tasks.map(task => (
                                        <div key={task.id} className={cn("flex items-center gap-3 p-3 border-3 border-black", task.completed ? "bg-[var(--comic-green)]" : "bg-white")}>
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-6 h-6 border-3 border-black flex items-center justify-center", task.completed && "bg-black")}>{task.completed && <Check className="w-4 h-4 text-white" />}</button>
                                            <span className={cn("flex-1 font-bold", task.completed && "line-through")}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="comic-btn comic-btn-danger !p-2"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ComicPanel>
                    )}
                </div>
            </div>
        </ComicLayout>
    );
}
