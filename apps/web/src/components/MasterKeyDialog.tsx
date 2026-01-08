import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, X, Lock } from 'lucide-react';
import { usePasswordVaultStore } from '@/stores/password-vault.store';

interface MasterKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MasterKeyDialog({ isOpen, onClose }: MasterKeyDialogProps) {
  const [masterKey, setMasterKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSetting, setIsSetting] = useState(false);
  const [error, setError] = useState('');
  
  const { setMasterKey: setStoreMasterKey, isMasterKeySet } = usePasswordVaultStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (masterKey.length < 8) {
      setError('Master key must be at least 8 characters long');
      return;
    }
    
    if (masterKey !== confirmKey) {
      setError('Master keys do not match');
      return;
    }

    setIsSetting(true);
    try {
      setStoreMasterKey(masterKey);
      onClose();
      setMasterKey('');
      setConfirmKey('');
    } catch (error) {
      setError('Failed to set master key. Please try again.');
    } finally {
      setIsSetting(false);
    }
  };

  if (!isOpen || isMasterKeySet) return null;

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
        className="bg-white rounded-2xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Set Master Key</h2>
              <p className="text-sm text-gray-500">Create a master key to encrypt your passwords</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Important Security Notice</p>
                <ul className="space-y-1 text-xs">
                  <li>• Your master key encrypts all passwords locally</li>
                  <li>• Store it safely - we cannot recover it</li>
                  <li>• Use a strong, memorable passphrase</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Master Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Master Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your master key"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            {/* Confirm Master Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Master Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={confirmKey}
                  onChange={(e) => setConfirmKey(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Confirm your master key"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

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
                disabled={isSetting}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSetting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Set Master Key
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
