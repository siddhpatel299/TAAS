import { motion } from 'framer-motion';
import { Play, FileText, Image, Folder } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface FolderCategory {
  type: 'video' | 'document' | 'photo' | 'other';
  itemCount: number;
  size: number;
}

interface FolderCategoriesProps {
  categories: FolderCategory[];
  onCategoryClick?: (type: string) => void;
}

const categoryConfig = {
  video: {
    icon: Play,
    label: 'Video',
    gradient: 'from-cyan-400 to-cyan-500',
    bgColor: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  document: {
    icon: FileText,
    label: 'Document',
    gradient: 'from-blue-400 to-blue-500',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  photo: {
    icon: Image,
    label: 'Photo',
    gradient: 'from-cyan-400 to-blue-400',
    bgColor: 'bg-gradient-to-br from-cyan-100 to-blue-100',
    iconColor: 'text-blue-600',
  },
  other: {
    icon: Folder,
    label: 'Other',
    gradient: 'from-orange-300 to-orange-400',
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
};

export function FolderCategories({ categories, onCategoryClick }: FolderCategoriesProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Folders</h2>
        <button className="text-sm text-gray-500 hover:text-cyan-600 transition-colors">
          See all
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category, index) => {
          const config = categoryConfig[category.type];
          const Icon = config.icon;

          return (
            <motion.button
              key={category.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCategoryClick?.(category.type)}
              className="bg-white rounded-3xl p-6 text-left hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300"
            >
              {/* Icon */}
              <div className={`w-20 h-20 ${config.bgColor} rounded-2xl flex items-center justify-center mb-4`}>
                <Icon className={`w-10 h-10 ${config.iconColor}`} />
              </div>

              {/* Label */}
              <h3 className="font-semibold text-gray-900 mb-1">{config.label}</h3>
              
              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{category.itemCount} items</span>
                <span>{formatFileSize(category.size)}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Default categories for when data isn't available yet
export const defaultCategories: FolderCategory[] = [
  { type: 'video', itemCount: 0, size: 0 },
  { type: 'document', itemCount: 0, size: 0 },
  { type: 'photo', itemCount: 0, size: 0 },
  { type: 'other', itemCount: 0, size: 0 },
];
