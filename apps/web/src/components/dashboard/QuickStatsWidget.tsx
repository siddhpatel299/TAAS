import { motion } from 'framer-motion';
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  Folder, 
  Star,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface QuickStatsProps {
  stats: {
    totalFiles: number;
    totalFolders: number;
    starredFiles: number;
    recentUploads: number;
    images: number;
    videos: number;
    documents: number;
    audio: number;
  };
}

export function QuickStatsWidget({ stats }: QuickStatsProps) {
  const statItems = [
    { 
      label: 'Total Files', 
      value: stats.totalFiles, 
      icon: FileText, 
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    { 
      label: 'Folders', 
      value: stats.totalFolders, 
      icon: Folder, 
      color: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    { 
      label: 'Starred', 
      value: stats.starredFiles, 
      icon: Star, 
      color: 'from-yellow-400 to-yellow-500',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    { 
      label: 'Recent', 
      value: stats.recentUploads, 
      icon: Clock, 
      color: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
  ];

  const typeItems = [
    { label: 'Images', value: stats.images, icon: Image, color: 'text-pink-500' },
    { label: 'Videos', value: stats.videos, icon: Video, color: 'text-purple-500' },
    { label: 'Docs', value: stats.documents, icon: FileText, color: 'text-blue-500' },
    { label: 'Audio', value: stats.audio, icon: Music, color: 'text-orange-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className={`w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <item.icon className={`w-5 h-5 ${item.iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            <p className="text-sm text-gray-500">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* File Types */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">By Type</p>
        <div className="flex items-center justify-between">
          {typeItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-2 hover:bg-gray-100 transition-colors cursor-pointer">
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <p className="text-lg font-semibold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
