import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NewsprintCard, NewsprintSection, NewsprintButton, NewsprintEmpty } from '@/components/newsprint/NewsprintComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function NewsprintTodoPage() {
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
        <NewsprintLayout>
            <h1 className="text-3xl mb-6" style={{ fontFamily: 'var(--font-headline)' }}>Todo Lists</h1>
            <div className="grid grid-cols-3 gap-6">
                {/* Lists */}
                <div>
                    <NewsprintSection title="Your Lists">
                        <div className="mb-4 flex gap-2">
                            <input type="text" placeholder="New list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="newsprint-input flex-1" />
                            <NewsprintButton onClick={addList}><Plus className="w-4 h-4" /></NewsprintButton>
                        </div>
                        <div className="space-y-2">
                            {lists.map(list => (
                                <button key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("w-full text-left p-3 border border-[var(--newsprint-rule-light)] flex items-center justify-between", selectedListId === list.id ? "bg-[var(--newsprint-bg)] border-[var(--newsprint-rule)]" : "hover:bg-[var(--newsprint-bg)]")}>
                                    <span style={{ fontFamily: 'var(--font-headline)' }}>{list.name}</span>
                                    <span className="text-xs text-[var(--newsprint-ink-faded)]">{list.tasks.length}</span>
                                </button>
                            ))}
                        </div>
                    </NewsprintSection>
                </div>

                {/* Tasks */}
                <div className="col-span-2">
                    {selectedList && (
                        <NewsprintSection title={`${selectedList.name} — ${completedCount}/${totalCount} Complete`}>
                            <div className="flex gap-3 mb-6">
                                <input type="text" placeholder="Add a task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="newsprint-input flex-1" />
                                <NewsprintButton variant="primary" onClick={addTask}><Plus className="w-4 h-4 mr-2" /> Add</NewsprintButton>
                            </div>
                            {selectedList.tasks.length === 0 ? <NewsprintEmpty text="No tasks yet. Add your first task above." /> : (
                                <div className="space-y-2">
                                    {selectedList.tasks.map(task => (
                                        <NewsprintCard key={task.id} className="flex items-center gap-4 group">
                                            <button onClick={() => toggleTask(task.id)} className={cn("w-5 h-5 border-2 flex items-center justify-center", task.completed ? "bg-[var(--newsprint-ink)] border-[var(--newsprint-ink)]" : "border-[var(--newsprint-rule)]")}>{task.completed && <Check className="w-3 h-3 text-[var(--newsprint-paper)]" />}</button>
                                            <span className={cn("flex-1", task.completed && "line-through text-[var(--newsprint-ink-muted)]")}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-[var(--newsprint-red)]"><Trash2 className="w-4 h-4" /></button>
                                        </NewsprintCard>
                                    ))}
                                </div>
                            )}
                        </NewsprintSection>
                    )}
                </div>
            </div>
        </NewsprintLayout>
    );
}
