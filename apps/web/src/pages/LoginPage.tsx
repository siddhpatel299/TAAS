import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, Loader2, ArrowRight, Send, Sparkles, Shield, Cloud, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

type Step = 'phone' | 'code' | '2fa';

const features = [
  { icon: Cloud, label: 'Unlimited Storage', description: 'No limits, ever' },
  { icon: Shield, label: 'End-to-End Encrypted', description: 'Your data stays private' },
  { icon: Zap, label: 'Lightning Fast', description: 'Powered by Telegram' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

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
    if (!code) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.verifyCode(sessionId, code, password || undefined);
      
      if (response.data.data.requires2FA) {
        setStep('2fa');
        return;
      }

      const { token, user } = response.data.data;
      login(user, token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />

      {/* Left side - Branding with glassmorphism */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between">
        {/* Glass card behind content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-8 glass-strong rounded-3xl"
        />
        
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse-glow">
              <Send className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-gradient">TAAS</span>
          </motion.div>
        </div>
        
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold leading-tight">
              <span className="text-gradient">Unlimited</span>
              <br />
              <span className="text-foreground/90">Cloud Storage</span>
            </h1>
            <p className="text-foreground/70 text-xl mt-4 max-w-md leading-relaxed">
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
                className="glass-subtle rounded-2xl p-4 hover:scale-105 transition-transform duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-violet-600" />
                </div>
                <p className="font-semibold text-sm text-foreground/90">{feature.label}</p>
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

      {/* Right side - Login form with glassmorphism */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Glass card container */}
          <div className="glass-strong rounded-3xl p-8 space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Send className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-gradient">TAAS</span>
            </div>

            <div className="text-center lg:text-left">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-medium text-violet-600">
                    {step === 'phone' && 'Welcome'}
                    {step === 'code' && 'Almost there'}
                    {step === '2fa' && 'One more step'}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-foreground/90">
                  {step === 'phone' && 'Sign in to TAAS'}
                  {step === 'code' && 'Enter code'}
                  {step === '2fa' && 'Two-factor auth'}
                </h2>
                <p className="text-foreground/60 mt-2">
                  {step === 'phone' && 'Use your Telegram account to continue'}
                  {step === 'code' && `We sent a code to ${phoneNumber}`}
                  {step === '2fa' && 'Enter your Telegram 2FA password'}
                </p>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {step === 'phone' && (
                  <motion.div
                    key="phone-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-foreground/70 font-medium">Phone Number</Label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition-opacity" />
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-violet-500 transition-colors" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 234 567 8900"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="pl-12 h-14 rounded-xl bg-white/50 dark:bg-white/5 border-white/30 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-lg"
                          disabled={isLoading}
                        />
                      </div>
                      <p className="text-xs text-foreground/50 ml-1">
                        Enter your phone number with country code
                      </p>
                    </div>
                    <Button
                      className="w-full h-14 rounded-xl text-lg font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02]"
                      onClick={handleSendCode}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}

                {step === 'code' && (
                  <motion.div
                    key="code-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="code" className="text-foreground/70 font-medium">Verification Code</Label>
                      <Input
                        id="code"
                        type="text"
                        placeholder="• • • • • •"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="text-center text-3xl tracking-[0.5em] h-16 rounded-xl bg-white/50 dark:bg-white/5 border-white/30 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-mono"
                        maxLength={6}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-foreground/50 ml-1">
                        Check your Telegram app for the code
                      </p>
                    </div>
                    <Button
                      className="w-full h-14 rounded-xl text-lg font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02]"
                      onClick={handleVerifyCode}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Verify
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full h-12 rounded-xl text-foreground/60 hover:text-foreground hover:bg-white/20"
                      onClick={() => setStep('phone')}
                      disabled={isLoading}
                    >
                      Use different number
                    </Button>
                  </motion.div>
                )}

                {step === '2fa' && (
                  <motion.div
                    key="2fa-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-foreground/70 font-medium">2FA Password</Label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition-opacity" />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-violet-500 transition-colors" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 h-14 rounded-xl bg-white/50 dark:bg-white/5 border-white/30 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-lg"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full h-14 rounded-xl text-lg font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02]"
                      onClick={handleVerifyCode}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-xs text-center text-foreground/40 leading-relaxed">
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
