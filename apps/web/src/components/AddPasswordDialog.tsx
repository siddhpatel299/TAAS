import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Mail,
  CreditCard,
  ShoppingBag,
  Gamepad2,
  Code,
  Folder,
  Users,
  Briefcase,
  X,
} from 'lucide-react';
import { usePasswordVaultStore } from '@/stores/password-vault.store';
import { cn } from '@/lib/utils';

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

interface AddPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPasswordDialog({ isOpen, onClose }: AddPasswordDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: '',
    tags: [] as string[],
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { createPassword, generatePassword, checkPasswordStrength, isCreating } = usePasswordVaultStore();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        category: '',
        tags: [],
      });
      setTagInput('');
      setPasswordStrength(null);
      setShowPassword(false);
    }
  }, [isOpen]);

  // Check password strength when password changes
  useEffect(() => {
    if (formData.password) {
      const timer = setTimeout(() => {
        checkPasswordStrength(formData.password)
          .then(setPasswordStrength)
          .catch(error => {
            console.error('Password strength check failed:', error);
            setPasswordStrength(null);
          });
      }, 500); // Debounce for 500ms
      
      return () => clearTimeout(timer);
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.password) {
      alert('Please fill in the required fields');
      return;
    }

    try {
      await createPassword(formData);
      onClose();
    } catch (error) {
      console.error('Failed to create password:', error);
      alert('Failed to create password. Please try again.');
    }
  };

  const generateNewPassword = async () => {
    setIsGenerating(true);
    try {
      const newPassword = await generatePassword({
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
      });
      setFormData(prev => ({ ...prev, password: newPassword }));
    } catch (error) {
      console.error('Failed to generate password:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const copyPassword = async () => {
    if (formData.password) {
      try {
        await navigator.clipboard.writeText(formData.password);
      } catch (error) {
        console.error('Failed to copy password:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add New Password</h2>
              <p className="text-sm text-gray-500">Securely store a new password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Gmail, Netflix, etc."
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username / Email
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="username@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter password"
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      disabled={!formData.password}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={generateNewPassword}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                  Generate
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {passwordStrength && passwordStrength.strength && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          passwordStrength.strength === 'weak' ? 'bg-red-500' :
                          passwordStrength.strength === 'fair' ? 'bg-yellow-500' :
                          passwordStrength.strength === 'good' ? 'bg-blue-500' :
                          'bg-green-500'
                        )}
                        style={{ width: `${(passwordStrength.score || 0) / 4 * 100}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-xs font-medium capitalize",
                      passwordStrength.strength === 'weak' ? 'text-red-600' :
                      passwordStrength.strength === 'fair' ? 'text-yellow-600' :
                      passwordStrength.strength === 'good' ? 'text-blue-600' :
                      'text-green-600'
                    )}>
                      {passwordStrength.strength}
                    </span>
                  </div>
                  {passwordStrength.suggestions && passwordStrength.suggestions.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <p>Suggestions:</p>
                      <ul className="list-disc list-inside mt-1">
                        {passwordStrength.suggestions.map((suggestion: string, idx: number) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(categoryIcons).map(([category, Icon]) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category }))}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                    formData.category === category
                      ? "border-red-500 bg-red-50 text-red-600"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Save Password
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
