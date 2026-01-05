import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/utils';

interface StorageByType {
  video: number;
  document: number;
  photo: number;
  other: number;
}

interface StorageWidgetProps {
  totalUsed: number;
  byType?: StorageByType;
  fileStats?: {
    videoCount: number;
    documentCount: number;
    photoCount: number;
    otherCount: number;
  };
}

export function StorageWidget({ totalUsed, byType, fileStats }: StorageWidgetProps) {
  // Calculate sizes from byType or estimate from total
  const video = byType?.video || totalUsed * 0.25;
  const document = byType?.document || totalUsed * 0.10;
  const photo = byType?.photo || totalUsed * 0.35;
  const other = byType?.other || totalUsed * 0.30;

  // For the donut chart - calculate stroke dash arrays
  const circumference = 2 * Math.PI * 40; // radius = 40
  const total = video + document + photo + other || 1;
  
  const segments = [
    { name: 'Photo', value: photo, color: '#fb923c', percentage: (photo / total) * 100 },
    { name: 'Video', value: video, color: '#22d3ee', percentage: (video / total) * 100 },
    { name: 'Documents', value: document, color: '#60a5fa', percentage: (document / total) * 100 },
    { name: 'Other', value: other, color: '#a5b4fc', percentage: (other / total) * 100 },
  ];

  // Calculate stroke offsets for the donut chart
  let accumulatedOffset = 0;
  const segmentData = segments.map((segment) => {
    const dashArray = (segment.percentage / 100) * circumference;
    const dashOffset = -accumulatedOffset;
    accumulatedOffset += dashArray;
    return { ...segment, dashArray, dashOffset };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Storage</h3>
        <button className="text-sm text-gray-500 hover:text-cyan-600 transition-colors">
          View details
        </button>
      </div>

      {/* Donut Chart */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="12"
          />
          
          {/* Segments */}
          {segmentData.map((segment, index) => (
            <motion.circle
              key={segment.name}
              initial={{ strokeDasharray: "0 251.2" }}
              animate={{ strokeDasharray: `${segment.dashArray} ${circumference}` }}
              transition={{ duration: 1, delay: index * 0.1 }}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={segment.color}
              strokeWidth="12"
              strokeDashoffset={segment.dashOffset}
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="text-3xl font-bold text-gray-900"
          >
            ∞
          </motion.span>
          <span className="text-sm text-gray-500">Unlimited</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {segments.map((segment, index) => (
          <motion.div
            key={segment.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-gray-600">{segment.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {formatFileSize(segment.value)}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Available Storage Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6 p-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl text-center"
      >
        <p className="text-white font-medium flex items-center justify-center gap-2">
          <span className="text-lg">♾️</span>
          Unlimited Storage
        </p>
        <p className="text-white/80 text-xs mt-1">Powered by Telegram</p>
      </motion.div>

      {/* Usage Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Total used</span>
          <span className="font-semibold text-gray-900">{formatFileSize(totalUsed)}</span>
        </div>
      </div>
    </motion.div>
  );
}
