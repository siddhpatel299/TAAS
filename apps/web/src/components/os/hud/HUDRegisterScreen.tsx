import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';
import { useHUDSounds } from '@/hooks/useHUDSounds';

interface HUDRegisterScreenProps {
  onRegistered: () => void;
  onGoToLogin: () => void;
}

export function HUDRegisterScreen({ onRegistered, onGoToLogin }: HUDRegisterScreenProps) {
  const { login } = useAuthStore();
  const { play } = useHUDSounds();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const labels = ['', 'WEAK', 'FAIR', 'GOOD', 'STRONG', 'EXCELLENT'];
    return { score, label: labels[score] };
  }, [password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('EMAIL AND PASSWORD REQUIRED');
      play('alert');
      return;
    }
    if (password.length < 6) {
      setError('PASSWORD MUST BE AT LEAST 6 CHARACTERS');
      play('alert');
      return;
    }
    if (password !== confirmPassword) {
      setError('PASSWORDS DO NOT MATCH');
      play('alert');
      return;
    }

    setIsLoading(true);
    setError('');
    play('click');
    try {
      const response = await authApi.register({
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
      const { token, user } = response.data.data;
      login(user, token);
      play('login');
      onRegistered();
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'REGISTRATION FAILED';
      setError(errMsg);
      play('alert');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-black/60 border border-emerald-500/30 rounded text-emerald-400 text-[12px] placeholder-emerald-500/30 focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 transition-all font-mono';

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center select-none overflow-hidden font-mono">
      <div className="absolute inset-0 bg-black" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,100,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,100,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute top-6 left-6 w-16 h-16 border-l-2 border-t-2 border-emerald-500/40" />
      <div className="absolute top-6 right-6 w-16 h-16 border-r-2 border-t-2 border-emerald-500/40" />
      <div className="absolute bottom-6 left-6 w-16 h-16 border-l-2 border-b-2 border-emerald-500/40" />
      <div className="absolute bottom-6 right-6 w-16 h-16 border-r-2 border-b-2 border-emerald-500/40" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded border-2 border-emerald-500/60 flex items-center justify-center bg-emerald-500/10">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-lg font-bold text-emerald-400 tracking-widest">
            TAAS <span className="text-amber-400/80">HUD</span>
          </span>
        </div>

        <div className="bg-black/60 border border-emerald-500/30 rounded p-6">
          <div className="text-center mb-5">
            <h2 className="text-sm font-bold text-emerald-400 tracking-widest">CREATE CREDENTIALS</h2>
            <p className="text-[11px] text-emerald-500/50 mt-1">REGISTER FOR DEFENSE INTERFACE</p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500/40" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="FIRST NAME"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="LAST NAME"
                className={inputClass}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL"
                className={`${inputClass} pl-9`}
                autoFocus
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PASSWORD"
                className={`${inputClass} pl-9 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/40 hover:text-emerald-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password && (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= passwordStrength.score
                          ? 'bg-emerald-500'
                          : 'bg-emerald-500/20'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-emerald-500/50">{passwordStrength.label}</span>
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500/40" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="CONFIRM PASSWORD"
                className={`${inputClass} pl-9`}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-amber-400 text-[11px] text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 mt-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded text-emerald-400 text-[12px] font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  REGISTER <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { onGoToLogin(); play('click'); }}
              className="inline-flex items-center gap-1.5 text-emerald-500/40 hover:text-emerald-400 text-[11px] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              EXISTING CREDENTIALS? AUTHENTICATE
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
