import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Star,
  Trash2,
  FolderPlus,
  Upload,
  HardDrive,
  Send,
  Sparkles,
} from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  storageUsed: number;
  onNewFolder: () => void;
  onUpload: () => void;
}

const navItems = [
  { path: '/', label: 'My Files', icon: Home },
  { path: '/starred', label: 'Starred', icon: Star },
  { path: '/trash', label: 'Trash', icon: Trash2 },
];

export function Sidebar({ storageUsed, onNewFolder, onUpload }: SidebarProps) {
  const location = useLocation();

  // Since Telegram has "unlimited" storage, we'll show a large number
  const totalStorage = 1024 * 1024 * 1024 * 1024; // 1TB display
  const usagePercent = Math.min((storageUsed / totalStorage) * 100, 100);

  return (
    <aside className="w-72 glass-strong flex flex-col h-full border-r-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow"
          >
            <Send className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <span className="font-bold text-2xl text-gradient">TAAS</span>
            <p className="text-xs text-foreground/50">Telegram as a Storage</p>
          </div>
        </Link>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            className="w-full justify-start gap-3 h-12 rounded-xl text-base font-medium bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all" 
            onClick={onUpload}
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            Upload Files
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12 rounded-xl text-base font-medium bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30 transition-all"
            onClick={onNewFolder}
          >
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <FolderPlus className="w-4 h-4 text-violet-500" />
            </div>
            New Folder
          </Button>
        </motion.div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1 py-4">
          <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider px-3 mb-3">
            Navigation
          </p>
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={item.path}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 h-12 rounded-xl text-base font-medium transition-all',
                      isActive 
                        ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20' 
                        : 'hover:bg-white/10 text-foreground/70 hover:text-foreground'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                      isActive 
                        ? 'bg-violet-500/20' 
                        : 'bg-foreground/5'
                    )}>
                      <item.icon className={cn(
                        'w-4 h-4',
                        isActive ? 'text-violet-600' : 'text-foreground/60'
                      )} />
                    </div>
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="ml-auto w-1.5 h-6 rounded-full bg-gradient-to-b from-violet-500 to-purple-600"
                      />
                    )}
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Storage Usage */}
      <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/5 border border-violet-500/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground/90">Storage</span>
            <p className="text-xs text-foreground/50">{formatFileSize(storageUsed)} used</p>
          </div>
        </div>
        <div className="relative h-2 rounded-full bg-foreground/10 overflow-hidden">
          <motion.div 
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${usagePercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center gap-2 mt-3 text-violet-600">
          <Sparkles className="w-4 h-4" />
          <p className="text-xs font-medium">
            Unlimited with Telegram
          </p>
        </div>
      </div>
    </aside>
  );
}
