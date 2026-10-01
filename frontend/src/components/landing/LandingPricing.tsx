import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function LandingPricing() {
  const { user } = useAuth();
  const ctaDest = user ? "/dashboard" : "/login";

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-white font-sans scroll-mt-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-[40px] md:text-[56px] font-extrabold text-[#111827] leading-[1.1] tracking-tight mb-6">
            Simple pricing.<br/>Uncapped automation.
          </h2>
          <p className="text-xl text-[#4B5563] font-medium">
            Start for free. Scale your AI workforce when you're ready.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Free Tier */}
          <div className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-shadow flex flex-col">
            <h3 className="text-2xl font-black text-[#111827] mb-2">Free</h3>
            <p className="text-[#4B5563] mb-6 min-h-[48px]">For exploring AI automation and testing the platform.</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-[56px] font-extrabold text-[#111827] leading-none">$0</span>
            </div>
            <Link to={ctaDest} className="w-full py-4 rounded-full bg-slate-100 text-[#111827] font-bold text-center hover:bg-slate-200 transition-colors mb-8">
              Start Free
            </Link>
            <div className="space-y-4 flex-1">
              <p className="font-bold text-[#111827] text-sm">WHAT'S INCLUDED</p>
              <ul className="space-y-3">
                <li className="flex gap-3 text-[#4B5563] font-medium"><Check className="w-5 h-5 text-[#0057FF] shrink-0" /> 150 Compute Credits</li>
                <li className="flex gap-3 text-[#4B5563] font-medium"><Check className="w-5 h-5 text-[#0057FF] shrink-0" /> CEO Agent Access</li>
                <li className="flex gap-3 text-[#4B5563] font-medium"><Check className="w-5 h-5 text-[#0057FF] shrink-0" /> Basic Memory</li>
              </ul>
            </div>
          </div>

          {/* Pro Tier (Highlighted) */}
          <div className="bg-white rounded-[32px] p-10 border-4 border-[#0057FF] shadow-[0_20px_40px_rgba(0,87,255,0.1)] relative flex flex-col -mt-4 mb-4 lg:mb-0 lg:-mt-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0057FF] text-white font-bold px-6 py-1.5 rounded-full text-sm uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="text-2xl font-black text-[#111827] mb-2">Pro</h3>
            <p className="text-[#4B5563] mb-6 min-h-[48px]">For growing teams with high-volume automation needs.</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-[56px] font-extrabold text-[#111827] leading-none">$199</span>
              <span className="text-lg text-[#4B5563] font-medium">/mo</span>
            </div>
            <Link to={ctaDest} className="w-full py-4 rounded-full bg-[#0057FF] text-white font-bold text-center hover:bg-[#004DE6] hover:-translate-y-1 transition-all shadow-[0_8px_24px_rgba(0,87,255,0.3)] mb-8">
              Upgrade to Pro
            </Link>
            <div className="space-y-4 flex-1">
              <p className="font-bold text-[#111827] text-sm">EVERYTHING IN FREE, PLUS</p>
              <ul className="space-y-3">
                <li className="flex gap-3 text-[#4B5563] font-medium"><Check className="w-5 h-5 text-[#0057FF] shrink-0" /> 10,000 Compute Credits</li>
                <li className="flex gap-3 text-[#4B5563] font-medium"><Check className="w-5 h-5 text-[#0057FF] shrink-0" /> Full Executive Board (COO, CFO)</li>
                <li className="flex gap-3 text-[#4B5563] font-medium"><Check className="w-5 h-5 text-[#0057FF] shrink-0" /> Parallel Workflows</li>
                <li className="flex gap-3 text-[#4B5563] font-medium"><Check className="w-5 h-5 text-[#0057FF] shrink-0" /> Advanced Company Brain</li>
              </ul>
            </div>
          </div>

          {/* Business Tier */}
          <div className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-shadow flex flex-col">
            <h3 className="text-2xl font-black text-[#111827] mb-2">Business</h3>
            <p className="text-[#4B5563] mb-6 min-h-[48px]">For scaling enterprises doing heavy automation.</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-[56px] font-extrabold text-[#111827] leading-none">$299</span>
              <span className="text-lg text-[#4B5563] font-medium">/mo</span>
            </div>
            <Link to={ctaDest} className="w-full py-4 rounded-full bg-slate-100 text-[#111827] font-bold text-center hover:bg-slate-200 transition-colors mb-8">
              Get Business
            </Link>
            <div className="space-y-4 flex-1">
              <p className="font-bold text-[#111827] text-sm">EVERYTHING IN PRO, PLUS</p>
              <ul className="space-y-3">
                <li className="flex gap-3 text-[#4B5563] font-medium"><Check className="w-5 h-5 text-[#0057FF] shrink-0" /> 25,000 Compute Credits</li>
                <li className="flex gap-3 text-[#4B5563] font-medium"><Check className="w-5 h-5 text-[#0057FF] shrink-0" /> Priority Execution</li>
                <li className="flex gap-3 text-[#4B5563] font-medium"><Check className="w-5 h-5 text-[#0057FF] shrink-0" /> White-glove Onboarding</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
