import React from 'react';
import { ArrowRight, MessageCircle, Zap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingHero() {
  return (
    <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden bg-white font-sans">
      
      {/* Manychat style background blobs/gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#F4F7FF] to-transparent rounded-full blur-3xl opacity-70 pointer-events-none"></div>

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Floating Badges (Manychat style motion) */}
        <div className="hidden lg:flex absolute top-20 left-10 items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 animate-bounce" style={{ animationDuration: '3s' }}>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800 text-sm">Executes 24/7</span>
        </div>

        <div className="hidden lg:flex absolute top-40 right-10 items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800 text-sm">100% Autonomous</span>
        </div>

        <h1 className="text-[56px] md:text-[80px] font-extrabold text-[#111827] tracking-tight mb-8 leading-[1.05] max-w-5xl mx-auto">
          Automate your business.<br className="hidden md:block" />
          Drive more <span className="text-[#0057FF]">revenue</span>.
        </h1>
        
        <p className="text-xl md:text-2xl text-[#4B5563] mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
          ItWield is the enterprise platform that gives you a team of autonomous AI Executives. Engage leads, automate workflows, and scale operations on autopilot.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link 
            to="/dashboard"
            className="inline-flex items-center justify-center font-bold text-lg h-16 bg-[#0057FF] text-white px-10 rounded-full hover:bg-[#004DE6] hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto shadow-[0_8px_24px_rgba(0,87,255,0.3)]"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <a 
            href="#how-it-works"
            className="inline-flex items-center justify-center font-bold text-lg h-16 bg-white border-2 border-slate-200 text-[#111827] px-10 rounded-full hover:border-[#0057FF] hover:text-[#0057FF] hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto shadow-sm"
          >
            See how it works
          </a>
        </div>

        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">Trusted by scaling companies</p>
        
        {/* Placeholder for logos, manychat style fading row */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="text-2xl font-black text-slate-800 tracking-tighter">STARTUP<span className="text-blue-600">.</span></div>
          <div className="text-2xl font-black text-slate-800 tracking-tighter">TECHCO<span className="text-blue-600">.</span></div>
          <div className="text-2xl font-black text-slate-800 tracking-tighter">AGENCY<span className="text-blue-600">.</span></div>
          <div className="text-2xl font-black text-slate-800 tracking-tighter">FOUNDERS<span className="text-blue-600">.</span></div>
        </div>

      </div>
    </div>
  );
}
