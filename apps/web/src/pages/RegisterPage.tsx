import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, ArrowRight, Send, Shield, Cloud, Zap, Sparkles, Eye, EyeOff, X, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

const features = [
  { icon: Cloud, label: 'Unlimited Storage', desc: 'No limits, ever' },
  { icon: Shield, label: 'End-to-End Encrypted', desc: 'Your data stays private' },
  { icon: Zap, label: 'Lightning Fast', desc: 'Powered by Telegram' },
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];
    return { score, label: labels[score], color: colors[score] };
  }, [password]);

  const handleRegister = async () => {
    if (!email || !password) { setError('Email and password are required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

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
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Decorative blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-sky-200/40 to-blue-300/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-cyan-200/30 to-sky-200/20 blur-3xl pointer-events-none" />

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-8 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-xl shadow-sky-100/50"
        />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <Send className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent tracking-wide">TAAS</span>
          </motion.div>
        </div>

        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Create</span>
              <br />
              <span className="text-gray-800">Your Account</span>
            </h1>
            <p className="text-gray-500 text-xl mt-4 max-w-md leading-relaxed">
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
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-sky-100/60 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-sky-600" />
                </div>
                <p className="font-semibold text-sm text-gray-800">{feature.label}</p>
                <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 text-gray-400 text-sm"
        >
          &copy; 2026 TAAS. All rights reserved.
        </motion.p>
      </div>

      {/* Right side - Registration form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 space-y-6 border border-white/80 shadow-xl shadow-sky-100/40 hover:shadow-2xl hover:shadow-sky-100/50 transition-shadow duration-300">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Send className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">TAAS</span>
            </div>

            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 mb-4">
                <Sparkles className="w-4 h-4 text-sky-500" />
                <span className="text-sm font-medium text-sky-700">Get Started</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
              <p className="text-gray-500 mt-2">Sign up with your email to get started</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError('')} className="p-1 rounded-lg hover:bg-red-100/50 transition-colors" aria-label="Dismiss">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            <div className="space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-12 h-12 rounded-xl bg-gray-50/80 border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 text-gray-900 placeholder:text-gray-400 hover:border-gray-300"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full pl-12 h-12 rounded-xl bg-gray-50/80 border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 text-gray-900 placeholder:text-gray-400 hover:border-gray-300"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 h-12 rounded-xl bg-gray-50/80 border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 text-gray-900 placeholder:text-gray-400 hover:border-gray-300"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors z-10" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 h-12 rounded-xl bg-gray-50/80 border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 text-gray-900 placeholder:text-gray-400 hover:border-gray-300"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50/50 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.label && (
                    <p className="text-xs text-gray-500 ml-1 flex items-center gap-1">
                      Strength: <span className="font-medium">{passwordStrength.label}</span>
                      {password.length >= 6 && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </p>
                  )}
                  {!passwordStrength.label && <p className="text-xs text-gray-400 ml-1">Minimum 6 characters</p>}
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors z-10" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 h-12 rounded-xl bg-gray-50/80 border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 text-gray-900 placeholder:text-gray-400 hover:border-gray-300"
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50/50 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Passwords match
                  </p>
                )}
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-amber-600">Passwords do not match</p>
                )}
              </div>

              {/* Submit */}
              <button
                className="w-full h-14 rounded-xl text-lg font-semibold bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 hover:from-sky-600 hover:to-blue-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 mt-2"
                onClick={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-5 h-5" /></>}
              </button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-gray-500 hover:text-sky-600 transition-colors">
                  Already have an account? <span className="font-semibold text-sky-600">Sign In</span>
                </Link>
              </div>
            </div>

            <p className="text-xs text-center text-gray-400 leading-relaxed">
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
