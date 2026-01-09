import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Link2,
  Columns,
  Bookmark,
  Plus,
  GripVertical,
  MoreHorizontal,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Block types
export type BlockType = 
  | 'text'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'bullet_list'
  | 'numbered_list'
  | 'todo'
  | 'quote'
  | 'code'
  | 'callout'
  | 'bookmark'
  | 'embed'
  | 'column'
  | 'divider';

export interface Block {
  id: string;
  type: BlockType;
  content: any;
  position: number;
  parentId?: string;
  properties?: {
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: 'small' | 'medium' | 'large';
    [key: string]: any;
  };
}

interface SexyBlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  className?: string;
}

// Beautiful block type definitions with icons and colors
const SEXY_BLOCK_TYPES = [
  { type: 'text' as BlockType, label: 'Text', icon: Type, color: 'from-blue-500 to-cyan-600', description: 'Just start writing' },
  { type: 'heading_1' as BlockType, label: 'Heading 1', icon: Heading1, color: 'from-purple-500 to-pink-600', description: 'Big section heading' },
  { type: 'heading_2' as BlockType, label: 'Heading 2', icon: Heading2, color: 'from-purple-500 to-pink-600', description: 'Medium section heading' },
  { type: 'heading_3' as BlockType, label: 'Heading 3', icon: Heading3, color: 'from-purple-500 to-pink-600', description: 'Small section heading' },
  { type: 'bullet_list' as BlockType, label: 'Bullet List', icon: List, color: 'from-green-500 to-emerald-600', description: 'Create a simple bullet list' },
  { type: 'numbered_list' as BlockType, label: 'Numbered List', icon: ListOrdered, color: 'from-green-500 to-emerald-600', description: 'Create a numbered list' },
  { type: 'todo' as BlockType, label: 'To-do List', icon: CheckSquare, color: 'from-orange-500 to-red-600', description: 'Track tasks with a to-do list' },
  { type: 'quote' as BlockType, label: 'Quote', icon: Quote, color: 'from-indigo-500 to-purple-600', description: 'Capture a quote' },
  { type: 'code' as BlockType, label: 'Code', icon: Code, color: 'from-gray-700 to-gray-900', description: 'Capture a code snippet' },
  { type: 'callout' as BlockType, label: 'Callout', icon: Sparkles, color: 'from-yellow-400 to-orange-500', description: 'Highlight important information' },
  { type: 'bookmark' as BlockType, label: 'Bookmark', icon: Bookmark, color: 'from-blue-500 to-indigo-600', description: 'Embed a bookmark' },
  { type: 'embed' as BlockType, label: 'Embed', icon: Link2, color: 'from-pink-500 to-rose-600', description: 'Embed content from another site' },
  { type: 'column' as BlockType, label: 'Columns', icon: Columns, color: 'from-teal-500 to-cyan-600', description: 'Arrange content in columns' },
  { type: 'divider' as BlockType, label: 'Divider', icon: Plus, color: 'from-gray-400 to-gray-600', description: 'Visual divider' },
];

// Sexy Block Component
const SexyBlockComponent: React.FC<{
  block: Block;
  onChange: (block: Block) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}> = ({ block, onChange, onDelete, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle content change
  const handleContentChange = useCallback((content: any) => {
    onChange({ ...block, content });
  }, [block, onChange]);

  // Handle input change for slash menu
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    
    if (showSlashMenu) {
      handleContentChange(value);
      
      const beforeCursor = value.substring(0, selectionStart);
      const lineStart = beforeCursor.lastIndexOf('\n') + 1;
      const textInLine = beforeCursor.substring(lineStart);
      
      const slashMatch = textInLine.match(/^\/(.*)$/);
      if (slashMatch) {
        setSlashQuery(slashMatch[1]);
      } else {
        setShowSlashMenu(false);
        setSlashQuery('');
      }
    } else {
      handleContentChange(value);
    }
  }, [showSlashMenu, handleContentChange]);

  // Handle slash command
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const target = e.target as HTMLTextAreaElement;
    const value = target.value;
    const selectionStart = target.selectionStart;
    
    if (e.key === '/') {
      const beforeCursor = value.substring(0, selectionStart);
      const lineStart = beforeCursor.lastIndexOf('\n') + 1;
      const textInLine = beforeCursor.substring(lineStart);
      
      if (textInLine.trim() === '' || textInLine.trim() === '/') {
        e.preventDefault();
        setShowSlashMenu(true);
        setSlashQuery('');
      }
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
      setSlashQuery('');
    } else if (showSlashMenu) {
      if (e.key.length === 1) {
        setSlashQuery(prev => prev + e.key);
      } else if (e.key === 'Backspace') {
        setSlashQuery(prev => prev.slice(0, -1));
      }
    }
  }, [showSlashMenu]);

  // Handle block type selection
  const handleBlockTypeSelect = useCallback((type: BlockType) => {
    let newContent: any = '';
    
    switch (type) {
      case 'heading_1':
        newContent = 'New Heading';
        break;
      case 'heading_2':
        newContent = 'New Heading';
        break;
      case 'heading_3':
        newContent = 'New Heading';
        break;
      case 'bullet_list':
        newContent = ['List item 1', 'List item 2'];
        break;
      case 'numbered_list':
        newContent = ['List item 1', 'List item 2'];
        break;
      case 'todo':
        newContent = [{ text: 'Task 1', checked: false }, { text: 'Task 2', checked: false }];
        break;
      case 'quote':
        newContent = 'Enter your quote here...';
        break;
      case 'code':
        newContent = { language: 'javascript', code: '// Enter your code here' };
        break;
      case 'callout':
        newContent = { text: 'Important information', emoji: '💡', color: 'blue' };
        break;
      case 'bookmark':
        newContent = { url: '', title: '', description: '', image: '' };
        break;
      case 'embed':
        newContent = { url: '', type: 'youtube' };
        break;
      case 'column':
        newContent = { columns: 2, blocks: [[], []] };
        break;
      case 'divider':
        newContent = null;
        break;
      default:
        newContent = '';
    }

    onChange({ ...block, type, content: newContent });
    setShowSlashMenu(false);
    setSlashQuery('');
    inputRef.current?.focus();
  }, [block, onChange]);

  // Filter block types
  const filteredBlockTypes = SEXY_BLOCK_TYPES.filter(bt =>
    bt.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
    bt.description.toLowerCase().includes(slashQuery.toLowerCase())
  );

  // Get block type info
  const blockTypeInfo = SEXY_BLOCK_TYPES.find(bt => bt.type === block.type);

  // Render sexy block content
  const renderSexyBlockContent = () => {
    const { type, content, properties } = block;

    switch (type) {
      case 'text':
        return (
          <textarea
            ref={inputRef}
            value={content || ''}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type '/' for commands..."
            className="w-full bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-400"
            rows={Math.max(1, (content || '').split('\n').length)}
            style={{
              fontSize: properties?.fontSize === 'small' ? '14px' : properties?.fontSize === 'large' ? '20px' : '16px',
              textAlign: properties?.textAlign || 'left',
            }}
          />
        );

      case 'heading_1':
        return (
          <textarea
            ref={inputRef}
            value={content || ''}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Heading 1"
            className="w-full bg-transparent border-none outline-none resize-none font-bold text-4xl text-gray-900 placeholder-gray-400"
            rows={1}
            style={{ textAlign: properties?.textAlign || 'left' }}
          />
        );

      case 'heading_2':
        return (
          <textarea
            ref={inputRef}
            value={content || ''}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Heading 2"
            className="w-full bg-transparent border-none outline-none resize-none font-semibold text-3xl text-gray-900 placeholder-gray-400"
            rows={1}
            style={{ textAlign: properties?.textAlign || 'left' }}
          />
        );

      case 'heading_3':
        return (
          <textarea
            ref={inputRef}
            value={content || ''}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Heading 3"
            className="w-full bg-transparent border-none outline-none resize-none font-medium text-2xl text-gray-900 placeholder-gray-400"
            rows={1}
            style={{ textAlign: properties?.textAlign || 'left' }}
          />
        );

      case 'bullet_list':
        return (
          <div className="space-y-2">
            {(content || ['']).map((item: string, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                <textarea
                  value={item}
                  onChange={(e) => {
                    const newContent = [...(content || [])];
                    newContent[index] = e.target.value;
                    handleContentChange(newContent);
                  }}
                  placeholder="List item"
                  className="flex-1 bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-400"
                  rows={1}
                />
              </div>
            ))}
          </div>
        );

      case 'numbered_list':
        return (
          <div className="space-y-2">
            {(content || ['']).map((item: string, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-6 text-center font-semibold text-transparent bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text">
                  {index + 1}.
                </span>
                <textarea
                  value={item}
                  onChange={(e) => {
                    const newContent = [...(content || [])];
                    newContent[index] = e.target.value;
                    handleContentChange(newContent);
                  }}
                  placeholder="List item"
                  className="flex-1 bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-400"
                  rows={1}
                />
              </div>
            ))}
          </div>
        );

      case 'todo':
        return (
          <div className="space-y-2">
            {(content || [{ text: '', checked: false }]).map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  <input
                    type="checkbox"
                    checked={item.checked || false}
                    onChange={(e) => {
                      const newContent = [...(content || [])];
                      newContent[index] = { ...item, checked: e.target.checked };
                      handleContentChange(newContent);
                    }}
                    className="w-5 h-5 text-orange-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  />
                </motion.div>
                <textarea
                  value={item.text || ''}
                  onChange={(e) => {
                    const newContent = [...(content || [])];
                    newContent[index] = { ...item, text: e.target.value };
                    handleContentChange(newContent);
                  }}
                  placeholder="Task"
                  className={cn(
                    'flex-1 bg-transparent border-none outline-none resize-none placeholder-gray-400',
                    item.checked && 'line-through text-gray-400'
                  )}
                  rows={1}
                />
              </div>
            ))}
          </div>
        );

      case 'quote':
        return (
          <div className="border-l-4 border-gradient-to-b from-indigo-500 to-purple-600 pl-6">
            <textarea
              ref={inputRef}
              value={content || ''}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Empty quote..."
              className="w-full bg-transparent border-none outline-none resize-none italic text-gray-700 placeholder-gray-400 text-lg"
              rows={2}
            />
          </div>
        );

      case 'code':
        return (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <select
                value={content?.language || 'javascript'}
                onChange={(e) => handleContentChange({ ...content, language: e.target.value })}
                className="text-sm bg-gray-800 text-gray-300 px-3 py-2 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigator.clipboard.writeText(content?.code || '')}
                className="text-sm text-gray-400 hover:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Copy
              </motion.button>
            </div>
            <textarea
              value={content?.code || ''}
              onChange={(e) => handleContentChange({ ...content, code: e.target.value })}
              placeholder="// Enter your code here..."
              className="w-full bg-transparent border-none outline-none resize-none text-gray-300 font-mono text-sm placeholder-gray-500"
              rows={6}
            />
          </div>
        );

      case 'callout':
        return (
          <div
            className={cn(
              'rounded-2xl p-6 border-l-4 shadow-lg',
              content?.color === 'red' && 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400',
              content?.color === 'blue' && 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400',
              content?.color === 'green' && 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400',
              content?.color === 'yellow' && 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400',
              !content?.color && 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-400'
            )}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{content?.emoji || '💡'}</span>
              <textarea
                ref={inputRef}
                value={content?.text || ''}
                onChange={(e) => handleContentChange({ ...content, text: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="Important information..."
                className="flex-1 bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-400"
                rows={2}
              />
            </div>
          </div>
        );

      case 'divider':
        return (
          <div className="relative py-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>
            <div className="relative flex justify-center">
              <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <textarea
            ref={inputRef}
            value={content || ''}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type '/' for commands..."
            className="w-full bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-400"
            rows={1}
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Block wrapper with glassmorphism */}
      <div
        className={cn(
          'relative flex items-start gap-4 p-6 -mx-6 rounded-2xl transition-all duration-300',
          isHovered && 'bg-white/60 backdrop-blur-sm shadow-lg border border-white/20'
        )}
      >
        {/* Beautiful drag handle */}
        <motion.div
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </motion.div>

        {/* Block type indicator */}
        {blockTypeInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'w-2 h-2 rounded-full bg-gradient-to-r',
              blockTypeInfo.color
            )}
          />
        )}

        {/* Block content */}
        <div className="flex-1 min-w-0">
          {renderSexyBlockContent()}
        </div>

        {/* Sexy block menu */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 20 }}
          className="flex items-center gap-2"
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-600" />
          </motion.button>
        </motion.div>

        {/* Beautiful dropdown menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-16 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-2 z-50 min-w-[200px]"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onDuplicate(); setIsMenuOpen(false); }}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all flex items-center gap-3"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onMoveUp(); setIsMenuOpen(false); }}
                disabled={isFirst}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <ChevronUp className="w-4 h-4" />
                Move Up
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onMoveDown(); setIsMenuOpen(false); }}
                disabled={isLast}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <ChevronDown className="w-4 h-4" />
                Move Down
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onDelete(); setIsMenuOpen(false); }}
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl transition-all flex items-center gap-3"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Beautiful slash command menu */}
      <AnimatePresence>
        {showSlashMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute left-0 top-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 z-50 w-96 max-h-96 overflow-y-auto"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <input
                  type="text"
                  value={slashQuery}
                  onChange={(e) => setSlashQuery(e.target.value)}
                  placeholder="Search blocks..."
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              {filteredBlockTypes.map((blockType, index) => (
                <motion.button
                  key={blockType.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleBlockTypeSelect(blockType.type)}
                  className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 rounded-xl transition-all flex items-center gap-4"
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl bg-gradient-to-r flex items-center justify-center',
                    blockType.color
                  )}>
                    <blockType.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{blockType.label}</div>
                    <div className="text-xs text-gray-500">{blockType.description}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const SexyBlockEditor: React.FC<SexyBlockEditorProps> = ({ blocks, onChange, className }) => {
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Add new block
  const addBlock = useCallback((index: number, type: BlockType = 'text') => {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random()}`,
      type,
      content: type === 'text' ? '' : type === 'heading_1' ? 'New Heading' : '',
      position: index,
    };

    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    
    newBlocks.forEach((block, i) => {
      block.position = i;
    });

    onChange(newBlocks);
  }, [blocks, onChange]);

  // Update block
  const updateBlock = useCallback((updatedBlock: Block) => {
    const newBlocks = blocks.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    );
    onChange(newBlocks);
  }, [blocks, onChange]);

  // Delete block
  const deleteBlock = useCallback((blockId: string) => {
    const newBlocks = blocks.filter(block => block.id !== blockId);
    
    newBlocks.forEach((block, i) => {
      block.position = i;
    });

    onChange(newBlocks);
  }, [blocks, onChange]);

  // Duplicate block
  const duplicateBlock = useCallback((blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const newBlock: Block = {
      ...block,
      id: `block-${Date.now()}-${Math.random()}`,
      position: block.position + 1,
    };

    const newBlocks = [...blocks];
    newBlocks.splice(block.position + 1, 0, newBlock);
    
    newBlocks.forEach((block, i) => {
      block.position = i;
    });

    onChange(newBlocks);
  }, [blocks, onChange]);

  // Move block up/down
  const moveBlockUp = useCallback((blockId: string) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index <= 0) return;

    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    
    newBlocks.forEach((block, i) => {
      block.position = i;
    });

    onChange(newBlocks);
  }, [blocks, onChange]);

  const moveBlockDown = useCallback((blockId: string) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index >= blocks.length - 1) return;

    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    
    newBlocks.forEach((block, i) => {
      block.position = i;
    });

    onChange(newBlocks);
  }, [blocks, onChange]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedBlock) return;

    const draggedIndex = blocks.findIndex(b => b.id === draggedBlock);
    if (draggedIndex === dropIndex) return;

    const newBlocks = [...blocks];
    const [draggedBlockObj] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(dropIndex, 0, draggedBlockObj);

    newBlocks.forEach((block, i) => {
      block.position = i;
    });

    onChange(newBlocks);
    setDraggedBlock(null);
    setDragOverIndex(null);
  }, [blocks, draggedBlock, onChange]);

  // Initialize with one text block if empty
  useEffect(() => {
    if (blocks.length === 0) {
      onChange([{
        id: `block-${Date.now()}`,
        type: 'text',
        content: '',
        position: 0,
      }]);
    }
  }, [blocks.length, onChange]);

  return (
    <div className={cn('space-y-4', className)}>
      {blocks.map((block, index) => (
        <div
          key={block.id}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          className={cn(
            'transition-all duration-300',
            dragOverIndex === index && 'border-t-2 border-purple-500'
          )}
        >
          <SexyBlockComponent
            block={block}
            onChange={updateBlock}
            onDelete={() => deleteBlock(block.id)}
            onDuplicate={() => duplicateBlock(block.id)}
            onMoveUp={() => moveBlockUp(block.id)}
            onMoveDown={() => moveBlockDown(block.id)}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
          />
          
          {/* Beautiful add block button */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => addBlock(index)}
              className="absolute -bottom-4 left-8 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SexyBlockEditor;
