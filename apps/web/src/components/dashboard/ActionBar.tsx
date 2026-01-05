import { motion } from 'framer-motion';
import { Plus, Upload, FolderPlus, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionBarProps {
  onCreateNew?: () => void;
  onUpload?: () => void;
  onCreateFolder?: () => void;
  onShare?: () => void;
}

export function ActionBar({ onCreateNew, onUpload, onCreateFolder, onShare }: ActionBarProps) {
  return (
    <div className="flex gap-4 mb-8">
      <ActionButton 
        icon={Plus} 
        label="Create" 
        onClick={onCreateNew}
      />
      <ActionButton 
        icon={Upload} 
        label="Upload or drop" 
        onClick={onUpload}
        primary
      />
      <ActionButton 
        icon={FolderPlus} 
        label="Create folder" 
        onClick={onCreateFolder}
      />
      <ActionButton 
        icon={Share2} 
        label="Share" 
        onClick={onShare}
      />
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  primary?: boolean;
}

function ActionButton({ icon: Icon, label, onClick, primary }: ActionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-200",
        "bg-white border border-gray-100 hover:shadow-lg hover:shadow-gray-200/50",
        primary && "border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center",
        primary 
          ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white" 
          : "bg-gray-100 text-gray-600"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-medium text-gray-700">{label}</span>
    </motion.button>
  );
}
