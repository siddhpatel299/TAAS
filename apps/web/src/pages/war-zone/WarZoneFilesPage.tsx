import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Folder,
    FileText,
    ArrowLeft,
    ChevronRight,
    Search
} from 'lucide-react';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { filesApi, foldersApi } from '@/lib/api';
import { HoloCard } from '@/components/war-zone/HoloCard';
import { CyberButton } from '@/components/war-zone/CyberButton';
import { WarZoneFileActions } from '@/components/war-zone/WarZoneFileActions';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface FolderData {
    id: string;
    name: string;
    path: string;
    parentId: string | null;
}

export function WarZoneFilesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const folderId = searchParams.get('folderId');

    const { setLoading } = useFilesStore();
    const [files, setFiles] = useState<StoredFile[]>([]);
    const [folders, setFolders] = useState<FolderData[]>([]);
    const [currentFolder, setCurrentFolder] = useState<FolderData | null>(null);

    const loadContent = useCallback(async () => {
        setLoading(true);
        try {
            if (folderId) {
                // Load specific folder content
                const [folderRes, filesRes, subFoldersRes] = await Promise.all([
                    foldersApi.getFolder(folderId),
                    filesApi.getFiles({ folderId }),
                    foldersApi.getFolders(folderId)
                ]);

                setCurrentFolder(folderRes.data.data);
                setFiles(filesRes.data.data);
                setFolders(subFoldersRes.data.data);
            } else {
                // Load root
                const [filesRes, foldersRes] = await Promise.all([
                    filesApi.getFiles({ folderId: 'root' }),
                    foldersApi.getFolders()
                ]);

                setCurrentFolder(null);
                setFiles(filesRes.data.data);
                setFolders(foldersRes.data.data);
            }
        } catch (error) {
            console.error('Failed to load files:', error);
        } finally {
            setLoading(false);
        }
    }, [folderId, setLoading]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    const handleFolderClick = (id: string) => {
        setSearchParams({ folderId: id });
    };

    const handleBack = () => {
        if (currentFolder?.parentId) {
            setSearchParams({ folderId: currentFolder.parentId });
        } else {
            setSearchParams({});
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header / Breadcrumbs */}
            <HoloCard className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    {folderId && (
                        <CyberButton onClick={handleBack} variant="secondary" className="px-2">
                            <ArrowLeft className="w-4 h-4" />
                        </CyberButton>
                    )}
                    <nav className="flex items-center gap-2 text-cyan-500 font-mono text-sm">
                        <span
                            className={cn("cursor-pointer hover:text-cyan-300 transition-colors", !folderId && "font-bold text-cyan-100")}
                            onClick={() => setSearchParams({})}
                        >
                            ROOT_DIR
                        </span>
                        {folderId && currentFolder && (
                            <>
                                <ChevronRight className="w-4 h-4 text-cyan-700" />
                                <span className="font-bold text-cyan-100">{currentFolder.name.toUpperCase()}</span>
                            </>
                        )}
                    </nav>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-700 group-hover:text-cyan-500" />
                    <input
                        type="text"
                        placeholder="SEARCH_ARCHIVES..."
                        className="bg-black/50 border border-cyan-900/50 rounded-lg pl-9 pr-4 py-2 text-xs text-cyan-100 focus:outline-none focus:border-cyan-500 transition-all w-48 focus:w-64"
                    />
                </div>
            </HoloCard>

            {/* Content Area */}
            <HoloCard className="flex-1 overflow-hidden flex flex-col p-0">
                <div className="flex-1 overflow-auto p-6 custom-scrollbar">

                    {/* Folders Section */}
                    {folders.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xs font-bold text-cyan-600 mb-4 tracking-widest flex items-center gap-2">
                                <Folder className="w-3 h-3" /> DIRECTORIES
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {folders.map(folder => (
                                    <motion.div
                                        key={folder.id}
                                        onClick={() => handleFolderClick(folder.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="bg-cyan-950/20 border border-cyan-900/30 hover:border-cyan-500/50 hover:bg-cyan-900/20 p-4 rounded cursor-pointer group transition-all"
                                    >
                                        <Folder className="w-8 h-8 text-cyan-700 group-hover:text-cyan-400 mb-2 transition-colors" />
                                        <p className="text-sm font-medium text-cyan-200 truncate">{folder.name}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Files Section */}
                    <div>
                        <h3 className="text-xs font-bold text-cyan-600 mb-4 tracking-widest flex items-center gap-2">
                            <FileText className="w-3 h-3" /> FILES
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {files.map((file, i) => (
                                <FileGridItem
                                    key={file.id}
                                    file={file}
                                    index={i}
                                    onDelete={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                                />
                            ))}
                            {files.length === 0 && (
                                <div className="col-span-full py-12 text-center text-cyan-800">
                                    NO_DATA_FOUND // DIRECTORY_EMPTY
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </HoloCard>
        </div>
    );
}

function FileGridItem({ file, index, onDelete }: { file: StoredFile; index: number; onDelete: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-black border border-cyan-900/30 hover:border-cyan-500/50 p-3 rounded transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded bg-cyan-950/30 flex items-center justify-center text-cyan-400">
                    <FileIcon mime={file.mimeType} />
                </div>
                {/* Actions Menu */}
                <div onClick={(e) => e.stopPropagation()}>
                    <WarZoneFileActions file={file} onDelete={onDelete} />
                </div>
            </div>

            <p className="text-sm text-cyan-100 truncate font-medium mb-1" title={file.originalName}>
                {file.originalName}
            </p>
            <div className="flex items-center justify-between text-[10px] text-cyan-700 font-mono">
                <span>{formatSize(file.size)}</span>
                <span>{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</span>
            </div>
        </motion.div>
    );
}

function FileIcon({ mime: _mime }: { mime: string }) {
    return <FileText className="w-4 h-4" />;
}

function formatSize(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
