import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Grid,
  List,
  SortAsc,
  SortDesc,
  LogOut,
  Moon,
  Sun,
  Menu,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth.store';
import { useFilesStore } from '@/stores/files.store';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { viewMode, setViewMode, sortOrder, setSortOrder, searchQuery, setSearchQuery } =
    useFilesStore();
  const [isDark, setIsDark] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || user.username?.[0] || 'U'}`
    : 'U';

  return (
    <header className="h-20 glass border-b border-border/50 px-6 flex items-center justify-between gap-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-10 w-10 rounded-xl bg-foreground/5 hover:bg-foreground/10"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-2xl">
        <motion.div 
          className={cn(
            "relative transition-all duration-300",
            searchFocused && "scale-[1.02]"
          )}
        >
          {/* Glow effect on focus */}
          <div className={cn(
            "absolute inset-0 bg-foreground/10 rounded-xl blur-xl opacity-0 transition-opacity duration-300",
            searchFocused && "opacity-30"
          )} />
          
          <div className="relative">
            <Search className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300",
              searchFocused ? "text-foreground" : "text-foreground/40"
            )} />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="pl-12 h-12 rounded-xl bg-foreground/5 dark:bg-white/5 border-border focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 transition-all text-base placeholder:text-foreground/40"
            />
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <kbd className="px-2 py-1 text-xs rounded-lg bg-foreground/10 text-foreground/70 font-medium">
                  ESC
                </kbd>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* View toggle */}
        <div className="hidden sm:flex items-center p-1 rounded-xl bg-foreground/5 border border-border">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-lg transition-all",
              viewMode === 'grid' 
                ? 'bg-foreground text-background shadow-md' 
                : 'hover:bg-foreground/5'
            )}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-lg transition-all",
              viewMode === 'list' 
                ? 'bg-foreground text-background shadow-md' 
                : 'hover:bg-foreground/5'
            )}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Sort order */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="hidden sm:flex h-10 w-10 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-border"
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </Button>
        </motion.div>

        {/* Theme toggle */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-border"
          >
            <motion.div
              initial={false}
              animate={{ rotate: isDark ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
            </motion.div>
          </Button>
        </motion.div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-12 gap-3 pl-1 pr-4 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-border transition-all"
            >
              <Avatar className="h-10 w-10 ring-2 ring-foreground/20">
                <AvatarImage src={user?.avatarUrl} alt={user?.firstName || 'User'} />
                <AvatarFallback className="bg-foreground text-background font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground/90">
                  {user?.firstName || 'User'}
                </p>
                <p className="text-xs text-foreground/50">
                  @{user?.username || 'telegram'}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-64 p-2 glass-strong rounded-xl border-border"
          >
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-foreground/20">
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback className="bg-foreground text-background font-semibold text-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-foreground/50 truncate">
                    @{user?.username || user?.telegramId}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={() => navigate('/settings')}
              className="h-11 rounded-lg cursor-pointer hover:bg-foreground/5 gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="h-11 rounded-lg cursor-pointer text-red-500 hover:bg-red-500/10 hover:text-red-500 gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
