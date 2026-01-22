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
  Pin,
  LayoutGrid,
  List as ListIcon,
  Tag,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
    viewMode,
    setViewMode,
    togglePinTask,
  } = useTodoStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TodoTask['priority']>('medium');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskLabels, setNewTaskLabels] = useState('');
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    fetchLists();
    fetchTasks();
  }, []);

  const activeList = useMemo(() => {
    return lists.find((list) => list.id === (selectedListId ?? 'inbox')) || lists[0];
  }, [lists, selectedListId]);

  const [activeSmartView, setActiveSmartView] = useState<string | null>(null);

  const smartViewTasks = useMemo(() => {
    if (!activeSmartView) return tasks;
    const today = new Date().toISOString().split('T')[0];

    switch (activeSmartView) {
      case 'today':
        return tasks.filter(t => t.dueDate?.startsWith(today));
      case 'important':
        return tasks.filter(t => t.priority === 'high' || t.priority === 'critical');
      case 'upcoming':
        return tasks.filter(t => t.dueDate && t.dueDate > today);
      default:
        return tasks;
    }
  }, [tasks, activeSmartView]);

  const filteredTasks = useMemo(() => {
    let result = activeSmartView ? smartViewTasks : tasks;
    if (filters.status && filters.status !== 'all') {
      result = result.filter((task) => task.status === filters.status);
    }
    return result;
  }, [tasks, smartViewTasks, filters.status, activeSmartView]);

  const pinnedTasks = useMemo(() => filteredTasks.filter(t => t.isPinned), [filteredTasks]);
  const otherTasks = useMemo(() => filteredTasks.filter(t => !t.isPinned), [filteredTasks]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await createTask({
      title: newTaskTitle,
      priority: newTaskPriority,
      dueDate: newTaskDue || null,
      labels: newTaskLabels.split(',').map(s => s.trim()).filter(Boolean),
    });
    setNewTaskTitle('');
    setNewTaskDue('');
    setNewTaskPriority('medium');
    setNewTaskLabels('');
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      // const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
      // Reordering logic would go here if backend supported position updates.
    }
  };

  const handleBoardDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TodoTask['status'];

    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus && ['todo', 'in_progress', 'done'].includes(newStatus)) {
      await updateStatus(taskId, newStatus);
    }
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
            <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'list' ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'board' ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-600">Smart reminders on</span>
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
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Views</h3>
                <button
                  onClick={() => { setActiveSmartView(null); setSelectedList(null); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left text-sm font-medium',
                    !activeSmartView && !selectedListId ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-transparent text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Inbox className="w-4 h-4" />
                  Inbox
                </button>
                <button
                  onClick={() => { setActiveSmartView('today'); setSelectedList(null); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left text-sm font-medium',
                    activeSmartView === 'today' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-transparent text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  Today
                </button>
                <button
                  onClick={() => { setActiveSmartView('upcoming'); setSelectedList(null); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left text-sm font-medium',
                    activeSmartView === 'upcoming' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-transparent text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Clock className="w-4 h-4" />
                  Upcoming
                </button>
                <button
                  onClick={() => { setActiveSmartView('important'); setSelectedList(null); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left text-sm font-medium',
                    activeSmartView === 'important' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-transparent text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Flag className="w-4 h-4" />
                  Important
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between px-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lists</h3>
                  <span className="text-[10px] text-gray-400 font-bold">{lists.length}</span>
                </div>
                <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-1">
                  {lists.filter(l => l.id !== 'inbox').map((list) => (
                    <button
                      key={list.id}
                      onClick={() => { setSelectedList(list.id); setActiveSmartView(null); }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-left',
                        selectedListId === list.id
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                          : 'border-transparent text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{list.name}</span>
                      </div>
                      {list.counts && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{list.counts.done}/{list.counts.total}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
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

            {/* Optional Labels input */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-indigo-50 border-dashed rounded-xl overflow-hidden">
              <Tag className="w-4 h-4 text-indigo-400" />
              <input
                value={newTaskLabels}
                onChange={(e) => setNewTaskLabels(e.target.value)}
                placeholder="Add labels (work, personal, etc...)"
                className="flex-1 bg-transparent text-xs text-gray-600 focus:outline-none placeholder:text-gray-300"
              />
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

            {viewMode === 'list' ? (
              <div className="space-y-6">
                {pinnedTasks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Pin className="w-4 h-4 fill-current rotate-45" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">Pinned</h3>
                    </div>
                    <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden ring-2 ring-indigo-500/5">
                      <ul className="divide-y divide-gray-100">
                        {pinnedTasks.map((task) => (
                          <TaskListItem
                            key={task.id}
                            task={task}
                            onUpdateStatus={updateStatus}
                            onDelete={deleteTask}
                            onTogglePin={togglePinTask}
                          />
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {pinnedTasks.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <ListIcon className="w-4 h-4" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">Tasks</h3>
                    </div>
                  )}
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-16 text-gray-500">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Loading tasks...
                      </div>
                    ) : otherTasks.length === 0 && pinnedTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                        <Inbox className="w-8 h-8 mb-3" />
                        <p className="font-semibold">No tasks yet</p>
                        <p className="text-sm">Add your first task to get started.</p>
                      </div>
                    ) : (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={otherTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                          <ul className="divide-y divide-gray-100">
                            {otherTasks.map((task) => (
                              <SortableTaskItem
                                key={task.id}
                                task={task}
                                onUpdateStatus={updateStatus}
                                onDelete={deleteTask}
                                onTogglePin={togglePinTask}
                              />
                            ))}
                          </ul>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <DndContext sensors={sensors} onDragEnd={handleBoardDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {statusTabs.filter(s => s.id !== 'all').map(status => (
                    <BoardColumn key={status.id} status={status} tasks={filteredTasks.filter(t => t.status === status.id)} />
                  ))}
                </div>
              </DndContext>
            )}
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

interface TaskListItemProps {
  task: TodoTask;
  onUpdateStatus: (id: string, status: TodoTask['status']) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTogglePin: (id: string) => Promise<void>;
}

function SortableTaskItem(props: TaskListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskListItem {...props} />
    </div>
  );
}

import { useDroppable } from '@dnd-kit/core';

function BoardColumn({ status, tasks }: { status: { id: string, label: string }, tasks: TodoTask[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  });

  const {
    deleteTask,
    updateStatus,
    togglePinTask,
  } = useTodoStore();

  return (
    <div key={status.id} className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            status.id === 'todo' ? "bg-slate-400" : status.id === 'in_progress' ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-emerald-500"
          )} />
          {status.label}
        </h3>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "space-y-3 min-h-[500px] p-2 rounded-2xl bg-slate-200/50 border border-dashed transition-colors",
          isOver ? "bg-indigo-50 border-indigo-300" : "border-slate-300"
        )}
      >
        {tasks.map(task => (
          <DraggableBoardTask
            key={task.id}
            task={task}
            onDelete={deleteTask}
            onUpdateStatus={updateStatus}
            onTogglePin={togglePinTask}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableBoardTask({ task, onDelete, onUpdateStatus, onTogglePin }: { task: TodoTask, onDelete: (id: string) => Promise<void>, onUpdateStatus: (id: string, status: TodoTask['status']) => Promise<void>, onTogglePin: (id: string) => Promise<void> }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 group hover:shadow-md transition-shadow relative cursor-grab active:cursor-grabbing",
        isDragging && "shadow-xl border-indigo-200 ring-2 ring-indigo-500/10"
      )}
    >
      {task.isPinned && (
        <Pin className="w-3 h-3 text-indigo-500 absolute top-3 right-3 fill-current rotate-45" />
      )}
      <p className={cn("font-medium text-sm leading-snug", task.status === 'done' && "line-through text-gray-400")}>
        {task.title}
      </p>
      <div className="flex flex-wrap gap-2">
        <span className={cn("text-[10px] px-2 py-0.5 rounded-lg border", priorityStyles[task.priority] || 'bg-gray-50 text-gray-700 border-gray-100')}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        )}
        {task.labels?.map(label => (
          <span key={label} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" />
            {label}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          <button
            onMouseDown={(e) => { e.stopPropagation(); onTogglePin(task.id); }}
            className="p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onMouseDown={(e) => { e.stopPropagation(); onUpdateStatus(task.id, task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done'); }}
          className="text-[10px] font-bold text-indigo-600 hover:underline"
        >
          Move Next →
        </button>
      </div>
    </div>
  );
}

function TaskListItem({ task, onUpdateStatus, onDelete, onTogglePin }: TaskListItemProps) {
  return (
    <li className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors hover:bg-slate-50/50">
      <div className="flex items-start gap-3 flex-1">
        <button
          onClick={() => onUpdateStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
          className={cn(
            'w-5 h-5 rounded-full border flex items-center justify-center mt-1 transition-all',
            task.status === 'done'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
              : 'border-gray-300 text-gray-300 hover:border-indigo-400'
          )}
        >
          {task.status === 'done' && <CheckCircle2 className="w-4 h-4" />}
        </button>
        <div>
          <div className="flex items-center gap-2">
            <p className={cn('font-medium transition-all', task.status === 'done' && 'line-through text-gray-400')}>
              {task.title}
            </p>
            {task.isPinned && (
              <Pin className="w-3 h-3 text-indigo-500 fill-current rotate-45" />
            )}
          </div>
          {task.description && (
            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={cn(
                'px-2 py-1 rounded-lg text-xs border font-medium uppercase tracking-wider',
                priorityStyles[task.priority] || 'bg-gray-50 text-gray-700 border-gray-100'
              )}
            >
              <Flag className="w-3 h-3 inline mr-1" />
              {task.priority}
            </span>
            {task.dueDate && (
              <span className="px-2 py-1 rounded-lg text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                <Calendar className="w-3 h-3 inline mr-1" />
                {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {task.labels?.map(label => (
              <span key={label} className="px-2 py-1 rounded-lg text-xs bg-slate-50 text-slate-500 border border-slate-200 font-medium flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {label}
              </span>
            ))}
            <span className="px-2 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 border border-slate-200 font-bold uppercase tracking-tighter">
              {statusLabels[task.status] || task.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onTogglePin(task.id)}
          className={cn(
            "p-2 rounded-xl border transition-all",
            task.isPinned ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
          )}
          title={task.isPinned ? "Unpin task" : "Pin task"}
        >
          <Pin className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
}

function StatCard({ icon: Icon, label, value, badge, gradient }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
      <div className={cn('w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-inner', `bg-gradient-to-br ${gradient}`)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
      <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-bold uppercase tracking-tighter">{badge}</span>
    </div>
  );
}

