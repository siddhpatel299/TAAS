import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  FolderOpen,
  Heart,
  Trash2,
  Settings,
  LogOut,
  Send,
  MessageSquare,
  Puzzle,
  Briefcase,
  CheckSquare,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { usePluginsStore } from '@/stores/plugins.store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ModernSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const mainNavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutGrid },
  { path: '/files', label: 'My Files', icon: FolderOpen },
  { path: '/telegram', label: 'Telegram Chats', icon: MessageSquare },
  { path: '/starred', label: 'Favorites', icon: Heart },
  { path: '/trash', label: 'Trash', icon: Trash2 },
];

// Plugin icons mapping
const pluginIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'job-tracker': Briefcase,
  'todo-lists': CheckSquare,
  'password-vault': Shield,
};

export function ModernSidebar({ collapsed: _collapsed = false }: ModernSidebarProps) {
  const location = useLocation();
  const { logout } = useAuthStore();
  const { enabledPlugins } = usePluginsStore();

  // Get enabled plugin items for sidebar
  const enabledPluginItems = enabledPlugins
    .filter(p => p.enabled)
    .map(p => ({
      path: `/plugins/${p.id}`,
      label: p.id === 'job-tracker' ? 'Job Tracker' : p.name || p.id,
      icon: pluginIcons[p.id] || Puzzle,
    }));

  return (
    <aside className="fixed left-0 top-0 h-full w-20 bg-white shadow-sm flex flex-col items-center py-6 z-50">
      {/* Logo */}
      <Link to="/" className="mb-8">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"
        >
          <Send className="w-6 h-6 text-white" />
        </motion.div>
      </Link>

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/' && location.pathname.startsWith('/?'));
          
          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link to={item.path}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                        : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                  </motion.div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white border-0">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Divider before plugins */}
        {enabledPluginItems.length > 0 && (
          <div className="w-8 h-px bg-gray-200 my-2" />
        )}

        {/* Enabled Plugins */}
        {enabledPluginItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          
          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link to={item.path}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-lg shadow-purple-500/30"
                        : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white border-0">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Plugins Store */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link to="/plugins">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200",
                  location.pathname === '/plugins'
                    ? "bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-lg shadow-purple-500/30"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                )}
              >
                <Puzzle className="w-5 h-5" />
              </motion.div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-900 text-white border-0">
            Plugins Store
          </TooltipContent>
        </Tooltip>
      </nav>

      {/* Bottom Navigation - Settings */}
      <div className="flex flex-col items-center gap-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-900 text-white border-0">
            Settings (Coming Soon)
          </TooltipContent>
        </Tooltip>

        {/* Logout */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => logout()}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-900 text-white border-0">
            Logout
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
