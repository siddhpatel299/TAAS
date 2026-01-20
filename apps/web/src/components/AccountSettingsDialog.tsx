import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Check, X, User, Phone, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';
import { useVersion } from '@/contexts/VersionContext';

interface AccountSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AccountSettingsDialog({ open, onOpenChange }: AccountSettingsDialogProps) {
    const { user, setUser } = useAuthStore();
    const { version, setVersion } = useVersion();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const hasEmail = !!user?.email;
    const hasTelegram = !!user?.telegramId;

    const themes = [
        { id: 'standard', name: 'Standard', description: 'Clean light theme', color: 'bg-sky-500' },
        { id: 'hud', name: 'HUD', description: 'Sci-fi neon theme', color: 'bg-cyan-500' },
        { id: 'forest', name: 'Forest', description: 'Organic nature theme', color: 'bg-green-600' },
        { id: 'terminal', name: 'Terminal', description: 'Bloomberg monochrome', color: 'bg-neutral-800' },
        { id: 'origami', name: 'Origami', description: 'Paper-fold minimalism', color: 'bg-amber-100' },
        { id: 'blueprint', name: 'Blueprint', description: 'Technical drawing', color: 'bg-blue-900' },
        { id: 'newsprint', name: 'Newsprint', description: 'Editorial newspaper', color: 'bg-stone-200' },
        { id: 'brutalist', name: 'Brutalist', description: 'Neo-brutalism bold', color: 'bg-yellow-400' },
        { id: 'crt', name: 'CRT', description: 'Retro terminal', color: 'bg-green-900' },
        { id: 'glass', name: 'Glass', description: 'Frosted glass', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    ] as const;

    const handleAddEmail = async () => {
        if (!email || !password) {
            setError('Email and password are required');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await authApi.addEmail(email, password);
            setUser(response.data.data.user);
            setSuccess('Email and password added! You can now login with email.');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add email');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Account Settings
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Theme Selector */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Theme
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {themes.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => setVersion(theme.id)}
                                    className={`p-3 rounded-xl border-2 transition-all text-left ${version === theme.id
                                        ? 'border-sky-500 bg-sky-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-lg ${theme.color} mb-2`} />
                                    <p className="text-sm font-medium">{theme.name}</p>
                                    <p className="text-xs text-gray-500">{theme.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Account Status */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700">Login Methods</h3>
                        <div className="space-y-2">
                            {/* Telegram Status */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasTelegram ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Telegram/Phone</p>
                                        <p className="text-xs text-gray-500">
                                            {hasTelegram ? 'Connected' : 'Not connected'}
                                        </p>
                                    </div>
                                </div>
                                {hasTelegram ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                ) : (
                                    <X className="w-5 h-5 text-gray-300" />
                                )}
                            </div>

                            {/* Email Status */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasEmail ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Email & Password</p>
                                        <p className="text-xs text-gray-500">
                                            {hasEmail ? user?.email : 'Not set up'}
                                        </p>
                                    </div>
                                </div>
                                {hasEmail ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                ) : (
                                    <X className="w-5 h-5 text-gray-300" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Add Email Form - Only show if no email yet */}
                    {!hasEmail && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-4 border-t pt-4"
                        >
                            <h3 className="text-sm font-medium text-gray-700">Add Email Login</h3>
                            <p className="text-xs text-gray-500">
                                Add an email and password to your account so you can login without OTP.
                            </p>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">
                                    {success}
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="settings-email" className="text-sm">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="settings-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="settings-password" className="text-sm">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="settings-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">Minimum 6 characters</p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="settings-confirm" className="text-sm">Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="settings-confirm"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleAddEmail}
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4 mr-2" />
                                            Add Email Login
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {hasEmail && (
                        <div className="border-t pt-4">
                            <p className="text-sm text-gray-600">
                                ✅ You can now login with your email (<span className="font-medium">{user?.email}</span>) instead of using Telegram OTP.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
