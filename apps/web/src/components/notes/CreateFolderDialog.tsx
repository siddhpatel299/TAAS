import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    FolderOpen,
    Palette,
    Smile,
} from 'lucide-react';
import { useNotesStore } from '@/stores/notes.store';
import { cn } from '@/lib/utils';

// Color options for folders
const FOLDER_COLORS = [
    { name: 'Default', color: null },
    { name: 'Red', color: '#ef4444' },
    { name: 'Orange', color: '#f97316' },
    { name: 'Amber', color: '#f59e0b' },
    { name: 'Lime', color: '#84cc16' },
    { name: 'Green', color: '#22c55e' },
    { name: 'Teal', color: '#14b8a6' },
    { name: 'Cyan', color: '#06b6d4' },
    { name: 'Sky', color: '#0ea5e9' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Indigo', color: '#6366f1' },
    { name: 'Violet', color: '#8b5cf6' },
    { name: 'Purple', color: '#a855f7' },
    { name: 'Fuchsia', color: '#d946ef' },
    { name: 'Pink', color: '#ec4899' },
    { name: 'Rose', color: '#f43f5e' },
];

// Common folder icons (emojis)
const FOLDER_ICONS = [
    '📁', '📂', '📌', '⭐', '💼', '📚', '📖', '📝',
    '💡', '🎯', '🔖', '📎', '📋', '🗂️', '💾', '🏠',
    '🏢', '🎓', '🎨', '💻', '🔬', '🧪', '📊', '📈'
];

interface CreateFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    parentId?: string;
}

export function CreateFolderDialog({ isOpen, onClose, parentId }: CreateFolderDialogProps) {
    const { createFolder, isLoading } = useNotesStore();
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Folder name is required');
            return;
        }

        try {
            await createFolder({
                name: name.trim(),
                parentId,
                color: selectedColor || undefined,
                icon: selectedIcon || undefined,
            });
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create folder');
        }
    };

    const handleClose = () => {
        setName('');
        setSelectedColor(null);
        setSelectedIcon(null);
        setShowColorPicker(false);
        setShowIconPicker(false);
        setError(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 z-[9999]"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.15 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Create New Folder
                                </h2>
                                <button
                                    onClick={handleClose}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                {/* Name Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Folder Name
                                    </label>
                                    <div className="relative">
                                        <FolderOpen
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                            style={{ color: selectedColor || undefined }}
                                        />
                                        {selectedIcon && (
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                                                {selectedIcon}
                                            </span>
                                        )}
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value);
                                                setError(null);
                                            }}
                                            placeholder="Enter folder name..."
                                            className={cn(
                                                'w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm',
                                                'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent',
                                                error ? 'border-red-500' : 'border-gray-200'
                                            )}
                                            autoFocus
                                        />
                                    </div>
                                    {error && (
                                        <p className="mt-1 text-sm text-red-500">{error}</p>
                                    )}
                                </div>

                                {/* Customization Row */}
                                <div className="flex items-center gap-3">
                                    {/* Color Picker */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowColorPicker(!showColorPicker);
                                                setShowIconPicker(false);
                                            }}
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm',
                                                'hover:bg-gray-50 transition-colors',
                                                showColorPicker ? 'border-sky-500 bg-sky-50' : 'border-gray-200'
                                            )}
                                        >
                                            <Palette className="w-4 h-4" style={{ color: selectedColor || '#6b7280' }} />
                                            <span>Color</span>
                                        </button>

                                        {showColorPicker && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-10"
                                            >
                                                <div className="grid grid-cols-4 gap-2">
                                                    {FOLDER_COLORS.map((c) => (
                                                        <button
                                                            key={c.name}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedColor(c.color);
                                                                setShowColorPicker(false);
                                                            }}
                                                            className={cn(
                                                                'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
                                                                selectedColor === c.color ? 'border-gray-800 scale-110' : 'border-transparent'
                                                            )}
                                                            style={{ backgroundColor: c.color || '#e5e7eb' }}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Icon Picker */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowIconPicker(!showIconPicker);
                                                setShowColorPicker(false);
                                            }}
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm',
                                                'hover:bg-gray-50 transition-colors',
                                                showIconPicker ? 'border-sky-500 bg-sky-50' : 'border-gray-200'
                                            )}
                                        >
                                            {selectedIcon ? (
                                                <span className="text-base">{selectedIcon}</span>
                                            ) : (
                                                <Smile className="w-4 h-4 text-gray-500" />
                                            )}
                                            <span>Icon</span>
                                        </button>

                                        {showIconPicker && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-10"
                                            >
                                                <div className="grid grid-cols-6 gap-1">
                                                    {FOLDER_ICONS.map((icon) => (
                                                        <button
                                                            key={icon}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedIcon(selectedIcon === icon ? null : icon);
                                                                setShowIconPicker(false);
                                                            }}
                                                            className={cn(
                                                                'w-8 h-8 flex items-center justify-center rounded-lg text-lg',
                                                                'hover:bg-gray-100 transition-colors',
                                                                selectedIcon === icon && 'bg-sky-100'
                                                            )}
                                                        >
                                                            {icon}
                                                        </button>
                                                    ))}
                                                </div>
                                                {selectedIcon && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedIcon(null);
                                                            setShowIconPicker(false);
                                                        }}
                                                        className="mt-2 w-full text-xs text-gray-500 hover:text-gray-700"
                                                    >
                                                        Remove Icon
                                                    </button>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !name.trim()}
                                        className={cn(
                                            'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                                            'bg-gradient-to-r from-sky-500 to-blue-600',
                                            'hover:from-sky-600 hover:to-blue-700',
                                            'disabled:opacity-50 disabled:cursor-not-allowed',
                                            'flex items-center gap-2'
                                        )}
                                    >
                                        {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                        Create Folder
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
