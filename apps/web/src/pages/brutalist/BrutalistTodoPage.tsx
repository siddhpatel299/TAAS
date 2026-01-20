import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { BrutalistLayout } from '@/layouts/BrutalistLayout';
import { BrutalistCard, BrutalistButton, BrutalistEmpty, BrutalistTitle, BrutalistBadge } from '@/components/brutalist/BrutalistComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function BrutalistTodoPage() {
    const [lists, setLists] = useState<TodoList[]>([{ id: '1', name: 'My Tasks', tasks: [{ id: '1', text: 'Sample task', completed: false }] }]);
    const [selectedListId, setSelectedListId] = useState<string>('1');
    const [newTask, setNewTask] = useState('');
    const [newListName, setNewListName] = useState('');

    const selectedList = lists.find(l => l.id === selectedListId);
    const addTask = () => { if (!newTask.trim() || !selectedList) return; setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: [...l.tasks, { id: Date.now().toString(), text: newTask.trim(), completed: false }] } : l)); setNewTask(''); };
    const toggleTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) } : l)); };
    const deleteTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l)); };
    const addList = () => { if (!newListName.trim()) return; const list: TodoList = { id: Date.now().toString(), name: newListName.trim(), tasks: [] }; setLists([...lists, list]); setSelectedListId(list.id); setNewListName(''); };

    const completedCount = selectedList?.tasks.filter(t => t.completed).length || 0;
    const totalCount = selectedList?.tasks.length || 0;

    return (
        <BrutalistLayout>
            <BrutalistTitle>Todo Lists</BrutalistTitle>
            <div className="grid grid-cols-4 gap-6">
                {/* Lists */}
                <div>
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="New list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="brutalist-input flex-1" />
                        <BrutalistButton color="pink" onClick={addList}><Plus className="w-5 h-5" /></BrutalistButton>
                    </div>
                    <div className="space-y-2">
                        {lists.map(list => (
                            <BrutalistCard key={list.id} color={selectedListId === list.id ? 'yellow' : 'white'} onClick={() => setSelectedListId(list.id)} className="flex items-center justify-between">
                                <span className="font-bold uppercase">{list.name}</span>
                                <BrutalistBadge>{list.tasks.length}</BrutalistBadge>
                            </BrutalistCard>
                        ))}
                    </div>
                </div>

                {/* Tasks */}
                <div className="col-span-3">
                    {selectedList && (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold uppercase">{selectedList.name}</h2>
                                <BrutalistBadge color="green">{completedCount}/{totalCount}</BrutalistBadge>
                            </div>
                            <div className="flex gap-3 mb-6">
                                <input type="text" placeholder="Add a task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="brutalist-input flex-1" />
                                <BrutalistButton color="green" onClick={addTask}><Plus className="w-5 h-5" /> Add</BrutalistButton>
                            </div>
                            {selectedList.tasks.length === 0 ? <BrutalistEmpty text="No tasks yet" /> : (
                                <div className="space-y-3">
                                    {selectedList.tasks.map(task => (
                                        <BrutalistCard key={task.id} color={task.completed ? 'green' : 'white'} className="flex items-center gap-4">
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-8 h-8 border-3 border-black flex items-center justify-center", task.completed && "bg-black")}>{task.completed && <Check className="w-5 h-5 text-white" />}</button>
                                            <span className={cn("flex-1 font-semibold", task.completed && "line-through opacity-50")}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="p-2"><Trash2 className="w-5 h-5" /></button>
                                        </BrutalistCard>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </BrutalistLayout>
    );
}
