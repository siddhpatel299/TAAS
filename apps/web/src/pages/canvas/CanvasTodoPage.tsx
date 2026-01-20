import { useState } from 'react';
import { Plus, Trash2, Check, ListTodo } from 'lucide-react';
import { CanvasLayout } from '@/layouts/CanvasLayout';
import { CanvasWindow, CanvasCard, CanvasButton, CanvasEmpty, CanvasTitle, CanvasBadge } from '@/components/canvas/CanvasComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function CanvasTodoPage() {
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
        <CanvasLayout>
            <CanvasTitle>Todo Lists</CanvasTitle>
            <div className="grid grid-cols-4 gap-6">
                <div>
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="New list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="canvas-input flex-1" />
                        <CanvasButton variant="primary" onClick={addList}><Plus className="w-4 h-4" /></CanvasButton>
                    </div>
                    {lists.map(list => (
                        <CanvasCard key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("flex items-center justify-between mb-2", selectedListId === list.id && "border-[var(--canvas-accent)]")}>
                            <span className="font-medium">{list.name}</span>
                            <CanvasBadge>{list.tasks.length}</CanvasBadge>
                        </CanvasCard>
                    ))}
                </div>
                <div className="col-span-3">
                    {selectedList && (
                        <CanvasWindow title={selectedList.name} icon={<ListTodo className="w-4 h-4" />} zLevel="mid">
                            <div className="flex gap-3 mb-6">
                                <input type="text" placeholder="Add a task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="canvas-input flex-1" />
                                <CanvasButton variant="primary" onClick={addTask}><Plus className="w-4 h-4" /> Add</CanvasButton>
                            </div>
                            {selectedList.tasks.length === 0 ? <CanvasEmpty text="No tasks yet" /> : (
                                <div className="space-y-2">
                                    {selectedList.tasks.map(task => (
                                        <div key={task.id} className={cn("flex items-center gap-3 p-3 rounded-lg", task.completed ? "bg-[var(--canvas-glass)]" : "bg-[var(--canvas-surface)]")}>
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", task.completed ? "bg-[var(--canvas-accent)] border-[var(--canvas-accent)]" : "border-[var(--canvas-border)]")}>{task.completed && <Check className="w-3 h-3 text-white" />}</button>
                                            <span className={cn("flex-1", task.completed && "line-through text-[var(--canvas-text-muted)]")}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="p-1 text-red-400 hover:bg-red-400/10 rounded"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CanvasWindow>
                    )}
                </div>
            </div>
        </CanvasLayout>
    );
}
