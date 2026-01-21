import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, List } from 'lucide-react';
import { cn } from '@/lib/utils';

// ====================
// TYPES
// ====================

export interface HeadingItem {
    id: string;
    level: 1 | 2 | 3;
    text: string;
    position: number;
}

interface TableOfContentsProps {
    contentJson: any;
    activeHeadingId?: string;
    onHeadingClick: (id: string, position: number) => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Extract headings from Tiptap JSON content
 */
export function extractHeadings(contentJson: any): HeadingItem[] {
    const headings: HeadingItem[] = [];

    if (!contentJson?.content) return headings;

    let position = 0;

    const extractText = (node: any): string => {
        if (node.type === 'text') return node.text || '';
        if (node.content) return node.content.map(extractText).join('');
        return '';
    };

    for (const node of contentJson.content) {
        if (node.type === 'heading' && node.attrs?.level) {
            const level = node.attrs.level as 1 | 2 | 3;
            if (level <= 3) {
                const text = extractText(node);
                if (text.trim()) {
                    headings.push({
                        id: `heading-${position}`,
                        level,
                        text: text.trim(),
                        position,
                    });
                }
            }
        }
        position++;
    }

    return headings;
}

// ====================
// COMPONENT
// ====================

export function TableOfContents({
    contentJson,
    activeHeadingId,
    onHeadingClick,
    isCollapsed = false,
    onToggleCollapse,
}: TableOfContentsProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    const headings = useMemo(() => extractHeadings(contentJson), [contentJson]);

    // Group headings into a tree structure
    const headingTree = useMemo(() => {
        const tree: (HeadingItem & { children: HeadingItem[] })[] = [];
        let currentH1: (HeadingItem & { children: HeadingItem[] }) | null = null;
        let currentH2: (HeadingItem & { children: HeadingItem[] }) | null = null;

        for (const heading of headings) {
            const item = { ...heading, children: [] };

            if (heading.level === 1) {
                tree.push(item);
                currentH1 = item;
                currentH2 = null;
            } else if (heading.level === 2) {
                if (currentH1) {
                    currentH1.children.push(item);
                } else {
                    tree.push(item);
                }
                currentH2 = item;
            } else if (heading.level === 3) {
                if (currentH2) {
                    currentH2.children.push(item);
                } else if (currentH1) {
                    currentH1.children.push(item);
                } else {
                    tree.push(item);
                }
            }
        }

        return tree;
    }, [headings]);

    const toggleSection = (id: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    if (headings.length === 0) {
        return (
            <div className={cn(
                'flex flex-col h-full bg-gray-50/50 border-r border-gray-200',
                isCollapsed ? 'w-10' : 'w-56'
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
                    {!isCollapsed && (
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contents</span>
                    )}
                    {onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-center p-4">
                        <p className="text-xs text-gray-400 text-center">
                            Add headings to your document to see the table of contents
                        </p>
                    </div>
                )}
            </div>
        );
    }

    const renderHeading = (heading: HeadingItem & { children?: HeadingItem[] }, depth = 0) => {
        const hasChildren = heading.children && heading.children.length > 0;
        const isExpanded = expandedSections.has(heading.id) || depth === 0;
        const isActive = activeHeadingId === heading.id;

        return (
            <div key={heading.id}>
                <button
                    onClick={() => {
                        onHeadingClick(heading.id, heading.position);
                        if (hasChildren) toggleSection(heading.id);
                    }}
                    className={cn(
                        'w-full flex items-center gap-1.5 py-1.5 text-left text-sm rounded-md transition-colors',
                        'hover:bg-gray-100',
                        isActive ? 'bg-sky-50 text-sky-700 font-medium' : 'text-gray-600',
                        heading.level === 1 && 'font-medium',
                        heading.level === 2 && 'text-[13px]',
                        heading.level === 3 && 'text-xs text-gray-500',
                    )}
                    style={{ paddingLeft: `${8 + depth * 12}px` }}
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown className="w-3 h-3 flex-shrink-0 text-gray-400" />
                        ) : (
                            <ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-400" />
                        )
                    ) : (
                        <span className="w-3" />
                    )}
                    <span className="truncate">{heading.text}</span>
                </button>

                {hasChildren && isExpanded && (
                    <div className="ml-2">
                        {heading.children!.map((child) => renderHeading(child as any, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (isCollapsed) {
        return (
            <div className="w-10 h-full bg-gray-50/50 border-r border-gray-200 flex flex-col items-center py-3">
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-400"
                        title="Show table of contents"
                    >
                        <List className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-56 h-full bg-gray-50/50 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contents</span>
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="p-1 hover:bg-gray-200 rounded text-gray-400"
                        title="Hide table of contents"
                    >
                        <List className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Headings List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {headingTree.map((heading) => renderHeading(heading))}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-gray-200 text-xs text-gray-400">
                {headings.length} heading{headings.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
}
