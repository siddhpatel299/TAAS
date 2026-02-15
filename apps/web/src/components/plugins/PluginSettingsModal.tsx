import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Shield, Bell, Zap, Save } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Plugin } from '@/lib/plugins-api';

interface PluginSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    plugin: Plugin | null;
}

const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'advanced', label: 'Advanced', icon: Zap },
];

export function PluginSettingsModal({ isOpen, onClose, plugin }: PluginSettingsModalProps) {
    const [activeTab, setActiveTab] = useState('general');

    if (!plugin) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-colors"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
                    >
                        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[85vh]">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20",
                                        "bg-gradient-to-br from-purple-500 to-indigo-600" // Fallback gradient, could pass dynamic one
                                    )}>
                                        <Settings className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{plugin.name}</h2>
                                        <p className="text-sm text-slate-500">Plugin Settings</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex flex-1 overflow-hidden">
                                {/* Sidebar Tabs */}
                                <div className="w-48 bg-slate-50 border-r border-slate-100 p-4 space-y-1">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={cn(
                                                "w-full px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors",
                                                activeTab === tab.id
                                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5"
                                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                            )}
                                        >
                                            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-purple-600" : "text-slate-400")} />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 p-8 overflow-y-auto">
                                    <div className="max-w-md">
                                        <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                                            {tabs.find(t => t.id === activeTab)?.label} Settings
                                        </h3>

                                        {/* Mock Content based on Tab */}
                                        {activeTab === 'general' && (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-900 block mb-1">Auto-Enable</label>
                                                        <p className="text-xs text-slate-500">Start automatically when TAAS launches</p>
                                                    </div>
                                                    <div className="w-11 h-6 bg-purple-600 rounded-full relative cursor-pointer">
                                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between opacity-50">
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-900 block mb-1">Background Sync</label>
                                                        <p className="text-xs text-slate-500">Allow plugin to sync data in background</p>
                                                    </div>
                                                    <div className="w-11 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'permissions' && (
                                            <div className="space-y-4">
                                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Shield className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm font-medium text-slate-900">Storage Access</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500">Read/Write access to encrypted storage vault.</p>
                                                </div>
                                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Bell className="w-4 h-4 text-amber-600" />
                                                        <span className="text-sm font-medium text-slate-900">Notifications</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500">Permission to send system notifications.</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Placeholder for others */}
                                        {(activeTab === 'notifications' || activeTab === 'advanced') && (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Settings className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <p className="text-slate-500 text-sm">No additional settings available.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-slate-900/10"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
