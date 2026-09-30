import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';


export function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailState = location.state?.email || '';
  const isSignup = location.state?.isSignup || false;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  

  useEffect(() => {
    if (!emailState) {
      navigate('/login');
    }
  }, [emailState, navigate]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    pastedData.forEach((char, i) => {
      if (/^\d$/.test(char) && i < 6) {
        newOtp[i] = char;
      }
    });
    setOtp(newOtp);
    if (pastedData.length > 0) {
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join('');
    if (token.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailState,
        token,
        type: isSignup ? 'signup' : 'email',
      });
      
      if (error) throw error;
      
      // Successfully verified. App component will detect auth state change and route to dashboard.
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailState,
      });
      if (error) throw error;
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to:<br/>
            <strong>{emailState}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-xl"
                />
              ))}
            </div>
            
            {error && <div className="text-sm text-destructive font-medium">{error}</div>}
            
            <Button type="submit" className="w-full" disabled={loading || otp.join('').length !== 6}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-sm text-center text-muted-foreground">
          <div>
            Didn't receive it?{' '}
            <button 
              onClick={handleResend} 
              disabled={resendCooldown > 0 || loading}
              className="text-primary hover:underline disabled:opacity-50 disabled:no-underline font-medium"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>
          <div>
            <button onClick={() => navigate('/login')} className="hover:underline">
              Change email
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
