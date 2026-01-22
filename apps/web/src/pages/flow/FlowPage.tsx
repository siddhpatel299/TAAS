import { useEffect, useState } from 'react';
import { useFlowStore, Workflow } from '@/stores/flow.store';
import { FlowEditorWithProvider } from '@/components/flow/FlowEditor';
import { Plus, Zap, Play, Pause, Trash2, Edit2, Save, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FlowPage() {
    const {
        workflows,
        currentWorkflow,
        isLoading,
        fetchWorkflows,
        createWorkflow,
        deleteWorkflow,
        setCurrentWorkflow,
        updateWorkflow,
        saveWorkflow,
        fetchWorkflowRuns,
        workflowRuns,
    } = useFlowStore();

    const [showEditor, setShowEditor] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [newWorkflowName, setNewWorkflowName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchWorkflows();
    }, [fetchWorkflows]);

    const handleCreateWorkflow = async () => {
        if (!newWorkflowName.trim()) return;
        setIsCreating(true);
        try {
            const workflow = await createWorkflow({
                name: newWorkflowName,
                triggerType: 'manual',
                isActive: false,
            });
            setNewWorkflowName('');
            setCurrentWorkflow(workflow.id);
            setShowEditor(true);
        } finally {
            setIsCreating(false);
        }
    };

    const handleOpenWorkflow = (workflow: Workflow) => {
        setCurrentWorkflow(workflow.id);
        setShowEditor(true);
    };

    const handleToggleActive = async (workflow: Workflow) => {
        await updateWorkflow(workflow.id, { isActive: !workflow.isActive });
    };

    const handleDeleteWorkflow = async (id: string) => {
        if (confirm('Are you sure you want to delete this workflow?')) {
            await deleteWorkflow(id);
            if (currentWorkflow?.id === id) {
                setShowEditor(false);
            }
        }
    };

    const handleSave = async () => {
        await saveWorkflow();
    };

    if (showEditor && currentWorkflow) {
        return (
            <div className="h-screen flex flex-col bg-slate-950">
                {/* Editor Header */}
                <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowEditor(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            ← Back
                        </button>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-400" />
                            <span className="font-semibold text-white">{currentWorkflow.name}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setShowHistory(true);
                                fetchWorkflowRuns(currentWorkflow.id);
                            }}
                            className="bg-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Clock className="w-4 h-4" />
                            History
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                        <button
                            onClick={() => handleToggleActive(currentWorkflow)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                                currentWorkflow.isActive
                                    ? 'bg-red-600 hover:bg-red-500 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            )}
                        >
                            {currentWorkflow.isActive ? (
                                <>
                                    <Pause className="w-4 h-4" />
                                    Deactivate
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    Activate
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {/* Editor Canvas */}
                <div className="flex-1">
                    <FlowEditorWithProvider />
                </div>

                {/* History Modal */}
                {
                    showHistory && (
                        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
                            <div className="w-[400px] h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                                    <h3 className="font-semibold text-white flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-400" />
                                        Execution History
                                    </h3>
                                    <button
                                        onClick={() => setShowHistory(false)}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {workflowRuns.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            No runs recorded yet.
                                        </div>
                                    ) : (
                                        workflowRuns.map((run) => (
                                            <div key={run.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded textxs font-medium uppercase",
                                                        run.status === 'success' ? "bg-emerald-500/20 text-emerald-400" :
                                                            run.status === 'failed' ? "bg-red-500/20 text-red-400" :
                                                                "bg-blue-500/20 text-blue-400"
                                                    )}>
                                                        {run.status}
                                                    </span>
                                                    <span className="text-slate-400 text-xs">
                                                        {new Date(run.startedAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                {/* Simple Logs View */}
                                                {run.logs && run.logs.length > 0 && (
                                                    <div className="mt-2 text-xs font-mono bg-black/30 p-2 rounded text-slate-400 max-h-32 overflow-y-auto whitespace-pre-wrap">
                                                        {Array.isArray(run.logs) ? run.logs.join('\n') : JSON.stringify(run.logs)}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        );
    }

    // Workflow List View
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Zap className="w-8 h-8 text-amber-400" />
                            Flow Automation
                        </h1>
                        <p className="text-slate-400 mt-1">
                            Build automated workflows that connect your apps and services
                        </p>
                    </div>
                </div>

                {/* Create New Workflow */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">Create New Workflow</h2>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newWorkflowName}
                            onChange={(e) => setNewWorkflowName(e.target.value)}
                            placeholder="Enter workflow name..."
                            className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkflow()}
                        />
                        <button
                            onClick={handleCreateWorkflow}
                            disabled={isCreating || !newWorkflowName.trim()}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-400 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-5 h-5" />
                            Create
                        </button>
                    </div>
                </div>

                {/* Workflows Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading && workflows.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-400">
                            Loading workflows...
                        </div>
                    ) : workflows.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <Zap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-400">No workflows yet</h3>
                            <p className="text-slate-500 mt-2">
                                Create your first workflow to start automating tasks
                            </p>
                        </div>
                    ) : (
                        workflows.map((workflow) => (
                            <div
                                key={workflow.id}
                                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-slate-600 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                'p-2 rounded-lg',
                                                workflow.isActive
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-slate-700/50 text-slate-400'
                                            )}
                                        >
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{workflow.name}</h3>
                                            <span
                                                className={cn(
                                                    'text-xs px-2 py-0.5 rounded-full',
                                                    workflow.isActive
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-slate-700/50 text-slate-400'
                                                )}
                                            >
                                                {workflow.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {workflow.description && (
                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                        {workflow.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 pt-4 border-t border-slate-700/50">
                                    <button
                                        onClick={() => handleOpenWorkflow(workflow)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(workflow)}
                                        className={cn(
                                            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors',
                                            workflow.isActive
                                                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                                                : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                                        )}
                                    >
                                        {workflow.isActive ? (
                                            <>
                                                <Pause className="w-4 h-4" />
                                                Stop
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4" />
                                                Start
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteWorkflow(workflow.id)}
                                        className="p-2 bg-slate-700/50 text-slate-400 rounded-lg hover:bg-red-600/20 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
