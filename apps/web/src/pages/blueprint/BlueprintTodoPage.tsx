import { useState } from 'react';
import { CheckSquare, Plus, Trash2, Check } from 'lucide-react';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { BlueprintCard, BlueprintHeader, BlueprintButton, BlueprintEmpty, BlueprintBadge } from '@/components/blueprint/BlueprintComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function BlueprintTodoPage() {
    const [lists, setLists] = useState<TodoList[]>([{ id: '1', name: 'Primary', tasks: [{ id: '1', text: 'Sample task', completed: false }] }]);
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
        <BlueprintLayout>
            <BlueprintHeader title="Task Manager" subtitle="Manage your tasks" />
            <div className="grid gap-6" style={{ gridTemplateColumns: '260px 1fr' }}>
                <BlueprintCard className="!p-0 overflow-hidden">
                    <div className="p-4 border-b border-[var(--blueprint-line-dim)]">
                        <div className="flex gap-2">
                            <input type="text" placeholder="New list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="blueprint-input flex-1" />
                            <BlueprintButton onClick={addList}><Plus className="w-4 h-4" /></BlueprintButton>
                        </div>
                    </div>
                    {lists.map(list => (
                        <button key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("w-full text-left p-4 border-b border-[var(--blueprint-line-dim)] flex items-center justify-between text-sm", selectedListId === list.id ? "bg-[rgba(0,150,199,0.1)]" : "hover:bg-[rgba(0,150,199,0.05)]")}>
                            <span className={cn("uppercase tracking-wide", selectedListId === list.id && "text-[var(--blueprint-cyan)]")}>{list.name}</span>
                            <BlueprintBadge variant={selectedListId === list.id ? 'cyan' : 'default'}>{list.tasks.length}</BlueprintBadge>
                        </button>
                    ))}
                </BlueprintCard>

                <BlueprintCard>
                    {selectedList && (<>
                        <div className="flex items-center justify-between mb-6">
                            <div><h2 className="text-sm uppercase tracking-widest text-[var(--blueprint-cyan)]">{selectedList.name}</h2><p className="text-xs text-[var(--blueprint-text-dim)]">{completedCount}/{totalCount} complete</p></div>
                            <div className="h-2 w-32 bg-[var(--blueprint-bg)] border border-[var(--blueprint-line-dim)] overflow-hidden"><div className="h-full bg-[var(--blueprint-cyan)] transition-all" style={{ width: totalCount ? `${(completedCount / totalCount) * 100}%` : '0%' }} /></div>
                        </div>
                        <div className="flex gap-3 mb-6">
                            <input type="text" placeholder="Add task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="blueprint-input flex-1" />
                            <BlueprintButton variant="primary" onClick={addTask}><Plus className="w-4 h-4 mr-2" /> Add</BlueprintButton>
                        </div>
                        {selectedList.tasks.length === 0 ? <BlueprintEmpty icon={<CheckSquare className="w-8 h-8" />} text="No tasks" /> : (
                            <div className="space-y-2">
                                {selectedList.tasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-3 p-4 border border-[var(--blueprint-line-dim)] group">
                                        <button onClick={() => toggleTask(task.id)} className={cn("w-5 h-5 border flex items-center justify-center transition-all", task.completed ? "bg-[var(--blueprint-cyan)] border-[var(--blueprint-cyan)]" : "border-[var(--blueprint-line-dim)]")}>{task.completed && <Check className="w-3 h-3 text-[var(--blueprint-bg)]" />}</button>
                                        <span className={cn("flex-1 text-sm", task.completed && "line-through text-[var(--blueprint-text-dim)]")}>{task.text}</span>
                                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-[var(--blueprint-error)]"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>)}
                </BlueprintCard>
            </div>
        </BlueprintLayout>
    );
}
