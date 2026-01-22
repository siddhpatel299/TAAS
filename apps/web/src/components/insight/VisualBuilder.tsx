import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { useInsightStore, WidgetConfig } from '@/stores/insight.store';
import { WIDGET_REGISTRY, getWidgetComponent } from './WidgetRegistry';
import { cn } from '@/lib/utils';
import { GripVertical, Plus, X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sortable Item Component ---

const SortableWidget = ({ widget, isEditMode, onRemove }: { widget: WidgetConfig, isEditMode: boolean, onRemove: (id: string) => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: widget.id, disabled: !isEditMode });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    const WidgetComponent = getWidgetComponent(widget.type);

    // Size classes
    const sizeClasses = {
        small: 'col-span-1 row-span-1',
        medium: 'col-span-1 md:col-span-2 row-span-1',
        large: 'col-span-1 md:col-span-2 lg:col-span-2 row-span-2',
        full: 'col-span-full row-span-2',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "bg-white rounded-2xl border border-gray-100 shadow-sm relative group transition-shadow",
                sizeClasses[widget.size],
                isEditMode && "border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/10 cursor-default",
                isDragging && "opacity-50 shadow-xl ring-2 ring-blue-500 scale-105"
            )}
        >
            {/* Edit Mode Controls */}
            {isEditMode && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-100">
                    <div
                        {...attributes}
                        {...listeners}
                        className="p-1.5 bg-white text-gray-400 hover:text-gray-700 rounded-lg shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:bg-gray-50"
                    >
                        <GripVertical className="w-4 h-4" />
                    </div>
                    <button
                        onClick={() => onRemove(widget.id)}
                        className="p-1.5 bg-white text-red-400 hover:text-red-600 rounded-lg shadow-sm border border-gray-100 hover:bg-red-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Widget Content */}
            <div className="p-6 h-full overflow-hidden">
                <WidgetComponent widget={widget} />
            </div>
        </div>
    );
};

// --- Main Visual Builder Component ---

export function VisualBuilder() {
    const { widgets, isEditMode, reorderWidgets, addWidget, removeWidget, toggleEditMode } = useInsightStore();
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = widgets.findIndex((w) => w.id === active.id);
            const newIndex = widgets.findIndex((w) => w.id === over.id);
            reorderWidgets(oldIndex, newIndex);
        }

        setActiveId(null);
    };

    const activeWidget = activeId ? widgets.find(w => w.id === activeId) : null;

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">Dashboard Layout</h2>
                    <div className="h-6 w-px bg-gray-200" />
                    <p className="text-sm text-gray-500">
                        {isEditMode ? 'Drag widgets to reorder. Click icons to add.' : 'Viewing dashboard.'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {isEditMode && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-2 mr-4"
                            >
                                {Object.entries(WIDGET_REGISTRY).map(([type, config]) => (
                                    <button
                                        key={type}
                                        onClick={() => addWidget({
                                            type: type as any,
                                            title: config.label,
                                            size: config.defaultSize as any,
                                            settings: {}
                                        })}
                                        className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-200"
                                        title={`Add ${config.label}`}
                                    >
                                        <config.icon className="w-5 h-5" />
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={toggleEditMode}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2",
                            isEditMode
                                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                    >
                        {isEditMode ? (
                            <>
                                <Minimize2 className="w-4 h-4" />
                                Done Editing
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-4 h-4" />
                                Customize
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Grid Area */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={widgets.map(w => w.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[240px]">
                        {widgets.map((widget) => (
                            <SortableWidget
                                key={widget.id}
                                widget={widget}
                                isEditMode={isEditMode}
                                onRemove={removeWidget}
                            />
                        ))}
                    </div>
                </SortableContext>

                <DragOverlay>
                    {activeWidget ? (
                        <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-xl p-6 opacity-90 cursor-grabbing">
                            {(() => {
                                const C = getWidgetComponent(activeWidget.type);
                                return <C widget={activeWidget} />;
                            })()}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {widgets.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Empty Dashboard</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-6">
                        Your canvas is empty. Click "Customize" and add widgets to start building your personal command center.
                    </p>
                    <button
                        onClick={toggleEditMode}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-500/20"
                    >
                        Start Building
                    </button>
                </div>
            )}
        </div>
    );
}
