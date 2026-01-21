import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Clock, FolderOpen, ArrowRight } from 'lucide-react';
import { Note } from '@/lib/notes-api';
import { cn } from '@/lib/utils';

interface RecentNotesWidgetProps {
    notes: Pick<Note, 'id' | 'title' | 'icon' | 'color' | 'lastEditedAt' | 'updatedAt' | 'folder'>[];
}

export function RecentNotesWidget({ notes }: RecentNotesWidgetProps) {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Notes</h3>
                <button
                    onClick={() => navigate('/plugins/notes/list')}
                    className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
                >
                    View All <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No notes yet</p>
                        <p className="text-gray-400 text-sm">Create your first note to get started!</p>
                    </div>
                ) : (
                    notes.map((note, index) => (
                        <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => navigate(`/plugins/notes/${note.id}`)}
                            className={cn(
                                "group cursor-pointer bg-white p-4 rounded-2xl border border-gray-100 shadow-sm",
                                "hover:shadow-md hover:border-cyan-100 hover:translate-y-[-2px] transition-all duration-200",
                                "flex flex-col min-h-[140px]"
                            )}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl group-hover:bg-cyan-50 transition-colors border border-gray-100">
                                    {note.icon || '📄'}
                                </div>
                                {note.folder && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100 flex items-center gap-1 max-w-[120px] truncate">
                                        <FolderOpen className="w-3 h-3" />
                                        {note.folder.name}
                                    </span>
                                )}
                            </div>

                            <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-cyan-600 transition-colors text-lg">
                                {note.title || 'Untitled'}
                            </h4>

                            <div className="mt-auto flex items-center gap-2 text-xs text-gray-400 pt-3 border-t border-gray-50">
                                <Clock className="w-3 h-3" />
                                <span>
                                    {formatDistanceToNow(new Date(note.lastEditedAt || note.updatedAt), { addSuffix: true })}
                                </span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
