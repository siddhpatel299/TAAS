import { motion } from 'framer-motion';
import { 
  Upload, 
  Download, 
  Trash2, 
  Star, 
  Share2,
  FolderPlus,
  Clock,
  FileEdit,
} from 'lucide-react';

// Helper function to format time distance
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export interface ActivityItem {
  id: string;
  type: 'upload' | 'download' | 'delete' | 'star' | 'share' | 'folder' | 'edit';
  fileName: string;
  timestamp: Date;
}

interface ActivityWidgetProps {
  activities: ActivityItem[];
  onViewAll?: () => void;
}

const activityConfig = {
  upload: {
    icon: Upload,
    color: 'text-green-500',
    bg: 'bg-green-100',
    label: 'Uploaded',
  },
  download: {
    icon: Download,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    label: 'Downloaded',
  },
  delete: {
    icon: Trash2,
    color: 'text-red-500',
    bg: 'bg-red-100',
    label: 'Deleted',
  },
  star: {
    icon: Star,
    color: 'text-yellow-500',
    bg: 'bg-yellow-100',
    label: 'Starred',
  },
  share: {
    icon: Share2,
    color: 'text-purple-500',
    bg: 'bg-purple-100',
    label: 'Shared',
  },
  folder: {
    icon: FolderPlus,
    color: 'text-orange-500',
    bg: 'bg-orange-100',
    label: 'Created folder',
  },
  edit: {
    icon: FileEdit,
    color: 'text-cyan-500',
    bg: 'bg-cyan-100',
    label: 'Renamed',
  },
};

export function ActivityWidget({ activities, onViewAll }: ActivityWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-3xl p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-sm text-gray-500 hover:text-cyan-600 transition-colors"
          >
            View all
          </button>
        )}
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="py-8 text-center">
          <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No recent activity</p>
          <p className="text-gray-400 text-xs mt-1">Your actions will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 group"
              >
                <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    <span className="text-gray-500">{config.label}</span>{' '}
                    <span className="font-medium">{activity.fileName}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Timeline Decoration */}
      {activities.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 pt-4 border-t border-gray-100 text-center"
        >
          <p className="text-xs text-gray-400">
            {activities.length} activities today
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
