import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Lock, AlertCircle, Check, Crown } from 'lucide-react';
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
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        {/* Subtle ambient lighting */}
        <div className="ambient-glow ambient-glow-1" />
        <div className="ambient-glow ambient-glow-2" />
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-xl bg-foreground flex items-center justify-center shadow-lg shadow-foreground/15"
        >
          <Crown className="w-8 h-8 text-background" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle ambient lighting */}
        <div className="ambient-glow ambient-glow-1" />
        <div className="ambient-glow ambient-glow-2" />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-strong rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative z-10 luxury-border"
        >
          <div className="w-16 h-16 rounded-2xl bg-foreground/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-foreground/60" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Link Unavailable</h1>
          <p className="text-muted-foreground">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-strong rounded-2xl shadow-2xl p-8 max-w-md w-full relative z-10 luxury-border"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center shadow-lg shadow-foreground/15">
              <Crown className="w-6 h-6 text-background" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gradient">TAAS</h1>
              <p className="text-xs text-muted-foreground">Telegram as a Storage</p>
            </div>
          </motion.div>
        </div>

        {/* File info */}
        <div className="glass-subtle rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex items-start gap-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-14 h-14 rounded-xl bg-foreground/10 flex items-center justify-center text-3xl"
            >
              {getFileIcon()}
            </motion.div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground truncate">
                {file?.originalName || file?.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file?.size || 0)}
              </p>
              {downloadsRemaining !== null && (
                <span className="inline-flex items-center gap-1 text-xs text-foreground/70 bg-foreground/10 px-2 py-1 rounded-lg mt-2">
                  <Crown className="w-3 h-3" />
                  {downloadsRemaining} downloads remaining
                </span>
              )}
              {expiresAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expires {new Date(expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Password input */}
        {requiresPassword && (
          <div className="mb-6">
            <Label className="flex items-center gap-2 mb-2 text-sm">
              <Lock className="h-4 w-4 text-foreground/70" />
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
              className={passwordError ? 'border-foreground/50 focus:ring-foreground' : ''}
            />
            {passwordError && (
              <p className="text-sm text-foreground/60 mt-2">{passwordError}</p>
            )}
          </div>
        )}

        {/* Download button */}
        {success ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center gap-2 py-4 px-4 bg-foreground/10 text-foreground rounded-2xl border border-foreground/20"
          >
            <Check className="h-5 w-5" />
            Download started!
          </motion.div>
        ) : (
          <Button
            onClick={handleDownload}
            disabled={downloading || (downloadsRemaining !== null && downloadsRemaining <= 0)}
            className="w-full py-6 text-lg rounded-2xl"
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
        <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1">
          <Crown className="w-3 h-3 text-foreground/70" />
          Shared securely via TAAS
        </p>
      </motion.div>
    </div>
  );
}
