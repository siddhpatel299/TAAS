import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Menu,
    X,
    Bell,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { NotesStatsWidget } from '@/components/notes/dashboard/NotesStatsWidget';
import { NotesQuickActionsWidget } from '@/components/notes/dashboard/NotesQuickActionsWidget';
import { RecentNotesWidget } from '@/components/notes/dashboard/RecentNotesWidget';
import { useAuthStore } from '@/stores/auth.store';
import { notesApi, NotesDashboard } from '@/lib/notes-api';

export function NotesDashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState<NotesDashboard | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const userName = user?.firstName || user?.username || 'User';

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const res = await notesApi.getDashboard();
                if (res.data.success) {
                    setDashboard(res.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch notes dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/plugins/notes/list?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex">
            {/* Sidebar - Hidden on mobile, shown on md+ */}
            <div className="hidden md:block">
                <ModernSidebar />
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: -100 }}
                            animate={{ x: 0 }}
                            exit={{ x: -100 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="fixed left-0 top-0 bottom-0 w-20 z-50 md:hidden"
                        >
                            <ModernSidebar />
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="absolute top-4 right-[-48px] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 md:ml-20 p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                        >
                            <Menu className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl sm:text-3xl font-bold text-gray-900"
                            >
                                Notes Dashboard
                            </motion.h1>
                            <p className="text-gray-500 mt-1 text-sm sm:text-base">
                                Manage your ideas and documents.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Search */}
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search notes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                                className="pl-12 pr-4 py-3 w-48 lg:w-80 bg-white border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        {/* Notifications */}
                        <button className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                        </button>

                        {/* User Avatar */}
                        <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-xl sm:rounded-2xl px-2 sm:px-4 py-2 shadow-sm">
                            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                                <AvatarImage src={user?.avatarUrl} />
                                <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-sm">
                                    {userName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </header>

                {loading || !dashboard ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Stats & Recent */}
                        <div className="lg:col-span-2 space-y-8">
                            <NotesStatsWidget stats={dashboard} />
                            <RecentNotesWidget notes={dashboard.recentNotes} />
                        </div>

                        {/* Right Column - Quick Actions & Information */}
                        <div className="space-y-8">
                            <NotesQuickActionsWidget />

                            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-cyan-500/20">
                                <h3 className="font-semibold text-lg mb-2">Did you know?</h3>
                                <p className="text-cyan-50 text-sm leading-relaxed">
                                    You can use markdown shortcuts while writing. Type <code className="bg-white/20 px-1 py-0.5 rounded text-white">#</code> for a heading, <code className="bg-white/20 px-1 py-0.5 rounded text-white">-</code> for a list, or <code className="bg-white/20 px-1 py-0.5 rounded text-white">/</code> for commands.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
