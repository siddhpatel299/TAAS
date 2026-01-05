import { useState, useEffect } from 'react';
import { Link2, Copy, Check, Trash2, Calendar, Lock, Download, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { shareApi } from '../lib/api';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
  } | null;
}

interface SharedLink {
  id: string;
  token: string;
  url: string;
  expiresAt: string | null;
  hasPassword: boolean;
  maxDownloads: number | null;
  downloadCount: number;
  isActive: boolean;
  createdAt: string;
}

export function ShareDialog({ open, onClose, file }: ShareDialogProps) {
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // New link form
  const [expiresIn, setExpiresIn] = useState<string>('');
  const [password, setPassword] = useState('');
  const [maxDownloads, setMaxDownloads] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (open && file) {
      fetchLinks();
    }
  }, [open, file]);

  const fetchLinks = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const response = await shareApi.getLinks(file.id);
      setLinks(response.data);
    } catch (error) {
      console.error('Failed to fetch links:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLink = async () => {
    if (!file) return;
    setCreating(true);
    try {
      const options: any = {};
      if (expiresIn) options.expiresIn = parseInt(expiresIn);
      if (password) options.password = password;
      if (maxDownloads) options.maxDownloads = parseInt(maxDownloads);

      const response = await shareApi.createLink(file.id, options);
      setLinks([response.data, ...links]);
      
      // Reset form
      setExpiresIn('');
      setPassword('');
      setMaxDownloads('');
      setShowAdvanced(false);

      // Copy to clipboard
      await copyToClipboard(response.data.url, response.data.id);
    } catch (error) {
      console.error('Failed to create link:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      await shareApi.deleteLink(linkId);
      setLinks(links.filter((l) => l.id !== linkId));
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  const toggleLink = async (linkId: string) => {
    try {
      const response = await shareApi.toggleLink(linkId);
      setLinks(links.map((l) => 
        l.id === linkId ? { ...l, isActive: response.data.isActive } : l
      ));
    } catch (error) {
      console.error('Failed to toggle link:', error);
    }
  };

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <span>Share "{file?.name}"</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new link section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button 
                onClick={createLink} 
                disabled={creating}
                className="flex-1"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Creating...
                  </span>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Create Shareable Link
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Options'}
              </Button>
            </div>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 p-4 glass-subtle rounded-2xl border border-white/10">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-violet-400" />
                          Expires in (hours)
                        </Label>
                        <Input
                          type="number"
                          placeholder="Never"
                          value={expiresIn}
                          onChange={(e) => setExpiresIn(e.target.value)}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Download className="h-4 w-4 text-violet-400" />
                          Max downloads
                        </Label>
                        <Input
                          type="number"
                          placeholder="Unlimited"
                          value={maxDownloads}
                          onChange={(e) => setMaxDownloads(e.target.value)}
                          min="1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Lock className="h-4 w-4 text-violet-400" />
                        Password protection
                      </Label>
                      <Input
                        type="password"
                        placeholder="No password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Existing links */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Active Links ({links.length})
            </h3>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500" />
              </div>
            ) : links.length === 0 ? (
              <div className="glass-subtle rounded-2xl p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No shared links yet
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {links.map((link) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 glass-subtle rounded-2xl border transition-all ${
                      link.isActive 
                        ? 'border-white/20' 
                        : 'border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <code className="text-xs bg-white/10 px-3 py-1.5 rounded-lg truncate max-w-[200px] font-mono">
                          {link.url}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-white/10"
                          onClick={() => copyToClipboard(link.url, link.id)}
                        >
                          {copiedId === link.id ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-white/10"
                          onClick={() => toggleLink(link.id)}
                        >
                          {link.isActive ? (
                            <ToggleRight className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-500"
                          onClick={() => deleteLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {link.hasPassword && (
                        <span className="flex items-center gap-1.5 bg-violet-500/10 text-violet-400 px-2 py-1 rounded-lg">
                          <Lock className="h-3 w-3" />
                          Password
                        </span>
                      )}
                      {link.expiresAt && (
                        <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg">
                          <Calendar className="h-3 w-3" />
                          Expires {formatDate(link.expiresAt)}
                        </span>
                      )}
                      {link.maxDownloads && (
                        <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg">
                          <Download className="h-3 w-3" />
                          {link.downloadCount}/{link.maxDownloads}
                        </span>
                      )}
                      <span className="ml-auto">Created {formatDate(link.createdAt)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
