import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingCore } from '@/components/landing/LandingCore';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingTrust } from '@/components/landing/LandingTrust';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingFAQ } from '@/components/landing/LandingFAQ';

export function Landing() {
  const location = useLocation();
  
  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const element = document.getElementById(location.hash.substring(1));
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }, 100);
      });
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-white text-[#4B5563] font-sans antialiased selection:bg-[#3B3690]/30">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingCore />
        <LandingFeatures />
        <LandingTrust />
        <LandingPricing />
        <LandingFAQ />
      </main>
      <footer className="bg-slate-50 py-12 border-t border-slate-200 text-center">
        <div className="container mx-auto px-4 text-slate-500 text-sm">
          <div className="flex justify-center space-x-6 mb-4">
            <a href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
          </div>
          <p>&copy; {new Date().getFullYear()} ItWield. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}