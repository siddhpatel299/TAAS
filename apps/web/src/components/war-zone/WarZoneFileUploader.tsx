import React, { useRef, useState } from 'react';
import { useDirectUpload } from '@/contexts/DirectUploadContext';
import { Upload, X, Check, AlertTriangle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HoloCard } from './HoloCard';
import { CyberButton } from './CyberButton';

export function WarZoneFileUploader() {
    const {
        isUploading,
        uploads,
        uploadFiles,
        cancelUpload,
        removeUpload,
        clearCompleted
    } = useDirectUpload();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // Filter for active uploads to show in refined list
    const activeUploads = uploads.filter(u => u.status !== 'completed' || Date.now() - 0 < 5000); // Keep completed for 5s (simulated)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadFiles(Array.from(e.target.files));
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            uploadFiles(Array.from(e.dataTransfer.files));
        }
    };

    return (
        <>
            <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
            />

            {/* Upload Trigger Area - Only visible if inactive or standard use */}
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-lg p-8 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group",
                    isDragOver ? "border-cyan-400 bg-cyan-950/30" : "border-cyan-900/30 hover:border-cyan-500/50 hover:bg-cyan-950/10"
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload className={cn("w-10 h-10 mb-4 transition-colors", isDragOver ? "text-cyan-400 animate-bounce" : "text-cyan-700 group-hover:text-cyan-500")} />
                <h3 className="text-cyan-100 font-bold mb-1">INITIATE_DATA_TRANSFER</h3>
                <p className="text-xs text-cyan-600 font-mono">DRAG_DROP // SELECT_FILES</p>
            </div>

            {/* Upload Progress Queue */}
            <AnimatePresence>
                {uploads.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-2"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-cyan-500 font-bold tracking-widest">TRANSMISSION_LOG</span>
                            {uploads.some(u => u.status === 'completed' || u.status === 'error') && (
                                <button onClick={clearCompleted} className="text-[10px] text-cyan-700 hover:text-cyan-400 uppercase">
                                    [ CLEAR_LOGS ]
                                </button>
                            )}
                        </div>

                        {uploads.map(upload => (
                            <motion.div
                                key={upload.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                className="bg-black border border-cyan-900/50 p-2 rounded flex items-center gap-3 relative overflow-hidden"
                            >
                                {/* Progress Bar Background */}
                                <div
                                    className={cn(
                                        "absolute left-0 top-0 bottom-0 bg-cyan-900/20 transition-all duration-300",
                                        upload.status === 'error' && "bg-red-900/20",
                                        upload.status === 'completed' && "bg-green-900/20"
                                    )}
                                    style={{ width: `${upload.progress}%` }}
                                />

                                <div className="relative z-10 w-8 h-8 flex items-center justify-center bg-cyan-950/50 rounded">
                                    {upload.status === 'uploading' && <Upload className="w-4 h-4 text-cyan-400 animate-pulse" />}
                                    {upload.status === 'completed' && <Check className="w-4 h-4 text-green-400" />}
                                    {upload.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                                    {upload.status === 'queued' && <FileText className="w-4 h-4 text-cyan-700" />}
                                </div>

                                <div className="relative z-10 flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-cyan-100 truncate font-medium">{upload.fileName}</p>
                                        <span className={cn("text-[10px] font-mono",
                                            upload.status === 'error' ? "text-red-400" :
                                                upload.status === 'completed' ? "text-green-400" : "text-cyan-400"
                                        )}>
                                            {upload.status === 'error' ? 'FAILED' : `${upload.progress}%`}
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-cyan-950 mt-1 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-300",
                                                upload.status === 'error' ? "bg-red-500" :
                                                    upload.status === 'completed' ? "bg-green-500" : "bg-cyan-500"
                                            )}
                                            style={{ width: `${upload.progress}%` }}
                                        />
                                    </div>
                                </div>

                                {upload.status !== 'completed' && (
                                    <button
                                        onClick={() => cancelUpload(upload.id)}
                                        className="relative z-10 p-1 hover:bg-cyan-900/50 rounded text-cyan-700 hover:text-cyan-400"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
