import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Key,
  Plus,
  Search,
  Star,
  Copy,
  Eye,
  Trash2,
  Edit,
  Download,
  Settings,
  AlertTriangle,
  Grid,
  List,
  Globe,
  Mail,
  CreditCard,
  ShoppingBag,
  Gamepad2,
  Code,
  Folder,
  Users,
  Briefcase,
} from 'lucide-react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { usePasswordVaultStore } from '@/stores/password-vault.store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { PasswordEntry } from '@/lib/plugins-api';
import { AddPasswordDialogSimple } from '@/components/AddPasswordDialogSimple';
import { MasterKeyDialog } from '@/components/MasterKeyDialog';
import { PasswordGeneratorDialog } from '@/components/PasswordGeneratorDialog';

// Category Icons
const categoryIcons: Record<string, React.ElementType> = {
  'Social Media': Users,
  'Work': Briefcase,
  'Finance': CreditCard,
  'Shopping': ShoppingBag,
  'Entertainment': Gamepad2,
  'Development': Code,
  'Email': Mail,
  'Other': Folder,
};

// Password Strength Indicator
function PasswordStrengthIndicator({ strength }: { strength: 'weak' | 'fair' | 'good' | 'strong' }) {
  const colors = {
    weak: 'bg-red-500',
    fair: 'bg-yellow-500',
    good: 'bg-blue-500',
    strong: 'bg-green-500',
  };

  const widths = {
    weak: '25%',
    fair: '50%',
    good: '75%',
    strong: '100%',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', colors[strength])}
          style={{ width: widths[strength] }}
        />
      </div>
      <span className={cn(
        'text-xs font-medium capitalize',
        strength === 'weak' ? 'text-red-600' :
        strength === 'fair' ? 'text-yellow-600' :
        strength === 'good' ? 'text-blue-600' :
        'text-green-600'
      )}>
        {strength}
      </span>
    </div>
  );
}

// Password Card Component
function PasswordCard({ 
  password, 
  onView, 
  onEdit, 
  onDelete, 
  onCopy, 
  onToggleFavorite 
}: { 
  password: PasswordEntry;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const IconComponent = password.category ? categoryIcons[password.category] || Globe : Globe;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
      className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            password.category === 'Social Media' ? "bg-blue-100" :
            password.category === 'Work' ? "bg-green-100" :
            password.category === 'Finance' ? "bg-yellow-100" :
            password.category === 'Shopping' ? "bg-purple-100" :
            password.category === 'Entertainment' ? "bg-red-100" :
            password.category === 'Development' ? "bg-orange-100" :
            password.category === 'Email' ? "bg-cyan-100" :
            "bg-gray-100"
          )}>
            <IconComponent className={cn(
              "w-6 h-6",
              password.category === 'Social Media' ? "text-blue-600" :
              password.category === 'Work' ? "text-green-600" :
              password.category === 'Finance' ? "text-yellow-600" :
              password.category === 'Shopping' ? "text-purple-600" :
              password.category === 'Entertainment' ? "text-red-600" :
              password.category === 'Development' ? "text-orange-600" :
              password.category === 'Email' ? "text-cyan-600" :
              "text-gray-600"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{password.name}</h3>
            {password.username && (
              <p className="text-sm text-gray-500">{password.username}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {password.isFavorite && (
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          )}
          <button
            onClick={() => onToggleFavorite(password.id)}
            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-50 rounded-lg transition-colors"
          >
            <Star className={cn(
              "w-4 h-4",
              password.isFavorite ? "text-yellow-400 fill-yellow-400" : ""
            )} />
          </button>
        </div>
      </div>

      {password.url && (
        <div className="mb-3">
          <a
            href={password.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 truncate block"
          >
            {password.url}
          </a>
        </div>
      )}

      {password.passwordStrength && (
        <div className="mb-4">
          <PasswordStrengthIndicator strength={password.passwordStrength} />
        </div>
      )}

      {password.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {password.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
        <span>Created {formatDistanceToNow(new Date(password.createdAt), { addSuffix: true })}</span>
        {password.lastUsedAt && (
          <span>Used {formatDistanceToNow(new Date(password.lastUsedAt), { addSuffix: true })}</span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onView(password.id)}
          className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
        <button
          onClick={() => onCopy(password.id)}
          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Copy Password"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(password.id)}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(password.id)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Stats Card Component
function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend 
}: { 
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          color
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className="text-sm text-green-600 font-medium">{trend}</span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-500">{title}</p>
    </motion.div>
  );
}

export function PasswordVaultDashboardPage() {
  const {
    passwords,
    categories,
    dashboardStats,
    isLoading,
    error,
    viewMode,
    filters,
    isMasterKeySet,
    fetchDashboard,
    fetchPasswords,
    fetchCategories,
    deletePassword,
    copyPassword,
    toggleFavorite,
    setViewMode,
    setFilters,
    clearError,
  } = usePasswordVaultStore();

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMasterKeyDialog, setShowMasterKeyDialog] = useState(false);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchPasswords();
    fetchCategories();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleView = (id: string) => {
    // Navigate to password detail view
    window.location.href = `/plugins/password-vault/passwords/${id}`;
  };

  const handleEdit = (id: string) => {
    // Navigate to edit password
    window.location.href = `/plugins/password-vault/passwords/${id}/edit`;
  };

  const handleAddPassword = () => {
    if (!isMasterKeySet) {
      setShowMasterKeyDialog(true);
    } else {
      setShowAddDialog(true);
    }
  };

  const handleCopy = async (id: string) => {
    try {
      await copyPassword(id);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePassword(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const filteredPasswords = passwords.filter(password => {
    const matchesSearch = !filters.search || 
      password.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      password.username?.toLowerCase().includes(filters.search.toLowerCase()) ||
      password.url?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesCategory = !filters.category || password.category === filters.category;
    const matchesFavorite = !filters.isFavorite || password.isFavorite === filters.isFavorite;
    
    return matchesSearch && matchesCategory && matchesFavorite;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ModernSidebar />
      
      <main className="ml-20 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Password Vault</h1>
              <p className="text-gray-500 text-sm">Securely store and manage your passwords</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPasswordGenerator(true)}
              className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              title="Password Generator"
            >
              <Key className="w-5 h-5" />
            </button>
            <button
              onClick={() => {/* Export functionality */}}
              className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              title="Export Passwords"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => {/* Settings functionality */}}
              className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleAddPassword}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-rose-700 transition-all shadow-lg shadow-red-500/25"
            >
              <Plus className="w-4 h-4" />
              New Password
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Passwords"
              value={dashboardStats.totalPasswords}
              icon={Key}
              color="bg-blue-500"
            />
            <StatsCard
              title="Favorites"
              value={dashboardStats.favoriteCount}
              icon={Star}
              color="bg-yellow-500"
            />
            <StatsCard
              title="Weak Passwords"
              value={dashboardStats.weakPasswords}
              icon={AlertTriangle}
              color="bg-red-500"
            />
            <StatsCard
              title="Security Score"
              value={`${dashboardStats.securityScore}%`}
              icon={Shield}
              color="bg-green-500"
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search passwords..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filters & View Toggle */}
          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({ category: e.target.value || undefined })}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>

            {/* Favorite Filter */}
            <button
              onClick={() => setFilters({ isFavorite: filters.isFavorite ? undefined : true })}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-medium transition-all",
                filters.isFavorite
                  ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-yellow-300 hover:text-yellow-600"
              )}
            >
              <Star className="w-4 h-4 inline mr-1" />
              Favorites
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'list' 
                    ? "bg-red-100 text-red-600" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'grid' 
                    ? "bg-red-100 text-red-600" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              ×
            </button>
          </motion.div>
        )}

        {/* Passwords Grid/List */}
        {isLoading && passwords.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredPasswords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No passwords found</h3>
            <p className="text-gray-500 mb-6">
              {filters.search || filters.category || filters.isFavorite 
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first password to the vault'
              }
            </p>
            {!filters.search && !filters.category && !filters.isFavorite && (
              <button
                onClick={handleAddPassword}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-rose-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Your First Password
              </button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}>
            {filteredPasswords.map((password) => (
              <PasswordCard
                key={password.id}
                password={password}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteConfirm(id)}
                onCopy={handleCopy}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Password?</h3>
              <p className="text-gray-500 mb-6">
                This will permanently delete this password entry. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Add Password Dialog */}
        <AddPasswordDialogSimple
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
        />
        
        {/* Master Key Dialog */}
        <MasterKeyDialog
          isOpen={showMasterKeyDialog}
          onClose={() => setShowMasterKeyDialog(false)}
        />
        
        {/* Password Generator Dialog */}
        <PasswordGeneratorDialog
          isOpen={showPasswordGenerator}
          onClose={() => setShowPasswordGenerator(false)}
        />
      </main>
    </div>
  );
}
