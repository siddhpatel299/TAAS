import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { CRTLayout } from '@/layouts/CRTLayout';
import { CRTPanel, CRTBox, CRTButton, CRTEmpty, CRTTitle, CRTBadge } from '@/components/crt/CRTComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function CRTTodoPage() {
    const [lists, setLists] = useState<TodoList[]>([{ id: '1', name: 'Main', tasks: [{ id: '1', text: 'Sample task', completed: false }] }]);
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
        <CRTLayout>
            <CRTTitle>Todo Lists</CRTTitle>
            <div className="crt-panels crt-panels-2">
                {/* Lists Panel */}
                <CRTPanel header="Lists">
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="NEW LIST..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="crt-input flex-1" />
                        <CRTButton variant="primary" onClick={addList}><Plus className="w-4 h-4" /></CRTButton>
                    </div>
                    <div className="space-y-2">
                        {lists.map(list => (
                            <CRTBox key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("flex items-center justify-between", selectedListId === list.id && "!border-[var(--crt-green)]")}>
                                <span>&gt; {list.name.toUpperCase()}</span>
                                <CRTBadge>[{list.tasks.length}]</CRTBadge>
                            </CRTBox>
                        ))}
                    </div>
                </CRTPanel>

                {/* Tasks Panel */}
                <CRTPanel header={`Tasks - ${selectedList?.name.toUpperCase() || ''}`}>
                    {selectedList && (
                        <>
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-dashed border-[var(--crt-green-dim)]">
                                <span className="text-[var(--crt-green-dim)]">PROGRESS:</span>
                                <CRTBadge color="amber">{completedCount}/{totalCount}</CRTBadge>
                            </div>
                            <div className="flex gap-2 mb-4">
                                <input type="text" placeholder="ADD TASK..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="crt-input flex-1" />
                                <CRTButton variant="primary" onClick={addTask}><Plus className="w-4 h-4" /> [ADD]</CRTButton>
                            </div>
                            {selectedList.tasks.length === 0 ? <CRTEmpty text="NO TASKS" /> : (
                                <div className="space-y-2">
                                    {selectedList.tasks.map(task => (
                                        <CRTBox key={task.id} className="flex items-center gap-4">
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-6 h-6 border border-[var(--crt-green-dim)] flex items-center justify-center", task.completed && "bg-[var(--crt-green)] text-black")}>{task.completed && <Check className="w-4 h-4" />}</button>
                                            <span className={cn("flex-1", task.completed && "line-through text-[var(--crt-green-dim)]")}>&gt; {task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="text-[var(--crt-red)]"><Trash2 className="w-4 h-4" /></button>
                                        </CRTBox>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </CRTPanel>
            </div>
        </CRTLayout>
    );
}
