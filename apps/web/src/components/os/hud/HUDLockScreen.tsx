import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Loader2,
  Phone,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';
import { useHUDSounds } from '@/hooks/useHUDSounds';

interface HUDLockScreenProps {
  onUnlock: () => void;
  onGoToRegister: () => void;
}

export function HUDLockScreen({ onUnlock, onGoToRegister }: HUDLockScreenProps) {
  const { login } = useAuthStore();
  const { play } = useHUDSounds();
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
    hour12: false,
  });
  const dateStr = currentTime.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Enter your email and password');
      play('alert');
      return;
    }
    setIsLoading(true);
    setError('');
    play('click');
    try {
      const res = await authApi.emailLogin(email, password);
      const { token, user, storageChannel } = res.data.data;
      login(user, token, storageChannel);
      play('login');
      setUnlocking(true);
      setTimeout(onUnlock, 800);
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      setError(errMsg);
      play('alert');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError('Enter your phone number');
      play('alert');
      return;
    }
    setIsLoading(true);
    setError('');
    play('click');
    try {
      const res = await authApi.sendCode(phoneNumber);
      setSessionId(res.data.data.sessionId);
      setStep('code');
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to send code';
      setError(errMsg);
      play('alert');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      setError('Enter the verification code');
      play('alert');
      return;
    }
    setIsLoading(true);
    setError('');
    play('click');
    try {
      const res = await authApi.verifyCode(sessionId, code, password || undefined);
      if (res.data.data.requires2FA) {
        setStep('2fa');
        return;
      }
      const { token, user } = res.data.data;
      login(user, token);
      play('login');
      setUnlocking(true);
      setTimeout(onUnlock, 800);
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Verification failed';
      setError(errMsg);
      play('alert');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'email') handleEmailLogin();
    else if (step === 'credentials') handleSendCode();
    else handleVerifyCode();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: unlocking ? 0 : 1 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center select-none overflow-hidden font-mono"
    >
      {/* HUD background */}
      <div className="absolute inset-0 bg-black" />
      {/* Subtle grid — professional look */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,100,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,100,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Corner brackets */}
      <div className="absolute top-6 left-6 w-20 h-20 border-l-2 border-t-2 border-emerald-500/50" />
      <div className="absolute top-6 right-6 w-20 h-20 border-r-2 border-t-2 border-emerald-500/50" />
      <div className="absolute bottom-6 left-6 w-20 h-20 border-l-2 border-b-2 border-emerald-500/50" />
      <div className="absolute bottom-6 right-6 w-20 h-20 border-r-2 border-b-2 border-emerald-500/50" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm px-6"
      >
        {/* Time */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-emerald-400 tracking-[0.2em] tabular-nums">
            {timeStr}
          </h1>
          <p className="text-emerald-500/50 text-sm mt-1">{dateStr}</p>
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-lg border-2 border-emerald-500/60 flex items-center justify-center bg-emerald-500/5">
          <Lock className="w-7 h-7 text-emerald-400" />
        </div>

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="flex border border-emerald-500/20 rounded p-1">
            <button
              type="button"
              onClick={() => { setAuthMode('email'); setStep('credentials'); setError(''); play('click'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs transition-all ${
                authMode === 'email'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-emerald-500/40 hover:text-emerald-400'
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> EMAIL
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('phone'); setStep('credentials'); setError(''); play('click'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs transition-all ${
                authMode === 'phone'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-emerald-500/40 hover:text-emerald-400'
              }`}
            >
              <Phone className="w-3.5 h-3.5" /> TELEGRAM
            </button>
          </div>

          <AnimatePresence mode="wait">
            {authMode === 'email' ? (
              <motion.div
                key="email-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-3"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="EMAIL"
                  className="w-full px-4 py-3 bg-black/60 border border-emerald-500/30 rounded text-emerald-400 placeholder-emerald-500/30 text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 transition-all"
                  autoFocus
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="PASSWORD"
                    className="w-full px-4 py-3 pr-12 bg-black/60 border border-emerald-500/30 rounded text-emerald-400 placeholder-emerald-500/30 text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/40 hover:text-emerald-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="phone-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-3"
              >
                {step === 'credentials' && (
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full px-4 py-3 bg-black/60 border border-emerald-500/30 rounded text-emerald-400 placeholder-emerald-500/30 text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 transition-all"
                    autoFocus
                  />
                )}
                {(step === 'code' || step === '2fa') && (
                  <>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder={step === '2fa' ? '2FA PASSWORD' : 'VERIFICATION CODE'}
                      className="w-full px-4 py-3 bg-black/60 border border-emerald-500/30 rounded text-emerald-400 placeholder-emerald-500/30 text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 transition-all"
                      autoFocus
                    />
                    {step === '2fa' && (
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="2FA PASSWORD"
                        className="w-full px-4 py-3 bg-black/60 border border-emerald-500/30 rounded text-emerald-400 placeholder-emerald-500/30 text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 transition-all"
                      />
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-amber-400 text-xs text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded text-emerald-400 text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                AUTHENTICATE <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => { onGoToRegister(); play('click'); }}
            className="text-emerald-500/40 hover:text-emerald-400 text-xs text-center transition-colors"
          >
            NO CREDENTIALS? REGISTER
          </button>
        </form>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 flex items-center gap-3 text-emerald-500/30 text-xs">
        <Shield className="w-4 h-4" />
        <span>TAAS HUD v2.0 — SECURE ACCESS</span>
      </div>
    </motion.div>
  );
}
