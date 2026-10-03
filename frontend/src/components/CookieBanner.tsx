import { useState, useEffect } from 'react';
import { Button } from './ui/button';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('itwield_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('itwield_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-300">
          <p>
            We use essential cookies to make our platform work and analytics cookies to help us improve it. 
            By clicking "Accept", you agree to our use of cookies.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" className="text-slate-900 bg-white hover:bg-slate-100" onClick={acceptCookies}>
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
