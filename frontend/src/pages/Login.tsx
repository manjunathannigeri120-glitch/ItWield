import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

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
        setSuccess('Verification code sent! Please check your email.');
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
          setIsSignup(false); // Switch back to sign in
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin
            }
          });
          if (error) throw error;
          setSuccess('Account created! Please check your email.');
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
        setError('Please check your email.');
      } else {
        setError(err?.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isVerifyingReset) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Enter Verification Code</CardTitle>
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
                />
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
              {success && <div className="text-sm text-green-600 font-medium">{success}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Log In'}
              </Button>
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => { setIsVerifyingReset(false); setError(''); setSuccess(''); }}
                  className="text-primary hover:underline"
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
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>Enter your email to receive a reset code.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
              {success && <div className="text-sm text-green-600 font-medium">{success}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Verification Code'}
              </Button>
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setIsVerifyingReset(false); setError(''); setSuccess(''); }}
                  className="text-primary hover:underline"
                >
                  Back to login
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>ItWield</CardTitle>
          <CardDescription>
            {isSignup ? 'Create a new account' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            {success && <div className="text-sm text-green-600 font-medium">{success}</div>}
            
            {!isSignup && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setError(''); setSuccess(''); }}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isSignup ? 'Sign Up' : 'Sign In'}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => { setIsSignup(!isSignup); setError(''); setSuccess(''); }}
                className="text-primary hover:underline"
              >
                {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
