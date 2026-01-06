import { motion } from 'framer-motion';
import { 
  Zap, 
  Upload, 
  FolderOpen, 
  Share2, 
  Star,
  Trash2,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  action: () => void;
}

interface QuickActionsWidgetProps {
  onUpload?: () => void;
}

export function QuickActionsWidget({ onUpload }: QuickActionsWidgetProps) {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      color: 'text-green-600',
      bgColor: 'bg-green-100 hover:bg-green-200',
      action: () => onUpload?.(),
    },
    {
      id: 'browse',
      label: 'Browse',
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 hover:bg-blue-200',
      action: () => navigate('/files'),
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 hover:bg-yellow-200',
      action: () => navigate('/starred'),
    },
    {
      id: 'trash',
      label: 'Trash',
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-100 hover:bg-red-200',
      action: () => navigate('/trash'),
    },
    {
      id: 'shared',
      label: 'Shared',
      icon: Share2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 hover:bg-purple-200',
      action: () => navigate('/files?filter=shared'),
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100 hover:bg-cyan-200',
      action: () => {
        const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      },
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white rounded-3xl p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={action.action}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${action.bgColor} transition-all hover:scale-105`}
            >
              <Icon className={`w-6 h-6 ${action.color}`} />
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 pt-4 border-t border-gray-100"
      >
        <p className="text-xs text-gray-400 text-center">
          💡 Tip: Drag and drop files anywhere to upload
        </p>
      </motion.div>
    </motion.div>
  );
}
