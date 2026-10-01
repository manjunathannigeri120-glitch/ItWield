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
    </div>
  );
}