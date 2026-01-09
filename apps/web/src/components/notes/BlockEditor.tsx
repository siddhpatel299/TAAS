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
  Flag,
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
  content: any; // JSON content based on type
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

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  className?: string;
}

// Block type definitions
const BLOCK_TYPES = [
  { type: 'text' as BlockType, label: 'Text', icon: Type, description: 'Just start typing' },
  { type: 'heading_1' as BlockType, label: 'Heading 1', icon: Heading1, description: 'Big section heading' },
  { type: 'heading_2' as BlockType, label: 'Heading 2', icon: Heading2, description: 'Medium section heading' },
  { type: 'heading_3' as BlockType, label: 'Heading 3', icon: Heading3, description: 'Small section heading' },
  { type: 'bullet_list' as BlockType, label: 'Bullet List', icon: List, description: 'Create a simple bullet list' },
  { type: 'numbered_list' as BlockType, label: 'Numbered List', icon: ListOrdered, description: 'Create a numbered list' },
  { type: 'todo' as BlockType, label: 'To-do List', icon: CheckSquare, description: 'Track tasks with a to-do list' },
  { type: 'quote' as BlockType, label: 'Quote', icon: Quote, description: 'Capture a quote' },
  { type: 'code' as BlockType, label: 'Code', icon: Code, description: 'Capture a code snippet' },
  { type: 'callout' as BlockType, label: 'Callout', icon: Flag, description: 'Highlight important information' },
  { type: 'bookmark' as BlockType, label: 'Bookmark', icon: Bookmark, description: 'Embed a bookmark' },
  { type: 'embed' as BlockType, label: 'Embed', icon: Link2, description: 'Embed content from another site' },
  { type: 'column' as BlockType, label: 'Columns', icon: Columns, description: 'Arrange content in columns' },
  { type: 'divider' as BlockType, label: 'Divider', icon: Plus, description: 'Visual divider' },
];

// Block components
const BlockComponent: React.FC<{
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
  const [isDragging, setIsDragging] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // Handle content change
  const handleContentChange = useCallback((content: any) => {
    onChange({ ...block, content });
  }, [block, onChange]);

  
  // Handle slash command
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '/') {
      const target = e.target as HTMLTextAreaElement;
      if (target.selectionStart === 0 && target.value === '') {
        e.preventDefault();
        setShowSlashMenu(true);
      }
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
      setSlashQuery('');
    }
  }, []);

  // Handle block type selection from slash menu
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

  // Filter block types based on query
  const filteredBlockTypes = BLOCK_TYPES.filter(bt =>
    bt.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
    bt.description.toLowerCase().includes(slashQuery.toLowerCase())
  );

  // Render block content based on type
  const renderBlockContent = () => {
    const { type, content, properties } = block;

    switch (type) {
      case 'text':
        return (
          <textarea
            ref={inputRef}
            value={content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
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
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Heading 1"
            className="w-full bg-transparent border-none outline-none resize-none font-bold text-3xl text-gray-900 placeholder-gray-400"
            rows={1}
            style={{ textAlign: properties?.textAlign || 'left' }}
          />
        );

      case 'heading_2':
        return (
          <textarea
            ref={inputRef}
            value={content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Heading 2"
            className="w-full bg-transparent border-none outline-none resize-none font-semibold text-2xl text-gray-900 placeholder-gray-400"
            rows={1}
            style={{ textAlign: properties?.textAlign || 'left' }}
          />
        );

      case 'heading_3':
        return (
          <textarea
            ref={inputRef}
            value={content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Heading 3"
            className="w-full bg-transparent border-none outline-none resize-none font-medium text-xl text-gray-900 placeholder-gray-400"
            rows={1}
            style={{ textAlign: properties?.textAlign || 'left' }}
          />
        );

      case 'bullet_list':
        return (
          <div className="space-y-1">
            {(content || ['']).map((item: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-gray-400">•</span>
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
          <div className="space-y-1">
            {(content || ['']).map((item: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-gray-400 w-6">{index + 1}.</span>
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
          <div className="space-y-1">
            {(content || [{ text: '', checked: false }]).map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.checked || false}
                  onChange={(e) => {
                    const newContent = [...(content || [])];
                    newContent[index] = { ...item, checked: e.target.checked };
                    handleContentChange(newContent);
                  }}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
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
          <div className="border-l-4 border-gray-300 pl-4">
            <textarea
              ref={inputRef}
              value={content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Empty quote..."
              className="w-full bg-transparent border-none outline-none resize-none italic text-gray-700 placeholder-gray-400"
              rows={2}
            />
          </div>
        );

      case 'code':
        return (
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <select
                value={content?.language || 'javascript'}
                onChange={(e) => handleContentChange({ ...content, language: e.target.value })}
                className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
              </select>
              <button
                onClick={() => navigator.clipboard.writeText(content?.code || '')}
                className="text-xs text-gray-400 hover:text-gray-300"
              >
                Copy
              </button>
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
              'rounded-lg p-4 border-l-4',
              content?.color === 'red' && 'bg-red-50 border-red-400',
              content?.color === 'blue' && 'bg-blue-50 border-blue-400',
              content?.color === 'green' && 'bg-green-50 border-green-400',
              content?.color === 'yellow' && 'bg-yellow-50 border-yellow-400',
              !content?.color && 'bg-gray-50 border-gray-400'
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{content?.emoji || '💡'}</span>
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
        return <div className="border-t border-gray-300 my-4" />;

      default:
        return (
          <textarea
            ref={inputRef}
            value={content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type '/' for commands..."
            className="w-full bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-400"
            rows={1}
          />
        );
    }
  };

  return (
    <div className="relative group">
      {/* Block wrapper */}
      <div
        className={cn(
          'relative flex items-start gap-2 p-2 -mx-2 rounded-lg transition-colors',
          isDragging && 'bg-gray-100',
          !isDragging && 'hover:bg-gray-50'
        )}
      >
        {/* Drag handle */}
        <div
          ref={dragRef}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        {/* Block content */}
        <div className="flex-1 min-w-0">
          {renderBlockContent()}
        </div>

        {/* Block menu */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-600" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[200px]"
              >
                <button
                  onClick={() => { onDuplicate(); setIsMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => { onMoveUp(); setIsMenuOpen(false); }}
                  disabled={isFirst}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronUp className="w-4 h-4" />
                  Move Up
                </button>
                <button
                  onClick={() => { onMoveDown(); setIsMenuOpen(false); }}
                  disabled={isLast}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronDown className="w-4 h-4" />
                  Move Down
                </button>
                <button
                  onClick={() => { onDelete(); setIsMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Slash command menu */}
      <AnimatePresence>
        {showSlashMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute left-0 top-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 w-80 max-h-80 overflow-y-auto"
          >
            <div className="px-3 py-2 border-b border-gray-100">
              <input
                type="text"
                value={slashQuery}
                onChange={(e) => setSlashQuery(e.target.value)}
                placeholder="Type a command..."
                className="w-full text-sm outline-none"
                autoFocus
              />
            </div>
            <div className="py-1">
              {filteredBlockTypes.map((blockType) => (
                <button
                  key={blockType.type}
                  onClick={() => handleBlockTypeSelect(blockType.type)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3"
                >
                  <blockType.icon className="w-4 h-4 text-gray-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{blockType.label}</div>
                    <div className="text-xs text-gray-500">{blockType.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange, className }) => {
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
    
    // Reorder positions
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
    
    // Reorder positions
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
    
    // Reorder positions
    newBlocks.forEach((block, i) => {
      block.position = i;
    });

    onChange(newBlocks);
  }, [blocks, onChange]);

  // Move block up
  const moveBlockUp = useCallback((blockId: string) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index <= 0) return;

    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    
    // Reorder positions
    newBlocks.forEach((block, i) => {
      block.position = i;
    });

    onChange(newBlocks);
  }, [blocks, onChange]);

  // Move block down
  const moveBlockDown = useCallback((blockId: string) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index >= blocks.length - 1) return;

    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    
    // Reorder positions
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

    // Reorder positions
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
    <div className={cn('space-y-1', className)}>
      {blocks.map((block, index) => (
        <div
          key={block.id}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          className={cn(
            'transition-all',
            dragOverIndex === index && 'border-t-2 border-indigo-500'
          )}
        >
          <BlockComponent
            block={block}
            onChange={updateBlock}
            onDelete={() => deleteBlock(block.id)}
            onDuplicate={() => duplicateBlock(block.id)}
            onMoveUp={() => moveBlockUp(block.id)}
            onMoveDown={() => moveBlockDown(block.id)}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
          />
          
          {/* Add block button */}
          <div className="relative">
            <button
              onClick={() => addBlock(index)}
              className="absolute -bottom-3 left-8 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md"
            >
              <Plus className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BlockEditor;
