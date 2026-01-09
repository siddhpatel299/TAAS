import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Star,
  Pin,
  Trash2,
  Edit,
  Copy,
  Archive,
  Folder,
  FolderPlus,
  Grid,
  List,
  MoreVertical,
  Clock,
  Tag,
  ChevronRight,
  ChevronDown,
  X,
  LayoutTemplate,
  ArrowLeft,
  Save,
  History,
  Share2,
  Download,
} from 'lucide-react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useNotesStore } from '@/stores/notes.store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Note, NoteFolder, NOTE_COLORS } from '@/lib/notes-api';
import { RichTextEditor } from '@/components/notes/RichTextEditor';
import { BlockEditor, Block } from '@/components/notes/BlockEditor';

// Note Card Component
function NoteCard({
  note,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePin,
  onToggleFavorite,
  onArchive,
}: {
  note: Note;
  onSelect: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const noteColor = NOTE_COLORS.find((c) => c.value === note.color)?.color || '#ffffff';

  const getPreview = (content: string | undefined) => {
    if (!content) return 'No content';
    const text = content.replace(/<[^>]*>/g, '').replace(/[#*`_~]/g, '');
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer relative group"
      style={{ backgroundColor: noteColor }}
      onClick={() => onSelect(note)}
    >
      {/* Pin & Favorite indicators */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
        {note.isPinned && (
          <div className="p-1 bg-white/80 rounded-full">
            <Pin className="w-3 h-3 text-blue-600 fill-blue-600" />
          </div>
        )}
        {note.isFavorite && (
          <div className="p-1 bg-white/80 rounded-full">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-gray-900 mb-2 pr-12 line-clamp-2">{note.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-3 mb-3">{getPreview(note.content)}</p>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-gray-100/80 text-gray-600 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{note.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100/50">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
          </div>
          {note.folder && (
            <div className="flex items-center gap-1">
              <Folder className="w-3 h-3" />
              <span>{note.folder.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id);
            }}
            className={cn(
              'p-2 rounded-lg transition-colors',
              note.isPinned
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(note.id);
            }}
            className={cn(
              'p-2 rounded-lg transition-colors',
              note.isFavorite
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
            title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <div
            className="absolute bottom-14 right-3 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[140px] z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                onDuplicate(note.id);
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <button
              onClick={() => {
                onArchive(note.id);
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Archive className="w-4 h-4" />
              Archive
            </button>
            <button
              onClick={() => {
                onDelete(note.id);
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Folder Tree Item
function FolderTreeItem({
  folder,
  level = 0,
  selectedFolderId,
  onSelect,
}: {
  folder: NoteFolder;
  level?: number;
  selectedFolderId?: string;
  onSelect: (folderId: string | undefined) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div>
      <button
        onClick={() => onSelect(folder.id)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
          selectedFolderId === folder.id
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-700 hover:bg-gray-100'
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-4" />}
        <Folder
          className="w-4 h-4"
          style={{ color: folder.color || '#6B7280' }}
        />
        <span className="flex-1 text-left truncate">{folder.name}</span>
        <span className="text-xs text-gray-400">{folder._count?.notes || 0}</span>
      </button>
      {expanded && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-500">{title}</p>
    </motion.div>
  );
}

// Create Note Dialog
function CreateNoteDialog({
  isOpen,
  onClose,
  onCreate,
  folders,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; content?: string; folderId?: string; tags?: string[] }) => void;
  folders: NoteFolder[];
}) {
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      folderId: folderId || undefined,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setTitle('');
    setFolderId('');
    setTagsInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create New Note</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Enter tags separated by commas..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Note
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Create Folder Dialog
function CreateFolderDialog({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; color?: string }) => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366F1');

  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6B7280'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({ name: name.trim(), color });
    setName('');
    setColor('#6366F1');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create Folder</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Folder Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-transform',
                    color === c && 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Folder
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function NotesDashboardPage() {
  const { id: noteId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    notes,
    folders,
    folderTree,
    dashboardStats,
    selectedNote,
    isLoading,
    error,
    viewMode,
    filters,
    fetchDashboard,
    fetchNotes,
    fetchNote,
    fetchFolders,
    fetchFolderTree,
    fetchTemplates,
    createNote,
    updateNote,
    deleteNote,
    duplicateNote,
    togglePin,
    toggleFavorite,
    archiveNote,
    setFilters,
    setViewMode,
    setSelectedNote,
    clearError,
  } = useNotesStore();

  const [searchInput, setSearchInput] = useState('');
  const [showCreateNoteDialog, setShowCreateNoteDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Editor state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editHtml, setEditHtml] = useState('');
  const [editBlocks, setEditBlocks] = useState<Block[]>([]);
  const [useBlocks, setUseBlocks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load note if ID is provided
  useEffect(() => {
    if (noteId) {
      fetchNote(noteId);
    } else {
      setSelectedNote(null);
    }
  }, [noteId]);

  // Update editor state when note is loaded
  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content || '');
    }
  }, [selectedNote]);

  useEffect(() => {
    fetchDashboard();
    fetchNotes();
    fetchFolders();
    fetchFolderTree();
    fetchTemplates();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCreateNote = async (data: { title: string; content?: string; folderId?: string; tags?: string[] }) => {
    try {
      const note = await createNote(data);
      // Navigate to edit page
      window.location.href = `/plugins/notes/${note.id}`;
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleCreateFolder = async (data: { name: string; color?: string }) => {
    try {
      await useNotesStore.getState().createFolder(data);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const handleSelectNote = (note: Note) => {
    navigate(`/plugins/notes/${note.id}`);
  };

  const handleEditNote = (note: Note) => {
    navigate(`/plugins/notes/${note.id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
      setDeleteConfirm(null);
      if (noteId === id) {
        navigate('/plugins/notes');
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleFolderSelect = (folderId: string | undefined) => {
    setFilters({ folderId });
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    setIsSaving(true);
    try {
      await updateNote(selectedNote.id, {
        title: editTitle,
        content: editContent,
        contentHtml: editHtml,
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToList = () => {
    setSelectedNote(null);
    navigate('/plugins/notes');
  };

  const filteredNotes = notes;

  // If a note is selected (via URL param), show the editor view
  if (noteId && selectedNote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <ModernSidebar />
        <main className="ml-20 p-8">
          {/* Editor Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToList}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                  placeholder="Note title..."
                />
                <p className="text-sm text-gray-500">
                  {lastSaved ? `Last saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}` : 'Not saved yet'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setUseBlocks(!useBlocks)}
                className={cn(
                  'px-3 py-2 rounded-xl font-medium transition-colors',
                  useBlocks 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {useBlocks ? 'Blocks' : 'Rich Text'}
              </button>
              <button
                onClick={() => togglePin(selectedNote.id)}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  selectedNote.isPinned ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Pin className="w-5 h-5" />
              </button>
              <button
                onClick={() => toggleFavorite(selectedNote.id)}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  selectedNote.isFavorite ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Star className="w-5 h-5" />
              </button>
              <button
                onClick={handleSaveNote}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Editor Content */}
          {useBlocks ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <BlockEditor
                blocks={editBlocks}
                onChange={setEditBlocks}
              />
            </div>
          ) : (
            <RichTextEditor
              content={editContent}
              onChange={(text, html) => {
                setEditContent(text);
                setEditHtml(html);
              }}
              placeholder="Start writing your note here..."
            />
          )}

          {/* Note Info Footer */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>{editContent.split(/\s+/).filter(Boolean).length} words</span>
              <span>~{Math.ceil(editContent.split(/\s+/).filter(Boolean).length / 200)} min read</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {}}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Version History"
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
              <button
                onClick={() => {}}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Share Note"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([editContent], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${editTitle || 'note'}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Export as Markdown"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                <Clock className="w-4 h-4" />
                <span>Created {formatDistanceToNow(new Date(selectedNote.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Loading state for note
  if (noteId && !selectedNote && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <ModernSidebar />
        <main className="ml-20 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading note...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ModernSidebar />

      <main className="ml-20 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notes & Documents</h1>
              <p className="text-gray-500 text-sm">Create, organize, and manage your notes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateFolderDialog(true)}
              className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              title="New Folder"
            >
              <FolderPlus className="w-5 h-5" />
            </button>
            <button
              onClick={() => {}}
              className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              title="Templates"
            >
              <LayoutTemplate className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateNoteDialog(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatsCard
              title="Total Notes"
              value={dashboardStats.totalNotes}
              icon={FileText}
              color="bg-indigo-500"
            />
            <StatsCard
              title="Pinned"
              value={dashboardStats.pinnedCount}
              icon={Pin}
              color="bg-blue-500"
            />
            <StatsCard
              title="Favorites"
              value={dashboardStats.favoriteCount}
              icon={Star}
              color="bg-yellow-500"
            />
            <StatsCard
              title="Folders"
              value={dashboardStats.folderCount}
              icon={Folder}
              color="bg-green-500"
            />
            <StatsCard
              title="Archived"
              value={dashboardStats.archivedCount}
              icon={Archive}
              color="bg-gray-500"
            />
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar - Folders */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Folders
              </h3>

              <div className="space-y-1">
                <button
                  onClick={() => handleFolderSelect(undefined)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    !filters.folderId
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <FileText className="w-4 h-4" />
                  <span className="flex-1 text-left">All Notes</span>
                  <span className="text-xs text-gray-400">{dashboardStats?.totalNotes || 0}</span>
                </button>

                {folderTree.map((folder) => (
                  <FolderTreeItem
                    key={folder.id}
                    folder={folder}
                    selectedFolderId={filters.folderId}
                    onSelect={handleFolderSelect}
                  />
                ))}
              </div>

              <div className="border-t border-gray-100 mt-4 pt-4 space-y-1">
                <button
                  onClick={() => setFilters({ isFavorite: true, folderId: undefined })}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    filters.isFavorite
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Star className="w-4 h-4" />
                  <span className="flex-1 text-left">Favorites</span>
                </button>
                <button
                  onClick={() => setFilters({ isArchived: true, folderId: undefined })}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    filters.isArchived
                      ? 'bg-gray-200 text-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Archive className="w-4 h-4" />
                  <span className="flex-1 text-left">Archived</span>
                </button>
                <button
                  onClick={() => setFilters({ isTrashed: true, folderId: undefined })}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    filters.isTrashed
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="flex-1 text-left">Trash</span>
                </button>
              </div>

              {/* Top Tags */}
              {dashboardStats && dashboardStats.topTags.length > 0 && (
                <div className="border-t border-gray-100 mt-4 pt-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Popular Tags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {dashboardStats.topTags.slice(0, 8).map((item) => (
                      <button
                        key={item.tag}
                        onClick={() => setFilters({ tags: [item.tag] })}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                      >
                        #{item.tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'grid'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'list'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between"
              >
                <span>{error}</span>
                <button onClick={clearError} className="text-red-500 hover:text-red-700">
                  ×
                </button>
              </motion.div>
            )}

            {/* Notes Grid/List */}
            {isLoading && notes.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes found</h3>
                <p className="text-gray-500 mb-6">
                  {filters.search || filters.folderId || filters.tags?.length
                    ? 'Try adjusting your search or filters'
                    : 'Start by creating your first note'}
                </p>
                {!filters.search && !filters.folderId && !filters.tags?.length && (
                  <button
                    onClick={() => setShowCreateNoteDialog(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Note
                  </button>
                )}
              </div>
            ) : (
              <div
                className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-3'
                )}
              >
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onSelect={handleSelectNote}
                    onEdit={handleEditNote}
                    onDelete={(id) => setDeleteConfirm(id)}
                    onDuplicate={duplicateNote}
                    onTogglePin={togglePin}
                    onToggleFavorite={toggleFavorite}
                    onArchive={archiveNote}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Move to Trash?</h3>
              <p className="text-gray-500 mb-6">
                This note will be moved to trash. You can restore it later or delete it permanently.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Move to Trash
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Create Note Dialog */}
        <CreateNoteDialog
          isOpen={showCreateNoteDialog}
          onClose={() => setShowCreateNoteDialog(false)}
          onCreate={handleCreateNote}
          folders={folders}
        />

        {/* Create Folder Dialog */}
        <CreateFolderDialog
          isOpen={showCreateFolderDialog}
          onClose={() => setShowCreateFolderDialog(false)}
          onCreate={handleCreateFolder}
        />
      </main>
    </div>
  );
}
