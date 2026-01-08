import React, { useEffect, useMemo, useState } from 'react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useTodoStore } from '@/stores/todo.store';
import { TodoTask } from '@/lib/todo-api';
import {
  CheckSquare,
  Plus,
  Clock,
  Calendar,
  Target,
  Trash2,
  Sparkles,
  Flag,
  Inbox,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const priorityStyles: Record<string, string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  medium: 'bg-blue-50 text-blue-700 border-blue-100',
  high: 'bg-amber-50 text-amber-700 border-amber-100',
  critical: 'bg-rose-50 text-rose-700 border-rose-100',
};

const statusLabels: Record<string, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
};

export function TodoPage() {
  const {
    lists,
    tasks,
    stats,
    selectedListId,
    filters,
    isLoading,
    error,
    fetchLists,
    fetchTasks,
    createList,
    createTask,
    updateStatus,
    deleteTask,
    setSelectedList,
    setFilters,
    clearError,
  } = useTodoStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TodoTask['priority']>('medium');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    fetchLists();
    fetchTasks();
  }, []);

  const activeList = useMemo(() => {
    return lists.find((list) => list.id === (selectedListId ?? 'inbox')) || lists[0];
  }, [lists, selectedListId]);

  const filteredTasks = useMemo(() => {
    if (!filters.status || filters.status === 'all') return tasks;
    return tasks.filter((task) => task.status === filters.status);
  }, [tasks, filters.status]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await createTask({
      title: newTaskTitle,
      priority: newTaskPriority,
      dueDate: newTaskDue || null,
    });
    setNewTaskTitle('');
    setNewTaskDue('');
    setNewTaskPriority('medium');
  };

  const handleAddList = async () => {
    if (!newListName.trim()) return;
    await createList({ name: newListName });
    setNewListName('');
  };

  const statusTabs = [
    { id: 'all', label: 'All' },
    { id: 'todo', label: 'Todo' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'done', label: 'Done' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ModernSidebar />
      <main className="ml-20 p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">To-Do Lists</h1>
              <p className="text-sm text-gray-500">Capture tasks, stay organized, and keep momentum.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-600">Smart reminders coming soon</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-sm font-semibold">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Lists panel */}
          <section className="xl:col-span-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Lists</h2>
              <span className="text-xs text-gray-400">{lists.length} total</span>
            </div>

            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setSelectedList(list.id === 'inbox' ? null : list.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-left',
                    selectedListId === list.id || (!selectedListId && list.id === 'inbox')
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-gray-100 hover:border-indigo-100 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {list.id === 'inbox' ? (
                      <Inbox className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <Target className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium">{list.name}</span>
                  </div>
                  {list.counts && (
                    <span className="text-xs text-gray-500">{list.counts.done}/{list.counts.total}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="New list name"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddList}
                className="p-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Tasks panel */}
          <section className="xl:col-span-3 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={stats?.completed ?? 0}
                badge={`${stats?.total ?? 0} total`}
                gradient="from-emerald-500 to-teal-500"
              />
              <StatCard
                icon={Calendar}
                label="Due Today"
                value={stats?.today ?? 0}
                badge="Today"
                gradient="from-indigo-500 to-blue-500"
              />
              <StatCard
                icon={AlertTriangle}
                label="Overdue"
                value={stats?.overdue ?? 0}
                badge="Action needed"
                gradient="from-rose-500 to-orange-500"
              />
              <StatCard
                icon={Clock}
                label="Active"
                value={(stats?.total ?? 0) - (stats?.completed ?? 0)}
                badge="In progress"
                gradient="from-purple-500 to-fuchsia-500"
              />
            </div>

            {/* New task composer */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-gray-400" />
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={`Add a task to ${activeList?.name || 'Inbox'}`}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as TodoTask['priority'])}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <input
                  type="date"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
                <button
                  onClick={handleAddTask}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Status filter */}
            <div className="flex flex-wrap items-center gap-2">
              {statusTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilters({ status: tab.id })}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm border',
                    (filters.status || 'all') === tab.id
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-500">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading tasks...
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Inbox className="w-8 h-8 mb-3" />
                  <p className="font-semibold">No tasks yet</p>
                  <p className="text-sm">Add your first task to get started.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredTasks.map((task) => (
                    <li key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => updateStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                          className={cn(
                            'w-5 h-5 rounded-full border flex items-center justify-center mt-1',
                            task.status === 'done'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                              : 'border-gray-300 text-gray-300'
                          )}
                        >
                          {task.status === 'done' && <CheckSquare className="w-4 h-4" />}
                        </button>
                        <div>
                          <p className={cn('font-medium', task.status === 'done' && 'line-through text-gray-400')}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className={cn(
                                'px-2 py-1 rounded-lg text-xs border',
                                priorityStyles[task.priority] || 'bg-gray-50 text-gray-700 border-gray-100'
                              )}
                            >
                              <Flag className="w-3 h-3 inline mr-1" />
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="px-2 py-1 rounded-lg text-xs bg-amber-50 text-amber-700 border border-amber-100">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            <span className="px-2 py-1 rounded-lg text-xs bg-slate-50 text-slate-700 border border-slate-100">
                              {statusLabels[task.status] || task.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                          className="px-3 py-2 text-sm rounded-xl border border-gray-200 hover:border-indigo-200"
                        >
                          {task.status === 'done' ? 'Mark as Todo' : 'Mark Done'}
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  badge: string;
  gradient: string;
}

function StatCard({ icon: Icon, label, value, badge, gradient }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-xl text-white flex items-center justify-center', `bg-gradient-to-br ${gradient}`)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
      </div>
      <span className="text-xs px-3 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100">{badge}</span>
    </div>
  );
}
