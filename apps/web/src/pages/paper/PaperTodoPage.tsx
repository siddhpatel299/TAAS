import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PaperLayout } from '@/layouts/PaperLayout';
import { PaperCard, PaperSticky, PaperButton, PaperEmpty, PaperTitle, PaperBadge, PaperCheckbox } from '@/components/paper/PaperComponents';
import { cn } from '@/lib/utils';

interface Task { id: string; text: string; completed: boolean; }
interface TodoList { id: string; name: string; tasks: Task[]; }

export function PaperTodoPage() {
    const [lists, setLists] = useState<TodoList[]>([{ id: '1', name: 'My List', tasks: [{ id: '1', text: 'Sample task - click to complete!', completed: false }] }]);
    const [selectedListId, setSelectedListId] = useState<string>('1');
    const [newTask, setNewTask] = useState('');
    const [newListName, setNewListName] = useState('');

    const selectedList = lists.find(l => l.id === selectedListId);
    const addTask = () => { if (!newTask.trim() || !selectedList) return; setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: [...l.tasks, { id: Date.now().toString(), text: newTask.trim(), completed: false }] } : l)); setNewTask(''); };
    const toggleTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) } : l)); };
    const deleteTask = (taskId: string) => { setLists(lists.map(l => l.id === selectedListId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l)); };
    const addList = () => { if (!newListName.trim()) return; const list: TodoList = { id: Date.now().toString(), name: newListName.trim(), tasks: [] }; setLists([...lists, list]); setSelectedListId(list.id); setNewListName(''); };

    const stickyColors: Array<'yellow' | 'pink' | 'blue' | 'green' | 'orange'> = ['yellow', 'pink', 'blue', 'green', 'orange'];

    return (
        <PaperLayout>
            <PaperTitle subtitle="things to remember">✅ Todo Lists</PaperTitle>
            <div className="grid grid-cols-4 gap-6">
                <PaperCard>
                    <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', marginBottom: '16px' }}>Lists</h3>
                    <div className="flex gap-2 mb-4"><input type="text" placeholder="new list..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addList()} className="paper-input flex-1" /><PaperButton variant="primary" onClick={addList}><Plus className="w-4 h-4" /></PaperButton></div>
                    {lists.map((list) => (<button key={list.id} onClick={() => setSelectedListId(list.id)} className={cn("w-full text-left p-3 mb-2 flex items-center justify-between", selectedListId === list.id ? "bg-[var(--paper-cream)] border-l-4 border-[var(--ink-blue)]" : "")}><span style={{ fontFamily: 'var(--font-handwritten)', fontSize: '1.125rem' }}>{list.name}</span><PaperBadge color="blue">{list.tasks.length}</PaperBadge></button>))}
                </PaperCard>
                <div className="col-span-3">
                    {selectedList && (
                        <PaperSticky color={stickyColors[lists.findIndex(l => l.id === selectedListId) % 5]}>
                            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', marginBottom: '16px' }}>{selectedList.name}</h3>
                            <div className="flex gap-3 mb-6"><input type="text" placeholder="add a task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="paper-input flex-1 bg-white/50" /><PaperButton variant="primary" onClick={addTask}><Plus className="w-4 h-4" /> Add</PaperButton></div>
                            {selectedList.tasks.length === 0 ? <PaperEmpty text="no tasks yet!" /> : (
                                <div className="space-y-3">
                                    {selectedList.tasks.map(task => (
                                        <div key={task.id} className={cn("flex items-center gap-4 p-3 bg-white/30 rounded", task.completed && "opacity-60")}>
                                            <PaperCheckbox checked={task.completed} onChange={() => toggleTask(task.id)} />
                                            <span className={cn("flex-1", task.completed && "line-through")} style={{ fontFamily: 'var(--font-handwritten)', fontSize: '1.25rem' }}>{task.text}</span>
                                            <button onClick={() => deleteTask(task.id)} className="text-[var(--ink-red)]"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </PaperSticky>
                    )}
                </div>
            </div>
        </PaperLayout>
    );
}
