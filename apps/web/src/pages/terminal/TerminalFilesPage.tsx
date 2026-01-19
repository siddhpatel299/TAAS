import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Search, Trash2, Star, Home, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalButton, TerminalFileRow, TerminalEmpty, TerminalBadge } from '@/components/terminal/TerminalComponents';
import { useFilesStore, StoredFile, Folder as FolderType } from '@/stores/files.store';
import { useDirectUpload } from '@/contexts/DirectUploadContext';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';
import { DirectUploadQueue } from '@/components/DirectUploadQueue';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function TerminalFilesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentFolderId = searchParams.get('folder');
    const { files, folders, setFiles, setFolders, selectedFiles, toggleFileSelection, clearSelection, searchQuery, setSearchQuery } = useFilesStore();
    const { uploadFiles, uploads } = useDirectUpload();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'ROOT' }]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const loadContent = useCallback(async () => {
        setIsLoading(true);
        try {
            const [filesRes, foldersRes] = await Promise.all([
                filesApi.getFiles({ folderId: currentFolderId || undefined }),
                foldersApi.getFolders(currentFolderId || undefined),
            ]);
            setFiles(filesRes.data?.data || []);
            setFolders(foldersRes.data?.data || []);
        } catch (error) {
            console.error('Failed to load:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentFolderId, setFiles, setFolders]);

    useEffect(() => { loadContent(); }, [loadContent]);

    useEffect(() => {
        const buildBreadcrumb = async () => {
            if (!currentFolderId) {
                setBreadcrumb([{ id: null, name: 'ROOT' }]);
                return;
            }
            try {
                const response = await foldersApi.getFolder(currentFolderId);
                const folder = response.data?.data;
                if (folder) {
                    setBreadcrumb([{ id: null, name: 'ROOT' }, { id: folder.id, name: folder.name.toUpperCase() }]);
                }
            } catch (error) {
                console.error('Breadcrumb error:', error);
            }
        };
        buildBreadcrumb();
    }, [currentFolderId]);

    const navigateToFolder = (folderId: string | null) => {
        clearSelection();
        if (folderId) setSearchParams({ folder: folderId });
        else setSearchParams({});
    };

    const handleUpload = (filesList: File[]) => uploadFiles(filesList, currentFolderId || undefined);
    const handleStar = async (file: StoredFile) => { await filesApi.toggleStar(file.id); loadContent(); };
    const handleDelete = async (file: StoredFile) => { await filesApi.deleteFile(file.id); loadContent(); };
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        await foldersApi.createFolder(newFolderName.trim(), currentFolderId || undefined);
        setNewFolderName('');
        setShowNewFolder(false);
        loadContent();
    };
    const handleBulkDelete = async () => {
        if (selectedFiles.size === 0) return;
        await bulkApi.deleteFiles(Array.from(selectedFiles));
        clearSelection();
        loadContent();
    };

    const filteredFiles = files.filter(f => (f.originalName || f.name).toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredFolders = folders.filter((f: FolderType) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <TerminalLayout>
            <TerminalHeader
                title="File System"
                subtitle={`${files.length} files, ${folders.length} folders`}
                actions={
                    <div className="flex items-center gap-2">
                        <TerminalButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-3 h-3 mr-1" /> New Dir</TerminalButton>
                        <TerminalButton variant="primary" onClick={() => fileInputRef.current?.click()}><Upload className="w-3 h-3 mr-1" /> Upload</TerminalButton>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { const fl = Array.from(e.target.files || []); if (fl.length > 0) handleUpload(fl); e.target.value = ''; }} />
                    </div>
                }
            />

            {/* Toolbar */}
            <TerminalPanel className="mb-4 !p-2">
                <div className="flex items-center justify-between gap-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 text-xs">
                        {breadcrumb.map((item, index) => (
                            <div key={item.id || 'root'} className="flex items-center">
                                {index > 0 && <ChevronRight className="w-3 h-3 text-[var(--terminal-text-dim)] mx-1" />}
                                <button onClick={() => navigateToFolder(item.id)} className={cn("px-2 py-0.5", index === breadcrumb.length - 1 ? "text-[var(--terminal-amber)]" : "text-[var(--terminal-text-dim)] hover:text-[var(--terminal-text)]")}>
                                    {index === 0 && <Home className="w-3 h-3 inline mr-1" />}
                                    {item.name}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--terminal-text-dim)]" />
                            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="terminal-input pl-7 !py-1 !text-xs w-32" />
                        </div>
                        <button onClick={loadContent} className="p-1 text-[var(--terminal-text-dim)] hover:text-[var(--terminal-amber)]"><RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} /></button>
                    </div>
                </div>
            </TerminalPanel>

            {/* Selection Bar */}
            {selectedFiles.size > 0 && (
                <TerminalPanel className="mb-4 !p-2 !border-[var(--terminal-amber)]">
                    <div className="flex items-center justify-between text-xs">
                        <span><TerminalBadge variant="warning">{selectedFiles.size}</TerminalBadge> selected</span>
                        <div className="flex items-center gap-2">
                            <TerminalButton onClick={clearSelection}>Clear</TerminalButton>
                            <TerminalButton variant="danger" onClick={handleBulkDelete}><Trash2 className="w-3 h-3 mr-1" /> Delete</TerminalButton>
                        </div>
                    </div>
                </TerminalPanel>
            )}

            {/* New Folder */}
            {showNewFolder && (
                <TerminalPanel className="mb-4 !p-2">
                    <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-[var(--terminal-amber)]" />
                        <input type="text" placeholder="Directory name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} className="terminal-input !py-1 flex-1" autoFocus />
                        <TerminalButton variant="primary" onClick={handleCreateFolder}>Create</TerminalButton>
                        <TerminalButton onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>Cancel</TerminalButton>
                    </div>
                </TerminalPanel>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--terminal-amber)] animate-spin" /></div>
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                <TerminalEmpty icon={<Folder className="w-full h-full" />} text="Directory empty" action={<TerminalButton variant="primary" onClick={() => fileInputRef.current?.click()}><Upload className="w-3 h-3 mr-1" /> Upload</TerminalButton>} />
            ) : (
                <TerminalPanel>
                    {filteredFolders.map((folder: FolderType) => (
                        <TerminalFileRow key={folder.id} icon={<Folder className="w-4 h-4 text-[var(--terminal-amber)]" />} name={folder.name} meta={`${folder._count?.files || 0} files`} onClick={() => navigateToFolder(folder.id)} />
                    ))}
                    {filteredFiles.map((file) => {
                        const Icon = getFileIcon(file.mimeType);
                        return (
                            <TerminalFileRow
                                key={file.id}
                                icon={<Icon className="w-4 h-4" />}
                                name={file.originalName || file.name}
                                meta={formatFileSize(file.size)}
                                selected={selectedFiles.has(file.id)}
                                onClick={() => toggleFileSelection(file.id)}
                                actions={
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); handleStar(file); }} className={cn("p-1", file.isStarred && "text-[var(--terminal-amber)]")}><Star className={cn("w-3 h-3", file.isStarred && "fill-current")} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(file); }} className="p-1 text-[var(--terminal-red)]"><Trash2 className="w-3 h-3" /></button>
                                    </>
                                }
                            />
                        );
                    })}
                </TerminalPanel>
            )}

            {uploads.length > 0 && <div className="fixed bottom-8 right-4 w-72 z-50"><DirectUploadQueue /></div>}
        </TerminalLayout>
    );
}
