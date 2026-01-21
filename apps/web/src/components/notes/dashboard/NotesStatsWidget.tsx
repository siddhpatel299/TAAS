import { motion } from 'framer-motion';
import {
    FileText,
    FolderOpen,
    Pin,
    Star,
    Archive,
    Trash2,
    Tag,
    TrendingUp,
} from 'lucide-react';
import { NotesDashboard } from '@/lib/notes-api';

interface NotesStatsWidgetProps {
    stats: NotesDashboard;
}

export function NotesStatsWidget({ stats }: NotesStatsWidgetProps) {
    const statItems = [
        {
            label: 'Total Notes',
            value: stats.totalNotes,
            icon: FileText,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            label: 'Folders',
            value: stats.folderCount,
            icon: FolderOpen,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600'
        },
        {
            label: 'Pinned',
            value: stats.pinnedCount,
            icon: Pin,
            iconBg: 'bg-pink-100',
            iconColor: 'text-pink-600'
        },
        {
            label: 'Favorites',
            value: stats.favoriteCount,
            icon: Star,
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600'
        },
    ];

    const secondaryItems = [
        { label: 'Tags', value: stats.tagCount, icon: Tag, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Archived', value: stats.archivedCount, icon: Archive, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Trash', value: stats.trashedCount, icon: Trash2, color: 'text-red-500', bg: 'bg-red-50' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Note Stats</h3>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {statItems.map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className={`w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                        <p className="text-sm text-gray-500">{item.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Secondary items */}
            <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-around gap-2">
                    {secondaryItems.map((item, index) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="text-center flex-1"
                        >
                            <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-2 hover:bg-gray-100 transition-colors cursor-pointer`}>
                                <item.icon className={`w-4 h-4 ${item.color}`} />
                            </div>
                            <p className="text-lg font-semibold text-gray-900">{item.value}</p>
                            <p className="text-xs text-gray-500">{item.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
