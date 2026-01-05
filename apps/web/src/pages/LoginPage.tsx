import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, Loader2, ArrowRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

type Step = 'phone' | 'code' | '2fa';

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
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-2xl font-bold">TAAS</span>
          </div>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Unlimited Cloud Storage,
            <br />
            Powered by Telegram
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Store any file, any size. No limits, no subscriptions. 
            Your Telegram account becomes your personal cloud.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                ∞
              </div>
              <span>Unlimited Storage</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                🔒
              </div>
              <span>End-to-End Encrypted</span>
            </div>
          </div>
        </div>

        <p className="text-white/60 text-sm">
          © 2026 TAAS. All rights reserved.
        </p>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">TAAS</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold">
              {step === 'phone' && 'Welcome to TAAS'}
              {step === 'code' && 'Enter verification code'}
              {step === '2fa' && 'Two-factor authentication'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {step === 'phone' && 'Sign in with your Telegram account'}
              {step === 'code' && `We sent a code to ${phoneNumber}`}
              {step === '2fa' && 'Enter your Telegram 2FA password'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            {step === 'phone' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your phone number with country code
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSendCode}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </>
            )}

            {step === 'code' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="12345"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Check your Telegram app for the code
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={handleVerifyCode}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Verify
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep('phone')}
                  disabled={isLoading}
                >
                  Use different number
                </Button>
              </>
            )}

            {step === '2fa' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">2FA Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleVerifyCode}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Your files are stored in your private Telegram channel.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
