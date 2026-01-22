import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, FileText, ArrowUpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const POLLING_INTERVAL = 60 * 1000; // Check every minute
const VERSION_URL = '/version.json';

interface VersionData {
    version: string;
    buildId: string;
    timestamp: string;
}

export function UpdateNotification() {
    const [currentBuildId, setCurrentBuildId] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    // Load initial build version from script tag or calculate (simulation for now)
    useEffect(() => {
        // Initial fetch to set the baseline
        const fetchInitialVersion = async () => {
            try {
                const res = await fetch(VERSION_URL);
                if (res.ok) {
                    const data: VersionData = await res.json();
                    setCurrentBuildId(data.buildId);
                }
            } catch (error) {
                console.warn('Failed to fetch initial version', error);
            }
        };
        fetchInitialVersion();
    }, []);

    // Poll for updates
    useEffect(() => {
        if (!currentBuildId) return;

        const checkForUpdates = async () => {
            try {
                const res = await fetch(VERSION_URL + '?t=' + new Date().getTime()); // Prevent caching
                if (res.ok) {
                    const data: VersionData = await res.json();
                    if (data.buildId !== currentBuildId) {
                        setIsVisible(true);
                    }
                }
            } catch (error) {
                console.error('Update check failed', error);
            }
        };

        const intervalId = setInterval(checkForUpdates, POLLING_INTERVAL);
        return () => clearInterval(intervalId);
    }, [currentBuildId]);

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
                >
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ring-1 ring-slate-900/5">
                        <div className="p-4 flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <ArrowUpCircle className="w-6 h-6 text-indigo-600 animate-pulse" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">New Version Available</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    A new version of the application has been deployed. Refresh to apply updates.
                                </p>
                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={handleRefresh}
                                        className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Refresh Now
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/changelog');
                                            setIsVisible(false);
                                        }}
                                        className="inline-flex justify-center items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600"
                                    >
                                        <FileText className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="text-slate-400 hover:text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Progress/Timer bar (optional, removing for cleaner look) */}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
