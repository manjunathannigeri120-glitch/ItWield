import React from 'react';
import { ArrowRight, Bot, Target, Zap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingHero() {
  return (
    <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden bg-[#F4F7FF]">
      {/* Subtle grid background similar to agentx */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-100 text-[#4B5563] text-sm font-medium mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          The Autonomous Business Platform
        </div>
        
        <h1 className="text-[56px] md:text-[80px] font-extrabold tracking-tight text-[#111827] tracking-tight mb-8 leading-[1.1]">
          Run your business with an<br className="hidden md:block" />
          <em className="text-[#0057FF] not-italic"> Autonomous AI Workforce</em>
        </h1>
        
        <p className="text-xl text-[#4B5563] mb-12 max-w-3xl mx-auto leading-relaxed">
          ItWield is the enterprise platform that gives you a team of autonomous AI Executives (CEO, COO, CFO). Give them an objective, and they will coordinate workers, execute tasks, and scale your operations 24/7.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/dashboard"
            className="inline-flex items-center justify-center font-bold h-14 bg-[#0057FF] text-white px-8 rounded-full hover:bg-[#004DE6] hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_24px_rgba(0,87,255,0.3)] transition-colors w-full sm:w-auto shadow-lg shadow-[#0057FF]/30"
          >
            Start Free
            <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
          </Link>
          <a 
            href="#how-it-works"
            className="inline-flex items-center justify-center font-bold h-14 bg-white border border-slate-100 text-[#111827] px-8 rounded-full hover:bg-slate-50 transition-colors w-full sm:w-auto shadow-sm"
          >
            See how it works
          </a>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <Target className="w-6 h-6 text-[#0057FF] mb-2" />
            <span className="font-semibold text-[#111827]">Set Objectives</span>
            <span className="text-xs text-[#4B5563] mt-1">AI plans the roadmap</span>
          </div>
          <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <Bot className="w-6 h-6 text-[#0057FF] mb-2" />
            <span className="font-semibold text-[#111827]">Delegate Work</span>
            <span className="text-xs text-[#4B5563] mt-1">AI executes the tasks</span>
          </div>
          <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <ShieldCheck className="w-6 h-6 text-[#0057FF] mb-2" />
            <span className="font-semibold text-[#111827]">Oversee & Approve</span>
            <span className="text-xs text-[#4B5563] mt-1">You hold the keys</span>
          </div>
          <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <Zap className="w-6 h-6 text-[#0057FF] mb-2" />
            <span className="font-semibold text-[#111827]">Scale Infinitely</span>
            <span className="text-xs text-[#4B5563] mt-1">No headcount required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
