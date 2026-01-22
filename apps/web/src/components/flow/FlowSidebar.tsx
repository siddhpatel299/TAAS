import { useMemo } from 'react';
import {
    Zap,
    Mail,
    Bell,
    FolderInput,
    FileUp,
    CheckCircle,
    Clock,
    MessageSquare,
    Filter,
} from 'lucide-react';

interface NodeTemplate {
    type: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    iconKey: string;
    category: 'triggers' | 'actions' | 'logic';
}

const nodeTemplates: NodeTemplate[] = [
    // Triggers
    {
        type: 'trigger',
        label: 'Task Created',
        description: 'When a new Nexus task is created',
        icon: CheckCircle,
        iconKey: 'task_complete',
        category: 'triggers',
    },
    {
        type: 'trigger',
        label: 'Task Completed',
        description: 'When a Nexus task is marked done',
        icon: CheckCircle,
        iconKey: 'task_complete',
        category: 'triggers',
    },
    {
        type: 'trigger',
        label: 'File Uploaded',
        description: 'When a file is uploaded to Storage',
        icon: FileUp,
        iconKey: 'file_upload',
        category: 'triggers',
    },
    {
        type: 'trigger',
        label: 'Scheduled (Cron)',
        description: 'Run on a schedule',
        icon: Clock,
        iconKey: 'clock',
        category: 'triggers',
    },

    // Actions
    {
        type: 'action',
        label: 'Send Email',
        description: 'Send an email notification',
        icon: Mail,
        iconKey: 'email',
        category: 'actions',
    },
    {
        type: 'action',
        label: 'Send Notification',
        description: 'Push notification to user',
        icon: Bell,
        iconKey: 'notification',
        category: 'actions',
    },
    {
        type: 'action',
        label: 'Move File',
        description: 'Move file to a folder',
        icon: FolderInput,
        iconKey: 'move_file',
        category: 'actions',
    },
    {
        type: 'action',
        label: 'Add Comment',
        description: 'Add a comment to a task',
        icon: MessageSquare,
        iconKey: 'comment',
        category: 'actions',
    },
    {
        type: 'action',
        label: 'Create Task',
        description: 'Create a new Nexus task',
        icon: CheckCircle,
        iconKey: 'task_complete',
        category: 'actions',
    },

    // Logic
    {
        type: 'condition',
        label: 'If / Else',
        description: 'Branch based on condition',
        icon: Filter,
        iconKey: 'filter',
        category: 'logic',
    },
    {
        type: 'delay',
        label: 'Wait',
        description: 'Pause for a duration',
        icon: Clock,
        iconKey: 'clock',
        category: 'logic',
    },
];

interface FlowSidebarProps {
    onDragStart: (event: React.DragEvent, nodeType: string, nodeData: any) => void;
}

export function FlowSidebar({ onDragStart }: FlowSidebarProps) {
    const groupedNodes = useMemo(() => {
        return {
            triggers: nodeTemplates.filter((n) => n.category === 'triggers'),
            actions: nodeTemplates.filter((n) => n.category === 'actions'),
            logic: nodeTemplates.filter((n) => n.category === 'logic'),
        };
    }, []);

    const renderCategory = (title: string, nodes: NodeTemplate[], color: string) => (
        <div className="mb-6">
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${color}`}>
                {title}
            </h3>
            <div className="space-y-2">
                {nodes.map((node) => (
                    <div
                        key={node.label}
                        className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-grab hover:bg-slate-700/50 transition-colors border border-slate-700/50 hover:border-slate-600"
                        draggable
                        onDragStart={(e) =>
                            onDragStart(e, node.type, {
                                label: node.label,
                                description: node.description,
                                icon: node.iconKey,
                            })
                        }
                    >
                        <div
                            className={`p-2 rounded-lg ${node.category === 'triggers'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : node.category === 'actions'
                                        ? 'bg-indigo-500/20 text-indigo-400'
                                        : 'bg-amber-500/20 text-amber-400'
                                }`}
                        >
                            <node.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{node.label}</div>
                            <div className="text-xs text-slate-400 truncate">{node.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <aside className="w-72 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Node Library
                </h2>
                <p className="text-xs text-slate-400 mt-1">Drag nodes to the canvas</p>
            </div>

            {renderCategory('Triggers', groupedNodes.triggers, 'text-emerald-400')}
            {renderCategory('Actions', groupedNodes.actions, 'text-indigo-400')}
            {renderCategory('Logic', groupedNodes.logic, 'text-amber-400')}
        </aside>
    );
}
