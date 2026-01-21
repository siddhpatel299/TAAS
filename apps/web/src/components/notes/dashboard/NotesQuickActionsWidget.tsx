import { motion } from 'framer-motion';
import { Plus, FolderPlus, Search, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notesApi } from '@/lib/notes-api';
import { useState } from 'react';

export function NotesQuickActionsWidget() {
    const navigate = useNavigate();
    const [creating, setCreating] = useState(false);

    const handleCreateNote = async () => {
        try {
            setCreating(true);
            const res = await notesApi.createNote({
                title: 'Untitled',
            });
            navigate(`/plugins/notes/${res.data.data.id}`);
        } catch (error) {
            console.error('Failed to create note:', error);
            // Fallback
            navigate('/plugins/notes/list');
        } finally {
            setCreating(false);
        }
    };

    const actions = [
        {
            label: 'New Note',
            icon: creating ? Loader2 : Plus,
            color: 'bg-cyan-500',
            onClick: handleCreateNote,
            iconClass: creating ? 'animate-spin' : ''
        },
        {
            label: 'New Folder',
            icon: FolderPlus,
            color: 'bg-blue-500',
            onClick: () => navigate('/plugins/notes/list') // Ideally open folder dialog
        },
        {
            label: 'Search',
            icon: Search,
            color: 'bg-purple-500',
            onClick: () => navigate('/plugins/notes/list')
        },
        {
            label: 'All Notes',
            icon: FileText,
            color: 'bg-amber-500',
            onClick: () => navigate('/plugins/notes/list')
        }
    ];

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
                {actions.map((action, index) => (
                    <motion.button
                        key={action.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.onClick}
                        disabled={creating}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors gap-2 group disabled:opacity-50"
                    >
                        <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center text-white shadow-lg group-hover:shadow-md transition-all`}>
                            <action.icon className={`w-5 h-5 ${action.iconClass}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
