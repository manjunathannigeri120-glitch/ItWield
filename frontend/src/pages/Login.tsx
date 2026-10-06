import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { LogoIcon } from '@/components/ui/LogoIcon';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // OTP Reset States
  const [isVerifyingReset, setIsVerifyingReset] = useState(false);
  const [otp, setOtp] = useState('');
  
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (import.meta.env.DEV) {
        // Bypass Supabase SMTP in development due to strict free tier limits
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/dev-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to generate dev OTP');
        
        console.log(`[DEV MODE] Your OTP is: ${data.otp}`);
        setSuccess(`[DEV] Verification code generated (check console). It is: ${data.otp}`);
        setIsVerifyingReset(true);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (error) throw error;
        setSuccess('Verification code sent! Please check your email inbox.');
        setIsVerifyingReset(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // 1. Verify the OTP (This securely logs the user in)
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      });
      if (verifyError) throw verifyError;
      
      setSuccess('Code verified! Logging you in...');
    } catch (err: any) {
      setError(err?.message || 'Failed to verify code.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignup) {
        if (import.meta.env.DEV) {
          // Bypass Supabase SMTP for signup in dev mode
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/dev-signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to generate dev signup');
          
          setSuccess('[DEV MODE] Account created and automatically confirmed! You can now log in.');
          setIsSignup(false);
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/dashboard`
            }
          });
          if (error) throw error;
          setSuccess('Account created! Please check your email to verify and log in.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      if (err?.message === 'Email not confirmed') {
        setError('Please check your email inbox and click the verification link before logging in.');
      } else {
        setError(err?.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isVerifyingReset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
        <Card className="w-full max-w-md shadow-lg border-slate-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Enter Verification Code</CardTitle>
            <CardDescription>We sent a 6-digit code to {email}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyReset} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="6-digit code"
                  maxLength={6}
                  minLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  className="text-center text-lg tracking-widest font-mono"
                />
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">{error}</div>}
              {success && <div className="text-sm text-green-700 bg-green-50 p-2.5 rounded-md border border-green-200">{success}</div>}
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? 'Verifying...' : 'Verify & Log In'}
              </Button>
              <div className="text-center text-sm pt-2">
                <button
                  type="button"
                  onClick={() => { setIsVerifyingReset(false); setError(''); setSuccess(''); }}
                  className="text-slate-600 hover:text-slate-900 font-medium underline"
                >
                  Back
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
        <Card className="w-full max-w-md shadow-lg border-slate-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>Enter your email address to receive a recovery code.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">{error}</div>}
              {success && <div className="text-sm text-green-700 bg-green-50 p-2.5 rounded-md border border-green-200">{success}</div>}
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? 'Sending...' : 'Send Recovery Code'}
              </Button>
              <div className="text-center text-sm pt-2">
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setIsVerifyingReset(false); setError(''); setSuccess(''); }}
                  className="text-slate-600 hover:text-slate-900 font-medium underline"
                >
                  Back to Log In
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-md shadow-xl border-slate-200 bg-white">
        <CardHeader className="text-center space-y-1 pb-4">
          <LogoIcon className="w-14 h-14 mx-auto mb-2 drop-shadow-md" />
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">ItWield</CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            {isSignup ? 'Create a new account to start building' : 'Sign in to access your AI Workspace'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Google Single Sign-On Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-300 shadow-sm disabled:opacity-60 text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <!--
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="px-3 bg-white text-slate-400 font-semibold">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">Password</label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setError(''); setSuccess(''); }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 font-medium">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200 font-medium">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Log In'}
            </Button>

            <div className="text-center text-sm pt-2">
              <button
                type="button"
                onClick={() => { setIsSignup(!isSignup); setError(''); setSuccess(''); }}
                className="text-slate-600 hover:text-slate-900 font-medium"
              >
                {isSignup ? (
                  <span>Already have an account? <strong className="text-blue-600 hover:underline">Log In</strong></span>
                ) : (
                  <span>New to ItWield? <strong className="text-blue-600 hover:underline">Create an account</strong></span>
                )}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Legal Footer */}
      <footer className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400 font-medium">
        <Link to="/terms" className="hover:text-slate-600 hover:underline">Terms of Service</Link>
        <span>•</span>
        <Link to="/privacy" className="hover:text-slate-600 hover:underline">Privacy Policy</Link>
        <span>•</span>
        <Link to="/refund" className="hover:text-slate-600 hover:underline">Refund Policy</Link>
      </footer>
    </div>
  );
}
