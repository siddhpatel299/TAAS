import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Folder, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { NexusSidebar } from '@/components/nexus/NexusSidebar';
import { useNexusStore } from '@/stores/nexus.store';
import { Link, useNavigate } from 'react-router-dom';
import { useOSStore } from '@/stores/os.store';
import { HUDAppLayout, HUDCard } from '@/components/hud';

export function NexusDashboardPage() {
    const navigate = useNavigate();
    const { projects, fetchProjects, createProject } = useNexusStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        setIsCreating(true);
        try {
            const project = await createProject({
                name: newProjectName,
                key: newProjectName.substring(0, 3).toUpperCase(),
                color: '#6366f1'
            });
            setNewProjectName('');
            navigate(`/plugins/nexus/projects/${project.id}`);
        } catch (err) {
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    const osStyle = useOSStore((s) => s.osStyle);
    const isHUD = osStyle === 'hud';

    if (isHUD) {
        return (
            <div className="h-full min-h-0 flex flex-col">
                <HUDAppLayout title="NEXUS">
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(0,255,255,0.9)' }}>
                            PROJECTS
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <HUDCard accent>
                                <form onSubmit={handleCreateProject} className="p-4 flex flex-col items-center justify-center min-h-[140px]">
                                    <Plus className="w-8 h-8 mb-3 opacity-60" style={{ color: '#22d3ee' }} />
                                    <input
                                        type="text"
                                        placeholder="Project Name..."
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full max-w-[180px] px-3 py-2 text-xs bg-cyan-500/5 border border-cyan-500/30 rounded text-cyan-200 placeholder-cyan-500/50"
                                    />
                                    {newProjectName && (
                                        <button
                                            type="submit"
                                            disabled={isCreating}
                                            className="mt-2 hud-btn hud-btn-primary px-4 py-1.5 text-xs"
                                        >
                                            {isCreating ? 'Creating...' : 'Create'}
                                        </button>
                                    )}
                                </form>
                            </HUDCard>
                            {projects.map((project) => (
                                <Link key={project.id} to={`/plugins/nexus/projects/${project.id}`}>
                                    <HUDCard>
                                        <div className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: project.color || '#6366f1', color: '#fff' }}>
                                                    {project.key}
                                                </div>
                                                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,255,255,0.1)', color: '#67e8f9' }}>
                                                    {project.status}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold mb-1" style={{ color: '#67e8f9' }}>{project.name}</h4>
                                            <p className="text-[10px] line-clamp-2 mb-3 opacity-70" style={{ color: 'rgba(0,255,255,0.8)' }}>
                                                {project.description || 'No description'}
                                            </p>
                                            <div className="flex items-center justify-between text-[10px]" style={{ color: 'rgba(0,255,255,0.6)' }}>
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {project._count?.tasks || 0} Tasks
                                                </span>
                                                <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </HUDCard>
                                </Link>
                            ))}
                        </div>
                    </div>
                </HUDAppLayout>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <ModernSidebar />
            <NexusSidebar />

            <main className="flex-1 ml-[calc(5rem+16rem)] p-12">
                {/* Header */}
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
                        <p className="text-slate-500">Welcome back to Nexus. Here's what's happening.</p>
                    </div>
                    <div className="flex gap-3">
                        {/* Add global actions here if needed */}
                    </div>
                </div>

                {/* Create Project Section */}
                <div className="mb-12">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Folder className="w-5 h-5 text-indigo-500" />
                        Your Projects
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Create New Card */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-6 flex flex-col justify-center items-center min-h-[200px] cursor-pointer hover:border-indigo-300 hover:bg-slate-50 transition-all group"
                        >
                            <form onSubmit={handleCreateProject} className="w-full flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                                    <Plus className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                                </div>
                                <h3 className="text-base font-medium text-slate-900 mb-2">Create New Project</h3>
                                <div className="w-full max-w-[200px]">
                                    <input
                                        type="text"
                                        placeholder="Project Name..."
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    {newProjectName && (
                                        <button
                                            type="submit"
                                            disabled={isCreating}
                                            className="mt-2 w-full py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            {isCreating ? 'Creating...' : 'Create Project'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </motion.div>

                        {/* Project Cards */}
                        {projects.map((project) => (
                            <Link key={project.id} to={`/plugins/nexus/projects/${project.id}`}>
                                <motion.div
                                    whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
                                    className="bg-white rounded-xl border border-slate-200 p-6 h-[200px] flex flex-col shadow-sm"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: project.color || '#6366f1' }}>
                                            {project.key}
                                        </div>
                                        <div className="px-2 py-1 rounded bg-slate-100 text-xs font-semibold text-slate-600 uppercase">
                                            {project.status}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-1">{project.name}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-auto">{project.description || "No description provided."}</p>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4" />
                                                {project._count?.tasks || 0} Tasks
                                            </span>
                                        </div>
                                        <span className="flex items-center gap-1 text-indigo-600 font-medium group">
                                            Open <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </span>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity or Stats could go here */}
            </main>
        </div>
    );
}
