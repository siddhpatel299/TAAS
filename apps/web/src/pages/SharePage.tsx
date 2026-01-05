import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Lock, AlertCircle, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { shareApi } from '../lib/api';

interface FileInfo {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [file, setFile] = useState<FileInfo | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [downloadsRemaining, setDownloadsRemaining] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchFileInfo();
    }
  }, [token]);

  const fetchFileInfo = async () => {
    try {
      const response = await shareApi.getPublicFile(token!);
      setFile(response.data.file);
      setRequiresPassword(response.data.requiresPassword);
      setDownloadsRemaining(response.data.downloadsRemaining);
      setExpiresAt(response.data.expiresAt);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load file information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (requiresPassword && !password) {
      setPasswordError('Please enter the password');
      return;
    }

    setDownloading(true);
    setPasswordError(null);

    try {
      const response = await shareApi.downloadPublic(token!, password || undefined);
      
      // Create download
      const blob = new Blob([response.data], { type: file?.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file?.originalName || 'download';
      a.click();
      URL.revokeObjectURL(url);

      setSuccess(true);
      
      // Update remaining downloads
      if (downloadsRemaining !== null) {
        setDownloadsRemaining(downloadsRemaining - 1);
      }
    } catch (err: any) {
      if (err.response?.data?.error === 'Invalid password') {
        setPasswordError('Invalid password');
      } else {
        setError(err.response?.data?.error || 'Download failed');
      }
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const getFileIcon = () => {
    if (!file) return '📄';
    if (file.mimeType.startsWith('image/')) return '🖼️';
    if (file.mimeType.startsWith('video/')) return '🎬';
    if (file.mimeType.startsWith('audio/')) return '🎵';
    if (file.mimeType === 'application/pdf') return '📕';
    if (file.mimeType.includes('zip') || file.mimeType.includes('archive')) return '📦';
    if (file.mimeType.includes('spreadsheet') || file.mimeType.includes('excel')) return '📊';
    if (file.mimeType.includes('document') || file.mimeType.includes('word')) return '📝';
    return '📄';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Unavailable</h1>
          <p className="text-gray-500">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            TAAS
          </h1>
          <p className="text-sm text-gray-500">Telegram as a Storage</p>
        </div>

        {/* File info */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{getFileIcon()}</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">
                {file?.originalName || file?.name}
              </h2>
              <p className="text-sm text-gray-500">
                {formatFileSize(file?.size || 0)}
              </p>
              {downloadsRemaining !== null && (
                <p className="text-xs text-amber-600 mt-1">
                  {downloadsRemaining} downloads remaining
                </p>
              )}
              {expiresAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Expires {new Date(expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Password input */}
        {requiresPassword && (
          <div className="mb-6">
            <Label className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4" />
              This file is password protected
            </Label>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(null);
              }}
              className={passwordError ? 'border-red-500' : ''}
            />
            {passwordError && (
              <p className="text-sm text-red-500 mt-1">{passwordError}</p>
            )}
          </div>
        )}

        {/* Download button */}
        {success ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-green-100 text-green-700 rounded-lg"
          >
            <Check className="h-5 w-5" />
            Download started!
          </motion.div>
        ) : (
          <Button
            onClick={handleDownload}
            disabled={downloading || (downloadsRemaining !== null && downloadsRemaining <= 0)}
            className="w-full py-6 text-lg"
          >
            {downloading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Downloading...
              </span>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Download File
              </>
            )}
          </Button>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Shared securely via TAAS
        </p>
      </motion.div>
    </div>
  );
}
