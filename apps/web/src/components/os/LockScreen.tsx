import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Loader2,
  Phone,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Power,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

interface LockScreenProps {
  onUnlock: () => void;
  onGoToRegister: () => void;
}

export function LockScreen({ onUnlock, onGoToRegister }: LockScreenProps) {
  const { login } = useAuthStore();
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [step, setStep] = useState<'credentials' | 'code' | '2fa'>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = currentTime.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Enter your email and password');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.emailLogin(email, password);
      const { token, user, storageChannel } = res.data.data;
      login(user, token, storageChannel);
      setUnlocking(true);
      setTimeout(onUnlock, 800);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError('Enter your phone number');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.sendCode(phoneNumber);
      setSessionId(res.data.data.sessionId);
      setStep('code');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      setError('Enter the verification code');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.verifyCode(sessionId, code, password || undefined);
      if (res.data.data.requires2FA) {
        setStep('2fa');
        return;
      }
      const { token, user } = res.data.data;
      login(user, token);
      setUnlocking(true);
      setTimeout(onUnlock, 800);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'email') {
      handleEmailLogin();
    } else if (step === 'credentials') {
      handleSendCode();
    } else {
      handleVerifyCode();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: unlocking ? 0 : 1 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center select-none overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.1),transparent_50%)]" />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm px-6"
      >
        {/* Time & Date */}
        <div className="text-center mb-4">
          <h1 className="text-7xl font-extralight text-white tracking-tight tabular-nums">
            {timeStr}
          </h1>
          <p className="text-white/60 text-lg font-light mt-2">{dateStr}</p>
        </div>

        {/* User Avatar */}
        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-white/70" />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          {/* Auth Mode Toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-2">
            <button
              type="button"
              onClick={() => {
                setAuthMode('email');
                setStep('credentials');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all ${
                authMode === 'email'
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Mail className="w-4 h-4" /> Email
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('phone');
                setStep('credentials');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all ${
                authMode === 'phone'
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Phone className="w-4 h-4" /> Telegram
            </button>
          </div>

          <AnimatePresence mode="wait">
            {authMode === 'email' ? (
              <motion.div
                key="email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-3"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all"
                  autoFocus
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="phone-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-3"
              >
                {step === 'credentials' && (
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all"
                    autoFocus
                  />
                )}
                {(step === 'code' || step === '2fa') && (
                  <>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder={step === '2fa' ? '2FA Password' : 'Verification Code'}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all"
                      autoFocus
                    />
                    {step === '2fa' && (
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="2FA Password"
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all"
                      />
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/10 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onGoToRegister}
            className="text-white/30 hover:text-white/60 text-xs text-center transition-colors mt-1"
          >
            Don't have an account? Create one
          </button>
        </form>
      </motion.div>

      {/* Bottom Power */}
      <div className="absolute bottom-8 flex items-center gap-2 text-white/20">
        <Power className="w-4 h-4" />
        <span className="text-xs">TAAS OS v2.0</span>
      </div>
    </motion.div>
  );
}
