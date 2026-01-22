import { useCallback, useRef } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useFlowStore } from '@/stores/flow.store';
import { nodeTypes } from './FlowNodes';
import { FlowSidebar } from './FlowSidebar';

let id = 0;
const getId = () => `node_${id++}`;

export function FlowEditor() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes } = useFlowStore();

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow/type');
            const dataStr = event.dataTransfer.getData('application/reactflow/data');

            if (!type || !reactFlowInstance || !reactFlowWrapper.current) {
                return;
            }

            const data = JSON.parse(dataStr);
            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            const newNode = {
                id: getId(),
                type,
                position,
                data,
            };

            setNodes([...nodes, newNode]);
        },
        [reactFlowInstance, nodes, setNodes]
    );

    const onDragStart = (event: React.DragEvent, nodeType: string, nodeData: any) => {
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        event.dataTransfer.setData('application/reactflow/data', JSON.stringify(nodeData));
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="flex h-full bg-slate-950">
            <FlowSidebar onDragStart={onDragStart} />

            <div ref={reactFlowWrapper} className="flex-1">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-slate-950"
                >
                    <Background color="#334155" gap={20} />
                    <Controls className="!bg-slate-800 !border-slate-700 !rounded-lg [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!text-white [&>button:hover]:!bg-slate-700" />
                    <MiniMap
                        className="!bg-slate-800 !border-slate-700 !rounded-lg"
                        nodeColor={(node) => {
                            switch (node.type) {
                                case 'trigger':
                                    return '#10b981';
                                case 'action':
                                    return '#6366f1';
                                case 'condition':
                                    return '#f59e0b';
                                case 'delay':
                                    return '#64748b';
                                default:
                                    return '#6366f1';
                            }
                        }}
                    />
                </ReactFlow>
            </div>
        </div>
    );
}

// Wrap with provider for external use
import { useState } from 'react';

export function FlowEditorWithProvider() {
    return (
        <ReactFlowProvider>
            <FlowEditor />
        </ReactFlowProvider>
    );
}
