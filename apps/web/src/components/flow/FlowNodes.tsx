import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import {
    Zap,
    FileUp,
    CheckCircle,
    Mail,
    Bell,
    FolderInput,
    MessageSquare,
    Clock,
} from 'lucide-react';

// Node type definitions
export type FlowNodeType =
    | 'trigger'
    | 'action'
    | 'condition'
    | 'delay';

interface FlowNodeData {
    label: string;
    description?: string;
    type: FlowNodeType;
    icon?: string;
    config?: Record<string, any>;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    zap: Zap,
    file_upload: FileUp,
    task_complete: CheckCircle,
    email: Mail,
    notification: Bell,
    move_file: FolderInput,
    comment: MessageSquare,
    clock: Clock,
};

// Trigger Node (Entry Point)
export const TriggerNode = memo(({ data, selected }: NodeProps<FlowNodeData>) => {
    const Icon = iconMap[data.icon || 'zap'] || Zap;

    return (
        <div
            className={cn(
                'px-4 py-3 rounded-xl shadow-lg border-2 min-w-[180px]',
                'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
                selected ? 'border-white ring-2 ring-emerald-300' : 'border-emerald-400'
            )}
        >
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <div className="font-semibold text-sm">{data.label}</div>
                    {data.description && (
                        <div className="text-xs text-emerald-100 mt-0.5">{data.description}</div>
                    )}
                    {/* Cron Config Input - Simple Inline */}
                    {data.icon === 'clock' && (
                        <div className="mt-2 nodrag">
                            <input
                                className="text-black text-xs px-2 py-1 rounded w-full"
                                placeholder="*/5 * * * *"
                                defaultValue={data.config?.cronExpression}
                                onChange={(e) => {
                                    // Hacky way to update data for now without full store action 
                                    // In a real app, use useReactFlow().setNodes(...)
                                    // But data is mutable reference in React Flow sometimes? 
                                    // Ideally we need to uplift this state. 
                                    // For MVP, we assume the parent captures this via node changes or we just mutate data.
                                    if (!data.config) data.config = {};
                                    data.config.cronExpression = e.target.value;
                                }}
                            />
                            <div className="text-[10px] text-emerald-200 mt-0.5">Cron Expression</div>
                        </div>
                    )}
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-white border-2 border-emerald-600"
            />
        </div>
    );
});
TriggerNode.displayName = 'TriggerNode';

// Action Node
export const ActionNode = memo(({ data, selected }: NodeProps<FlowNodeData>) => {
    const Icon = iconMap[data.icon || 'zap'] || Zap;

    return (
        <div
            className={cn(
                'px-4 py-3 rounded-xl shadow-lg border-2 min-w-[180px]',
                'bg-gradient-to-br from-indigo-500 to-purple-600 text-white',
                selected ? 'border-white ring-2 ring-indigo-300' : 'border-indigo-400'
            )}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-white border-2 border-indigo-600"
            />
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <div className="font-semibold text-sm">{data.label}</div>
                    {data.description && (
                        <div className="text-xs text-indigo-100 mt-0.5">{data.description}</div>
                    )}
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-white border-2 border-indigo-600"
            />
        </div>
    );
});
ActionNode.displayName = 'ActionNode';

// Condition Node
export const ConditionNode = memo(({ data, selected }: NodeProps<FlowNodeData>) => {
    return (
        <div
            className={cn(
                'px-4 py-3 rounded-xl shadow-lg border-2 min-w-[180px]',
                'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
                selected ? 'border-white ring-2 ring-amber-300' : 'border-amber-400'
            )}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-white border-2 border-amber-600"
            />
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                    <Zap className="w-4 h-4" />
                </div>
                <div>
                    <div className="font-semibold text-sm">{data.label}</div>
                    {data.description && (
                        <div className="text-xs text-amber-100 mt-0.5">{data.description}</div>
                    )}
                </div>
            </div>
            {/* Two outputs: Yes / No */}
            <div className="flex justify-between mt-2 text-xs">
                <span className="text-green-200">Yes</span>
                <span className="text-red-200">No</span>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="yes"
                style={{ left: '30%' }}
                className="w-3 h-3 !bg-green-400 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="no"
                style={{ left: '70%' }}
                className="w-3 h-3 !bg-red-400 border-2 border-white"
            />
        </div>
    );
});
ConditionNode.displayName = 'ConditionNode';

// Delay Node
export const DelayNode = memo(({ data, selected }: NodeProps<FlowNodeData>) => {
    return (
        <div
            className={cn(
                'px-4 py-3 rounded-xl shadow-lg border-2 min-w-[180px]',
                'bg-gradient-to-br from-slate-500 to-slate-700 text-white',
                selected ? 'border-white ring-2 ring-slate-300' : 'border-slate-400'
            )}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-white border-2 border-slate-600"
            />
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                    <Clock className="w-4 h-4" />
                </div>
                <div>
                    <div className="font-semibold text-sm">{data.label}</div>
                    {data.description && (
                        <div className="text-xs text-slate-300 mt-0.5">{data.description}</div>
                    )}
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-white border-2 border-slate-600"
            />
        </div>
    );
});
DelayNode.displayName = 'DelayNode';

// Export node types map for React Flow
export const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    condition: ConditionNode,
    delay: DelayNode,
};
