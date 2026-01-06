import { motion } from 'framer-motion';
import { Star, FileText, Image, Video, Music, ExternalLink, MoreHorizontal } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface StarredFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

interface StarredFilesWidgetProps {
  files: StarredFile[];
  onFileClick?: (fileId: string) => void;
  onViewAll?: () => void;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  return FileText;
}

function getFileColor(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'text-pink-500 bg-pink-100';
  if (mimeType.startsWith('video/')) return 'text-purple-500 bg-purple-100';
  if (mimeType.startsWith('audio/')) return 'text-orange-500 bg-orange-100';
  return 'text-blue-500 bg-blue-100';
}

export function StarredFilesWidget({ files, onFileClick, onViewAll }: StarredFilesWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-3xl p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Starred Files</h3>
        </div>
        {onViewAll && files.length > 0 && (
          <button 
            onClick={onViewAll}
            className="text-sm text-gray-500 hover:text-cyan-600 transition-colors flex items-center gap-1"
          >
            View all
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="py-8 text-center">
          <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No starred files</p>
          <p className="text-gray-400 text-xs mt-1">Star important files for quick access</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.slice(0, 4).map((file, index) => {
            const Icon = getFileIcon(file.mimeType);
            const colorClasses = getFileColor(file.mimeType);
            const [iconColor, bgColor] = colorClasses.split(' ');
            
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onFileClick?.(file.id)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-lg">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Show More */}
      {files.length > 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 pt-4 border-t border-gray-100"
        >
          <button 
            onClick={onViewAll}
            className="w-full py-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
          >
            Show {files.length - 4} more starred files
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
