import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MoreVertical,
    Download,
    Share2,
    Trash2,
    Eye
} from 'lucide-react';
import { StoredFile } from '@/stores/files.store';
import { cn } from '@/lib/utils';
import { filesApi, getPreviewUrl, shareApi } from '@/lib/api';

interface WarZoneFileActionsProps {
    file: StoredFile;
    onDelete?: (id: string) => void;
}

export function WarZoneFileActions({ file, onDelete }: WarZoneFileActionsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleAction = async (action: string) => {
        setIsOpen(false);

        try {
            switch (action) {
                case 'view':
                    // Open preview in new tab for now
                    const previewUrl = getPreviewUrl(file.id);
                    window.open(previewUrl, '_blank');
                    break;

                case 'download':
                    // Trigger download
                    try {
                        const response = await filesApi.downloadFile(file.id);
                        const blob = new Blob([response.data], { type: file.mimeType });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = file.originalName;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                    } catch (e) {
                        console.error('Download failed', e);
                        alert('DOWNLOAD_FAILED // ENCRYPTION_ERROR');
                    }
                    break;

                case 'delete':
                    if (confirm('CONFIRM DELETION PROTOCOL?')) {
                        await filesApi.deleteFile(file.id);
                        onDelete?.(file.id);
                    }
                    break;

                case 'share':
                    // Create a share link
                    try {
                        const res = await shareApi.createLink(file.id);
                        // Assuming res.data.data contains the link or token. 
                        // For prototype, we'll try to just copy a constructed public link if available, 
                        // or just alert success.
                        // Standard app: `${window.location.origin}/share/${res.data.data.token}`
                        if (res.data?.data?.token) {
                            const link = `${window.location.origin}/share/${res.data.data.token}`;
                            navigator.clipboard.writeText(link);
                            alert('SECURE_LINK_GENERATED // COPIED_TO_CLIPBOARD');
                        } else {
                            alert('SHARE_PROTOCOL_INITIATED');
                        }
                    } catch (e) {
                        console.error('Share failed', e);
                    }
                    break;
            }
        } catch (err) {
            console.error('Action failed', err);
        }
    };

    return (
        <div className="relative z-20">
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="p-1 text-cyan-700 hover:text-cyan-400 transition-colors"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-black border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)] rounded z-40 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-1 space-y-1">
                                <ActionItem icon={Eye} label="VIEW_DATA" onClick={() => handleAction('view')} />
                                <ActionItem icon={Download} label="EXTRACT" onClick={() => handleAction('download')} />
                                <ActionItem icon={Share2} label="TRANSMIT" onClick={() => handleAction('share')} />
                                <div className="h-px bg-cyan-900/50 my-1" />
                                <ActionItem icon={Trash2} label="PURGE" onClick={() => handleAction('delete')} variant="danger" />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function ActionItem({ icon: Icon, label, onClick, variant = 'primary' }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-xs font-mono tracking-wider transition-colors text-left",
                variant === 'danger'
                    ? "text-red-400 hover:bg-red-900/30"
                    : "text-cyan-400 hover:bg-cyan-950/50"
            )}
        >
            <Icon className="w-3 h-3" />
            {label}
        </button>
    );
}
