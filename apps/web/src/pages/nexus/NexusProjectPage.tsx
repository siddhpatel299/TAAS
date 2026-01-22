import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { NexusSidebar } from '@/components/nexus/NexusSidebar';
import { NexusKanbanBoard } from '@/components/nexus/NexusKanbanBoard';
import { NexusListView } from '@/components/nexus/NexusListView';
import { NexusTimelineView } from '@/components/nexus/NexusTimelineView';
import { NexusTaskModal } from '@/components/nexus/NexusTaskModal';
import { useNexusStore } from '@/stores/nexus.store';
import { Settings, Filter, Users, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NexusProjectPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const { currentProject, tasks, setCurrentProject, viewMode, setViewMode, openCreateTask } = useNexusStore();

    useEffect(() => {
        if (projectId) {
            setCurrentProject(projectId);
        }
    }, [projectId, setCurrentProject]);

    if (!currentProject) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <ModernSidebar />
            <NexusSidebar />

            <main className="flex-1 ml-[calc(5rem+16rem)] flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 px-8 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0 z-30">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: currentProject.color || '#6366f1' }}>
                            {currentProject.key}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 leading-none mb-1">{currentProject.name}</h1>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>Software Project</span>
                                <span>•</span>
                                <span>{tasks.length} issues</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex p-1 bg-slate-100 rounded-lg">
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                    viewMode === 'kanban' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                Kanban
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                    viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('timeline')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                    viewMode === 'timeline' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                Timeline
                            </button>
                        </div>

                        <div className="h-6 w-px bg-slate-200 mx-1" />

                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                            <Filter className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                            <Users className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                            <Settings className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => openCreateTask('todo')}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Task</span>
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-slate-50 p-6">
                    {viewMode === 'kanban' && (
                        <NexusKanbanBoard tasks={tasks} />
                    )}

                    {viewMode === 'list' && (
                        <NexusListView tasks={tasks} />
                    )}

                    {viewMode === 'timeline' && (
                        <NexusTimelineView tasks={tasks} />
                    )}
                </div>
            </main>
            <NexusTaskModal />
        </div>
    );
}
