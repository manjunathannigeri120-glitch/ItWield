import React from 'react';
import { ArrowRight, Bot, Target, Zap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingHero() {
  return (
    <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden bg-[#F9F8F6]">
      {/* Subtle grid background similar to agentx */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[#4B5563] text-sm font-medium mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          The Autonomous Business Platform
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-[#111827] tracking-tight mb-8 leading-[1.1]">
          Run your business with an<br className="hidden md:block" />
          <em className="text-[#3B3690] not-italic"> Autonomous AI Workforce</em>
        </h1>
        
        <p className="text-xl text-[#4B5563] mb-12 max-w-3xl mx-auto leading-relaxed">
          ItWield is the enterprise platform that gives you a team of autonomous AI Executives (CEO, COO, CFO). Give them an objective, and they will coordinate workers, execute tasks, and scale your operations 24/7.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/dashboard"
            className="inline-flex items-center justify-center font-bold h-14 bg-[#3B3690] text-white px-8 rounded-full hover:bg-[#2d296e] transition-colors w-full sm:w-auto shadow-lg shadow-[#3B3690]/20"
          >
            Start Free
            <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
          </Link>
          <a 
            href="#how-it-works"
            className="inline-flex items-center justify-center font-bold h-14 bg-white border border-slate-200 text-[#111827] px-8 rounded-full hover:bg-slate-50 transition-colors w-full sm:w-auto shadow-sm"
          >
            See how it works
          </a>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <Target className="w-6 h-6 text-[#3B3690] mb-2" />
            <span className="font-semibold text-[#111827]">Set Objectives</span>
            <span className="text-xs text-[#4B5563] mt-1">AI plans the roadmap</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <Bot className="w-6 h-6 text-[#3B3690] mb-2" />
            <span className="font-semibold text-[#111827]">Delegate Work</span>
            <span className="text-xs text-[#4B5563] mt-1">AI executes the tasks</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <ShieldCheck className="w-6 h-6 text-[#3B3690] mb-2" />
            <span className="font-semibold text-[#111827]">Oversee & Approve</span>
            <span className="text-xs text-[#4B5563] mt-1">You hold the keys</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <Zap className="w-6 h-6 text-[#3B3690] mb-2" />
            <span className="font-semibold text-[#111827]">Scale Infinitely</span>
            <span className="text-xs text-[#4B5563] mt-1">No headcount required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
