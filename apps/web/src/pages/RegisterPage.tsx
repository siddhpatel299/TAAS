import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, ArrowRight, Send, Crown, Shield, Cloud, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

const features = [
    { icon: Cloud, label: 'Unlimited Storage', description: 'No limits, ever' },
    { icon: Shield, label: 'End-to-End Encrypted', description: 'Your data stays private' },
    { icon: Zap, label: 'Lightning Fast', description: 'Powered by Telegram' },
];

export function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
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

        try {
            const response = await authApi.register({
                email,
                password,
                firstName: firstName || undefined,
                lastName: lastName || undefined,
            });
            const { token, user } = response.data.data;
            login(user, token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden">
            {/* Subtle ambient lighting */}
            <div className="ambient-glow ambient-glow-1" />
            <div className="ambient-glow ambient-glow-2" />

            {/* Left side - Branding with glassmorphism */}
            <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between">
                {/* Glass card behind content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-8 glass-strong rounded-2xl luxury-border"
                />

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-14 h-14 rounded-xl bg-foreground flex items-center justify-center shadow-lg">
                            <Send className="w-7 h-7 text-background" />
                        </div>
                        <span className="text-3xl font-bold text-gradient tracking-wide">TAAS</span>
                    </motion.div>
                </div>

                <div className="relative z-10 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        <h1 className="text-5xl font-bold leading-tight">
                            <span className="text-gradient">Create</span>
                            <br />
                            <span className="text-foreground/90">Your Account</span>
                        </h1>
                        <p className="text-foreground/70 text-xl mt-4 max-w-md leading-relaxed">
                            Join TAAS and get unlimited cloud storage.
                            Your files, your way.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="grid grid-cols-3 gap-4"
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.label}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                                className="glass-subtle rounded-xl p-4 hover:scale-[1.02] transition-all duration-300 hover:border-foreground/10"
                            >
                                <div className="w-10 h-10 rounded-lg bg-foreground/5 dark:bg-white/10 flex items-center justify-center mb-3">
                                    <feature.icon className="w-5 h-5 text-foreground/70" />
                                </div>
                                <p className="font-semibold text-sm text-foreground/90 text-luxury">{feature.label}</p>
                                <p className="text-xs text-foreground/60 mt-1">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="relative z-10 text-foreground/40 text-sm"
                >
                    © 2026 TAAS. All rights reserved.
                </motion.p>
            </div>

            {/* Right side - Registration form with glassmorphism */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-md"
                >
                    {/* Glass card container */}
                    <div className="glass-strong rounded-2xl p-8 space-y-6 luxury-border">
                        {/* Mobile logo */}
                        <div className="lg:hidden flex items-center justify-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-foreground flex items-center justify-center shadow-lg">
                                <Send className="w-7 h-7 text-background" />
                            </div>
                            <span className="text-3xl font-bold text-gradient tracking-wide">TAAS</span>
                        </div>

                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 dark:bg-white/10 border border-foreground/10 dark:border-white/10 mb-4">
                                <Crown className="w-4 h-4 text-foreground/70" />
                                <span className="text-sm font-medium text-foreground/80">
                                    Get Started
                                </span>
                            </div>
                            <h2 className="text-3xl font-bold text-foreground/90">
                                Create Account
                            </h2>
                            <p className="text-foreground/60 mt-2">
                                Sign up with your email to get started
                            </p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-center gap-2"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-foreground/70 font-medium text-luxury">First Name</Label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-foreground transition-colors" />
                                        <Input
                                            id="firstName"
                                            type="text"
                                            placeholder="John"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="pl-12 h-12 rounded-xl bg-white/50 dark:bg-white/5 border-foreground/10 focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 transition-all"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-foreground/70 font-medium text-luxury">Last Name</Label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-foreground transition-colors" />
                                        <Input
                                            id="lastName"
                                            type="text"
                                            placeholder="Doe"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="pl-12 h-12 rounded-xl bg-white/50 dark:bg-white/5 border-foreground/10 focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 transition-all"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-foreground/70 font-medium text-luxury">Email</Label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-foreground/5 dark:bg-white/5 rounded-xl blur opacity-0 group-focus-within:opacity-50 transition-opacity" />
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-foreground transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-12 h-12 rounded-xl bg-white/50 dark:bg-white/5 border-foreground/10 focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 transition-all"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-foreground/70 font-medium text-luxury">Password</Label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-foreground/5 dark:bg-white/5 rounded-xl blur opacity-0 group-focus-within:opacity-50 transition-opacity" />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-foreground transition-colors" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-12 h-12 rounded-xl bg-white/50 dark:bg-white/5 border-foreground/10 focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 transition-all"
                                        disabled={isLoading}
                                    />
                                </div>
                                <p className="text-xs text-foreground/50 ml-1">Minimum 6 characters</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-foreground/70 font-medium text-luxury">Confirm Password</Label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-foreground/5 dark:bg-white/5 rounded-xl blur opacity-0 group-focus-within:opacity-50 transition-opacity" />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-foreground transition-colors" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-12 h-12 rounded-xl bg-white/50 dark:bg-white/5 border-foreground/10 focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 transition-all"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <Button
                                className="w-full h-14 rounded-xl text-lg font-semibold btn-luxury mt-2"
                                onClick={handleRegister}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </>
                                )}
                            </Button>

                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                                >
                                    Already have an account? <span className="font-medium">Sign In</span>
                                </Link>
                            </div>
                        </div>

                        <p className="text-xs text-center text-foreground/40 leading-relaxed">
                            By creating an account, you agree to our Terms of Service and Privacy Policy.
                            <br />
                            You'll need to link a Telegram account to use storage features.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
