import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Grid,
  List,
  SortAsc,
  SortDesc,
  LogOut,
  User,
  Moon,
  Sun,
  Menu,
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

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { viewMode, setViewMode, sortOrder, setSortOrder, searchQuery, setSearchQuery } =
    useFilesStore();
  const [isDark, setIsDark] = useState(false);

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
    <header className="h-16 border-b bg-card px-4 flex items-center justify-between gap-4">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="hidden sm:flex items-center border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Sort order */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="hidden sm:flex"
        >
          {sortOrder === 'asc' ? (
            <SortAsc className="w-4 h-4" />
          ) : (
            <SortDesc className="w-4 h-4" />
          )}
        </Button>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} alt={user?.firstName || 'User'} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{user?.username || user?.telegramId}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
