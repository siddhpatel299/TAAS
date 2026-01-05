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
  Crown,
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
    <aside className="w-72 glass-strong flex flex-col h-full border-r border-border/50">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center shadow-lg shadow-amber-500/15 group-hover:shadow-amber-500/25 transition-shadow"
          >
            <Send className="w-6 h-6 text-[#0a0d14]" />
          </motion.div>
          <div>
            <span className="font-bold text-2xl text-gradient tracking-wide">TAAS</span>
            <p className="text-xs text-foreground/50">Telegram as a Storage</p>
          </div>
        </Link>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button 
            className="w-full justify-start gap-3 h-12 rounded-xl text-base font-semibold btn-luxury" 
            onClick={onUpload}
          >
            <div className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            Upload Files
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12 rounded-xl text-base font-medium bg-foreground/5 border-border hover:bg-foreground/10 hover:border-amber-500/30 transition-all"
            onClick={onNewFolder}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FolderPlus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20' 
                        : 'hover:bg-foreground/5 text-foreground/70 hover:text-foreground'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                      isActive 
                        ? 'bg-amber-500/15' 
                        : 'bg-foreground/5'
                    )}>
                      <item.icon className={cn(
                        'w-4 h-4',
                        isActive ? 'text-amber-600 dark:text-amber-400' : 'text-foreground/60'
                      )} />
                    </div>
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="ml-auto w-1 h-6 rounded-full bg-gold-gradient"
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
      <div className="p-4 m-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground/90">Storage</span>
            <p className="text-xs text-foreground/50">{formatFileSize(storageUsed)} used</p>
          </div>
        </div>
        <div className="relative h-1.5 rounded-full bg-foreground/10 overflow-hidden">
          <motion.div 
            className="absolute inset-y-0 left-0 rounded-full bg-gold-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${usagePercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center gap-2 mt-3 text-amber-600 dark:text-amber-400">
          <Crown className="w-4 h-4" />
          <p className="text-xs font-medium">
            Unlimited with Telegram
          </p>
        </div>
      </div>
    </aside>
  );
}
