import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Star,
  Trash2,
  FolderPlus,
  Upload,
  HardDrive,
} from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
    <aside className="w-64 border-r bg-card flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-xl">TAAS</span>
        </Link>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2">
        <Button className="w-full justify-start gap-2" onClick={onUpload}>
          <Upload className="w-4 h-4" />
          Upload Files
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onNewFolder}
        >
          <FolderPlus className="w-4 h-4" />
          New Folder
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2">
        <nav className="space-y-1 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2',
                    isActive && 'bg-secondary'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Storage Usage */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Storage</span>
        </div>
        <Progress value={usagePercent} className="h-2 mb-2" />
        <p className="text-xs text-muted-foreground">
          {formatFileSize(storageUsed)} used
        </p>
        <p className="text-xs text-primary font-medium mt-1">
          ✨ Unlimited with Telegram
        </p>
      </div>
    </aside>
  );
}
