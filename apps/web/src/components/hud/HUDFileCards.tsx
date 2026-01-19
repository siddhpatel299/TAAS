import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    Folder,
    FileText,
    Image,
    Video,
    Music,
    Archive,
    File,
    Star,
    Download,
    Trash2,
    Eye,
} from 'lucide-react';

interface HUDFileCardProps {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    isStarred?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
    onDownload?: () => void;
    onStar?: () => void;
    onDelete?: () => void;
    onPreview?: () => void;
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return Archive;
    return File;
};

const getFileColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    if (mimeType.startsWith('video/')) return 'text-pink-400 border-pink-500/30 bg-pink-500/10';
    if (mimeType.startsWith('audio/')) return 'text-green-400 border-green-500/30 bg-green-500/10';
    if (mimeType.includes('pdf')) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (mimeType.includes('document') || mimeType.includes('text')) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function HUDFileCard({
    name,
    mimeType,
    size,
    isStarred = false,
    isSelected = false,
    onClick,
    onDownload,
    onStar,
    onDelete,
    onPreview,
}: HUDFileCardProps) {
    const Icon = getFileIcon(mimeType);
    const colorClass = getFileColor(mimeType);

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "hud-file-card group cursor-pointer transition-all duration-300",
                isSelected && "border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
            )}
        >
            {/* Selection indicator */}
            {isSelected && (
                <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
            )}

            {/* Star indicator */}
            {isStarred && (
                <Star className="absolute top-2 right-2 w-4 h-4 text-yellow-400 fill-yellow-400" />
            )}

            {/* Icon */}
            <div className={cn("file-icon mb-3", colorClass)}>
                <Icon className="w-6 h-6" />
            </div>

            {/* Info */}
            <p className="text-sm font-medium text-cyan-200 truncate mb-1">{name}</p>
            <p className="text-xs text-cyan-600">{formatFileSize(size)}</p>

            {/* Actions overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end justify-center pb-3 gap-2">
                {onPreview && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onPreview(); }}
                        className="p-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg hover:bg-cyan-500/30 transition-colors"
                    >
                        <Eye className="w-4 h-4 text-cyan-400" />
                    </button>
                )}
                {onDownload && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDownload(); }}
                        className="p-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg hover:bg-cyan-500/30 transition-colors"
                    >
                        <Download className="w-4 h-4 text-cyan-400" />
                    </button>
                )}
                {onStar && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onStar(); }}
                        className="p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg hover:bg-yellow-500/30 transition-colors"
                    >
                        <Star className={cn("w-4 h-4", isStarred ? "text-yellow-400 fill-yellow-400" : "text-yellow-400")} />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 bg-red-500/20 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                        <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

interface HUDFolderCardProps {
    id: string;
    name: string;
    fileCount?: number;
    color?: string;
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
}

export function HUDFolderCard({
    name,
    fileCount = 0,
    onClick,
}: HUDFolderCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="hud-folder-card cursor-pointer group"
        >
            {/* Folder Icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-400/10 border border-cyan-500/40 flex items-center justify-center mb-3 group-hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-shadow">
                <Folder className="w-6 h-6 text-cyan-400" />
            </div>

            {/* Info */}
            <p className="text-sm font-medium text-cyan-200 truncate mb-1">{name}</p>
            <p className="text-xs text-cyan-600">{fileCount} items</p>
        </motion.div>
    );
}

interface HUDEmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function HUDEmptyState({ icon, title, description, action }: HUDEmptyStateProps) {
    return (
        <div className="text-center py-16">
            {icon && (
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    {icon}
                </div>
            )}
            <h3 className="text-xl font-semibold text-cyan-300 mb-2">{title}</h3>
            {description && <p className="text-cyan-600 mb-6 max-w-md mx-auto">{description}</p>}
            {action}
        </div>
    );
}
