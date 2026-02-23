import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, Loader2, ArrowRight, Send, Shield, Cloud, Zap, Mail, Sparkles, Eye, EyeOff, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

type AuthMode = 'phone' | 'email';
type Step = 'phone' | 'code' | '2fa' | 'email';

const features = [
  { icon: Cloud, label: 'Unlimited Storage', desc: 'No limits, ever' },
  { icon: Shield, label: 'End-to-End Encrypted', desc: 'Your data stays private' },
  { icon: Zap, label: 'Lightning Fast', desc: 'Powered by Telegram' },
];


export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [authMode, setAuthMode] = useState<AuthMode>('phone');
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [show2FAPassword, setShow2FAPassword] = useState(false);

  const handleSendCode = async () => {
    if (!phoneNumber) { setError('Please enter your phone number'); return; }
    setIsLoading(true);
    setError('');
    try {
      const response = await authApi.sendCode(phoneNumber);
      setSessionId(response.data.data.sessionId);
      setStep('code');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) { setError('Please enter the verification code'); return; }
    setIsLoading(true);
    setError('');
    try {
      const response = await authApi.verifyCode(sessionId, code, password || undefined);
      if (response.data.data.requires2FA) { setStep('2fa'); return; }
      const { token, user } = response.data.data;
      login(user, token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !emailPassword) { setError('Please enter email and password'); return; }
    setIsLoading(true);
    setError('');
    try {
      const response = await authApi.emailLogin(email, emailPassword);
      const { token, user, storageChannel } = response.data.data;
      login(user, token, storageChannel);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setStep(mode === 'phone' ? 'phone' : 'email');
    setError('');
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
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Unlimited</span>
              <br />
              <span className="text-gray-800">Cloud Storage</span>
            </h1>
            <p className="text-gray-500 text-xl mt-4 max-w-md leading-relaxed">
              Store any file, any size. No limits, no subscriptions.
              Your Telegram account becomes your personal cloud.
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

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 space-y-8 border border-white/80 shadow-xl shadow-sky-100/40 hover:shadow-2xl hover:shadow-sky-100/50 transition-shadow duration-300">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Send className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">TAAS</span>
            </div>

            <div className="text-center lg:text-left">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 mb-4">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <span className="text-sm font-medium text-sky-700">
                      {(step === 'phone' || step === 'email') && 'Welcome'}
                      {step === 'code' && 'Almost there'}
                      {step === '2fa' && 'One more step'}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {(step === 'phone' || step === 'email') && 'Sign in to TAAS'}
                    {step === 'code' && 'Enter code'}
                    {step === '2fa' && 'Two-factor auth'}
                  </h2>
                  <p className="text-gray-500 mt-2">
                    {step === 'phone' && 'Use your Telegram account to continue'}
                    {step === 'email' && 'Sign in with your email and password'}
                    {step === 'code' && `We sent a code to ${phoneNumber}`}
                    {step === '2fa' && 'Enter your Telegram 2FA password'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button onClick={() => setError('')} className="p-1 rounded-lg hover:bg-red-100/50 transition-colors" aria-label="Dismiss">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step progress dots - phone flow */}
            {authMode === 'phone' && (
              <div className="flex items-center justify-center gap-2">
                {['phone', 'code', '2fa'].map((s) => {
                  const idx = ['phone', 'code', '2fa'].indexOf(step);
                  const active = ['phone', 'code', '2fa'].indexOf(s) <= idx;
                  return (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        active ? 'w-6 bg-gradient-to-r from-sky-500 to-blue-600' : 'w-1.5 bg-gray-200'
                      }`}
                    />
                  );
                })}
              </div>
            )}

            {/* Auth Mode Tabs */}
            {(step === 'phone' || step === 'email') && (
              <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl">
                <button
                  onClick={() => switchAuthMode('phone')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    authMode === 'phone'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  Phone
                </button>
                <button
                  onClick={() => switchAuthMode('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    authMode === 'email'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
              </div>
            )}

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {step === 'phone' && (
                  <motion.div key="phone-form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Phone Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
                        <input
                          type="tel"
                          placeholder="+1 234 567 8900"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full pl-12 h-14 rounded-xl bg-gray-50/80 border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 text-lg text-gray-900 placeholder:text-gray-400 hover:border-gray-300"
                          disabled={isLoading}
                        />
                      </div>
                      <p className="text-xs text-gray-400 ml-1">Enter your phone number with country code</p>
                    </div>
                    <button
                      className="w-full h-14 rounded-xl text-lg font-semibold bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 hover:from-sky-600 hover:to-blue-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                      onClick={handleSendCode}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
                    </button>
                  </motion.div>
                )}

                {step === 'email' && (
                  <motion.div key="email-form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 h-14 rounded-xl bg-gray-50/80 border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 text-lg text-gray-900 placeholder:text-gray-400 hover:border-gray-300"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors z-10" />
                        <input
                          type={showEmailPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          className="w-full pl-12 pr-12 h-14 rounded-xl bg-gray-50/80 border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 text-lg text-gray-900 placeholder:text-gray-400 hover:border-gray-300"
                          disabled={isLoading}
                          onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmailPassword(!showEmailPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50/50 transition-colors"
                          tabIndex={-1}
                        >
                          {showEmailPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <button
                      className="w-full h-14 rounded-xl text-lg font-semibold bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 hover:from-sky-600 hover:to-blue-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                      onClick={handleEmailLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                    </button>
                    <div className="text-center">
                      <Link to="/register" className="text-sm text-gray-500 hover:text-sky-600 transition-colors">
                        Don't have an account? <span className="font-semibold text-sky-600">Register</span>
                      </Link>
                    </div>
                  </motion.div>
                )}

                {step === 'code' && (
                  <motion.div key="code-form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Verification Code</label>
                      <input
                        type="text"
                        placeholder="------"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full text-center text-3xl tracking-[0.5em] h-16 rounded-xl bg-gray-50/80 border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 font-mono text-gray-900 placeholder:text-gray-300 hover:border-gray-300"
                        maxLength={6}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-gray-400 ml-1">Check your Telegram app for the code</p>
                    </div>
                    <button
                      className="w-full h-14 rounded-xl text-lg font-semibold bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 hover:from-sky-600 hover:to-blue-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                      onClick={handleVerifyCode}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify <ArrowRight className="w-5 h-5" /></>}
                    </button>
                    <button
                      className="w-full h-12 rounded-xl text-gray-500 hover:text-sky-600 hover:bg-sky-50/50 active:bg-sky-50 transition-colors"
                      onClick={() => setStep('phone')}
                      disabled={isLoading}
                    >
                      Use different number
                    </button>
                  </motion.div>
                )}

                {step === '2fa' && (
                  <motion.div key="2fa-form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">2FA Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors z-10" />
                        <input
                          type={show2FAPassword ? 'text' : 'password'}
                          placeholder="Enter your 2FA password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-12 h-14 rounded-xl bg-gray-50/80 border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 text-lg text-gray-900 placeholder:text-gray-400 hover:border-gray-300"
                          disabled={isLoading}
                          onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                        />
                        <button
                          type="button"
                          onClick={() => setShow2FAPassword(!show2FAPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50/50 transition-colors"
                          tabIndex={-1}
                        >
                          {show2FAPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <button
                      className="w-full h-14 rounded-xl text-lg font-semibold bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 hover:from-sky-600 hover:to-blue-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                      onClick={handleVerifyCode}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-xs text-center text-gray-400 leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy.
              <br />
              Your files are stored in your private Telegram channel.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
