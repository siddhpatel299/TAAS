import { Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid,
    Plus,
    Settings,
    Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNexusStore } from '@/stores/nexus.store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function NexusSidebar() {
    const location = useLocation();
    const { projects } = useNexusStore();

    return (
        <aside className="fixed left-20 top-0 h-full w-64 bg-slate-50 border-r border-slate-200 flex flex-col py-6 z-40">
            {/* Header */}
            <div className="px-6 mb-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                    <Layers className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Nexus</h1>
            </div>

            {/* Main Nav */}
            <nav className="flex-1 px-4 space-y-1">
                <div className="mb-6">
                    <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Overview
                    </p>
                    <Link
                        to="/plugins/nexus"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            location.pathname === '/plugins/nexus' || location.pathname === '/plugins/nexus/'
                                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Dashboard
                    </Link>
                </div>

                {/* Projects List */}
                <div className="mb-6">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Projects
                        </p>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-500 hover:text-indigo-600">
                                    <Plus className="w-3 h-3" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Create Project</TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="space-y-0.5">
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                to={`/plugins/nexus/projects/${project.id}`}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    location.pathname.includes(project.id)
                                        ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color || '#6366f1' }} />
                                <span className="truncate">{project.name}</span>
                            </Link>
                        ))}

                        {projects.length === 0 && (
                            <p className="px-3 py-2 text-sm text-slate-400 italic">No projects yet</p>
                        )}
                    </div>
                </div>
            </nav>

            {/* Bottom Actions */}
            <div className="px-4 mt-auto">
                <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                </button>
            </div>
        </aside>
    );
}
