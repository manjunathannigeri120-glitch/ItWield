import { useState } from 'react';
import { ArrowRight, Target, Database, CheckSquare, Zap, Briefcase, Settings, TrendingUp, Terminal, PieChart, Check, ChevronLeft, ChevronRight, RefreshCw, Activity } from 'lucide-react';

export function LandingCore() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <>
      {/* THE PROBLEM WITH TODAY'S AI */}
      <section className="py-24 px-6 bg-[#F4F7FF]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-tight text-[#111827] mb-4 tracking-tight">AI can answer questions.</h2>
            <p className="text-xl text-[#4B5563]">But your business needs something more.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Chatbot */}
            <div className="bg-white shadow-sm border border-slate-100 p-8 rounded-[32px] opacity-60">
              <h3 className="text-xl font-bold text-[#374151] mb-6 border-b border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] pb-4">CHATBOT</h3>
              <div className="space-y-4 text-center text-sm font-bold tracking-widest text-[#4B5563]">
                <div className="bg-white shadow-sm border border-slate-100 p-4 rounded-xl">Ask</div>
                <ArrowRight className="w-5 h-5 mx-auto rotate-90 opacity-50" />
                <div className="bg-white shadow-sm border border-slate-100 p-4 rounded-xl">Answer</div>
              </div>
            </div>
            
            {/* Automation */}
            <div className="bg-white shadow-sm border border-slate-100 p-8 rounded-[32px] opacity-60">
              <h3 className="text-xl font-bold text-[#374151] mb-6 border-b border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] pb-4">AUTOMATION</h3>
              <div className="space-y-4 text-center text-sm font-bold tracking-widest text-[#4B5563]">
                <div className="bg-white shadow-sm border border-slate-100 p-4 rounded-xl">Trigger</div>
                <ArrowRight className="w-5 h-5 mx-auto rotate-90 opacity-50" />
                <div className="bg-white shadow-sm border border-slate-100 p-4 rounded-xl">Action</div>
              </div>
            </div>
            
            {/* ItWield */}
            <div className="bg-indigo-900/10 border border-indigo-500/30 p-8 rounded-[32px] shadow-xl shadow-indigo-900/20 relative">
              <h3 className="text-xl font-bold text-[#111827] mb-6 border-b border-indigo-500/30 pb-4">ITWIELD</h3>
              <div className="space-y-2 text-center text-xs font-bold tracking-widest text-[#111827]">
                <div className="bg-indigo-600/20 border border-indigo-500/30 p-2.5 rounded-lg text-[#111827]">Objective</div>
                <ArrowRight className="w-4 h-4 mx-auto rotate-90 opacity-50 text-[#0057FF]" />
                <div className="bg-indigo-600/10 border border-indigo-500/20 p-2.5 rounded-lg">Understand</div>
                <ArrowRight className="w-4 h-4 mx-auto rotate-90 opacity-50 text-[#0057FF]" />
                <div className="bg-indigo-600/10 border border-indigo-500/20 p-2.5 rounded-lg">Decide</div>
                <ArrowRight className="w-4 h-4 mx-auto rotate-90 opacity-50 text-[#0057FF]" />
                <div className="bg-indigo-600/10 border border-indigo-500/20 p-2.5 rounded-lg">Delegate</div>
                <ArrowRight className="w-4 h-4 mx-auto rotate-90 opacity-50 text-[#0057FF]" />
                <div className="bg-indigo-600/10 border border-indigo-500/20 p-2.5 rounded-lg">Execute</div>
                <ArrowRight className="w-4 h-4 mx-auto rotate-90 opacity-50 text-[#0057FF]" />
                <div className="bg-indigo-600/20 border border-indigo-500/30 p-2.5 rounded-lg text-emerald-700">Verify</div>
                <ArrowRight className="w-4 h-4 mx-auto rotate-90 opacity-50 text-[#0057FF]" />
                <div className="bg-indigo-600/10 border border-indigo-500/20 p-2.5 rounded-lg">Learn</div>
                <ArrowRight className="w-4 h-4 mx-auto rotate-90 opacity-50 text-[#0057FF]" />
                <div className="bg-indigo-600/10 border border-indigo-500/20 p-2.5 rounded-lg">Replan</div>
                <ArrowRight className="w-4 h-4 mx-auto rotate-90 opacity-50 text-[#0057FF]" />
                <div className="bg-[#0057FF] border border-[#004DE6] p-2.5 rounded-lg text-white font-bold shadow-lg">Operate</div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-[#4B5563] italic">"Your business doesn't need another dashboard. It needs an AI company that can operate."</p>
          </div>
        </div>
      </section>

      {/* FOUNDER OBJECTIVE EXPERIENCE */}
      <section className="py-24 bg-[#F4F7FF] border-y border-slate-100 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-tight text-[#111827] tracking-tight">Give your AI company an objective.</h2>
          </div>

          <div className="flex flex-col items-center max-w-xl mx-auto">
            {/* Founder */}
            <div className="bg-white shadow-sm border border-slate-100 p-6 rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full text-center shadow-lg">
              <h3 className="text-xs font-bold text-[#4B5563] uppercase tracking-widest mb-2">FOUNDER</h3>
              <p className="text-2xl font-medium text-[#111827]">"Get me 20 new customers."</p>
            </div>
            
            <ArrowRight className="w-6 h-6 text-[#4B5563] my-4 rotate-90" />
            
            {/* Understand */}
            <div className="bg-[#F4F7FF] p-4 rounded-xl border border-slate-100 w-full text-center">
              <h3 className="text-xs font-bold text-[#0057FF] uppercase tracking-widest mb-1">UNDERSTAND</h3>
              <p className="text-sm text-[#4B5563]">Company Brain retrieves context.</p>
            </div>

            <ArrowRight className="w-6 h-6 text-[#4B5563] my-4 rotate-90" />

            {/* CEO */}
            <div className="bg-white shadow-sm p-4 rounded-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full text-center">
              <h3 className="text-xs font-bold text-[#374151] uppercase tracking-widest mb-1">CEO</h3>
              <p className="text-sm text-[#4B5563]">Sets strategic priority.</p>
            </div>

            <ArrowRight className="w-6 h-6 text-[#4B5563] my-4 rotate-90" />

            {/* COO */}
            <div className="bg-white shadow-sm p-4 rounded-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full text-center">
              <h3 className="text-xs font-bold text-[#374151] uppercase tracking-widest mb-1">COO</h3>
              <p className="text-sm text-[#4B5563]">Coordinates execution.</p>
            </div>

            <ArrowRight className="w-6 h-6 text-[#4B5563] my-4 rotate-90" />

            {/* CMO */}
            <div className="bg-white shadow-sm p-4 rounded-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full text-center">
              <h3 className="text-xs font-bold text-[#374151] uppercase tracking-widest mb-1">CMO</h3>
              <p className="text-sm text-[#4B5563]">Owns customer acquisition.</p>
            </div>

            <ArrowRight className="w-6 h-6 text-[#4B5563] my-4 rotate-90" />

            {/* AI Workers */}
            <div className="bg-white shadow-sm border border-slate-100 p-4 rounded-xl border border-dashed border-slate-600 w-full text-center">
              <h3 className="text-xs font-bold text-[#4B5563] uppercase tracking-widest mb-1">AI WORKERS</h3>
              <p className="text-sm text-[#4B5563]">Execute authorized tasks.</p>
            </div>

            <ArrowRight className="w-6 h-6 text-[#4B5563] my-4 rotate-90" />

            {/* Verify */}
            <div className="bg-emerald-100 p-4 rounded-xl border border-emerald-200 w-full text-center">
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">VERIFY</h3>
              <p className="text-sm text-[#4B5563]">Business data confirms results.</p>
            </div>

            <ArrowRight className="w-6 h-6 text-[#4B5563] my-4 rotate-90" />

            {/* Replan */}
            <div className="bg-[#F4F7FF] p-4 rounded-xl border border-slate-100 w-full text-center">
              <h3 className="text-xs font-bold text-[#0057FF] uppercase tracking-widest mb-1">REPLAN</h3>
              <p className="text-sm text-[#4B5563]">Determine what should happen next.</p>
            </div>

          </div>
        </div>
      </section>

      {/* HOW ITWIELD WORKS - INTERACTIVE 6-STEP PANEL (DARK MODE) */}
      <section id="how-it-works" className="scroll-mt-24 py-24 bg-[#F4F7FF] px-6">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center mb-16">
            <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-tight text-[#111827] mb-6 tracking-tight">How ItWield Runs Your Business</h2>
            <p className="text-xl text-[#4B5563] max-w-3xl mx-auto">
              Give your AI company an outcome.<br/>ItWield plans the work, coordinates your AI executives and workers, executes authorized actions, verifies the result, and keeps operating.
            </p>
          </div>

          {/* Top Tabs */}
          <div className="flex items-center justify-between bg-white shadow-sm rounded-full p-2 mb-12 shadow-sm border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex items-center space-x-1 min-w-max px-2">
              {['Command', 'Understand', 'Plan', 'Execute', 'Verify', 'Operate'].map((step, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`flex items-center px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    activeStep === idx 
                      ? 'bg-indigo-600 text-[#111827]' 
                      : activeStep > idx 
                        ? 'text-[#0057FF] hover:bg-white shadow-sm border border-slate-100' 
                        : 'text-[#4B5563] hover:bg-white shadow-sm border border-slate-100'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] mr-2 ${
                    activeStep === idx ? 'bg-white/20' : activeStep > idx ? 'bg-indigo-600/20 text-[#0057FF]' : 'bg-white shadow-sm border border-slate-100 text-[#4B5563]'
                  }`}>
                    {activeStep > idx ? <Check className="w-3 h-3" /> : (idx + 1)}
                  </span>
                  {step}
                </button>
              ))}
            </div>
            
            <div className="hidden md:flex items-center space-x-2 px-4 border-l border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ml-4">
              <button onClick={() => setActiveStep(Math.max(0, activeStep - 1))} className="p-2 text-[#4B5563] hover:text-[#0057FF] transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setActiveStep(Math.min(5, activeStep + 1))} className="p-2 text-[#4B5563] hover:text-[#0057FF] transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="bg-white shadow-sm rounded-[2.5rem] p-8 md:p-16 shadow-2xl shadow-black/40 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[550px] flex flex-col justify-center items-center">
            
            {/* STEP 0: COMMAND */}
            {activeStep === 0 && (
              <div className="w-full max-w-2xl text-center animate-in fade-in zoom-in-95 duration-500">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] mb-12">You give an outcome</h2>
                
                <div className="bg-[#F4F7FF] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-8 mb-8 shadow-sm text-left">
                  <div className="flex items-center text-lg font-bold text-[#111827] mb-8">
                    <span className="bg-indigo-600/20 text-[#0057FF] px-3 py-1 rounded-lg text-sm mr-4 border border-indigo-500/30">You</span>
                    "Get me 20 new customers."
                  </div>
                  
                  <div className="border-t border-slate-100 pt-6 space-y-2">
                    <p className="text-[#374151] font-medium">No workflow designer.</p>
                    <p className="text-[#374151] font-medium">No complicated automation setup.</p>
                    <p className="text-[#4B5563] mt-4">Tell your AI company what you want in normal language.</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                  <span className="bg-white shadow-sm border border-slate-100 text-[#374151] px-4 py-2 rounded-full text-sm font-medium border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">"Find what's stopping my business from growing."</span>
                  <span className="bg-white shadow-sm border border-slate-100 text-[#374151] px-4 py-2 rounded-full text-sm font-medium border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">"Reduce unnecessary costs."</span>
                  <span className="bg-white shadow-sm border border-slate-100 text-[#374151] px-4 py-2 rounded-full text-sm font-medium border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">"Pause customer acquisition."</span>
                </div>
                
                <button onClick={() => setActiveStep(1)} className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-indigo-600/10 text-[#0057FF] hover:bg-indigo-600/20 font-bold transition-colors mx-auto">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            )}

            {/* STEP 1: UNDERSTAND */}
            {activeStep === 1 && (
              <div className="w-full max-w-3xl text-center animate-in fade-in zoom-in-95 duration-500">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] mb-4">ItWield understands your company</h2>
                <p className="text-lg text-[#4B5563] mb-12">ItWield uses the company context you've already provided.</p>
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  <div className="bg-[#F4F7FF] border-2 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-6 flex-1 w-full text-left shadow-sm">
                    <div className="flex items-center text-[#0057FF] font-bold text-sm tracking-widest uppercase mb-6">
                      <Database className="w-5 h-5 mr-2" /> COMPANY BRAIN
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {['Company', 'Products', 'Customers', 'Market', 'Goals', 'Competitors'].map(tag => (
                        <div key={tag} className="bg-white shadow-sm border border-slate-100 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-[#374151] text-sm font-medium px-4 py-2 rounded-lg text-center">
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <ArrowRight className="w-6 h-6 text-indigo-500 hidden md:block shrink-0" />
                  <ArrowRight className="w-6 h-6 text-indigo-500 md:hidden rotate-90 shrink-0" />
                  
                  <div className="bg-indigo-600 rounded-[32px] p-8 flex-1 w-full text-center shadow-lg shadow-indigo-900/50 text-[#111827] flex flex-col items-center justify-center min-h-[220px]">
                    <Target className="w-10 h-10 mb-4 text-indigo-200" />
                    <h3 className="text-xl font-bold mb-2">AI understands objective</h3>
                    <p className="text-indigo-200 text-sm">Context is automatically applied to your request.</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PLAN */}
            {activeStep === 2 && (
              <div className="w-full max-w-4xl text-center animate-in fade-in zoom-in-95 duration-500">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] mb-4">Your AI executives take ownership</h2>
                <p className="text-lg text-[#4B5563] mb-12">The appropriate executives coordinate around the objective.</p>
                
                <div className="flex flex-col items-center relative">
                  <div className="bg-[#F4F7FF] text-[#111827] font-bold px-8 py-3 rounded-full mb-6 relative z-10 shadow-lg tracking-widest text-sm border border-slate-100">
                    OBJECTIVE
                  </div>
                  
                  <div className="w-0.5 h-6 bg-indigo-600/50 -mt-6 mb-0" />
                  
                  <div className="bg-indigo-600 text-[#111827] rounded-[32px] p-6 w-full max-w-md text-center mb-6 relative z-10 shadow-lg">
                    <h3 className="text-xl font-bold mb-1">CEO</h3>
                    <p className="text-indigo-200 text-sm mb-4">Company strategy & priorities</p>
                    <div className="bg-indigo-600/50 text-[#111827] text-sm font-medium py-1.5 px-4 rounded-lg inline-block border border-indigo-400/50">
                      What matters most?
                    </div>
                  </div>
                  
                  <div className="w-0.5 h-6 bg-indigo-600/50 -mt-6 mb-0" />
                  
                  <div className="bg-indigo-600 text-[#111827] rounded-[32px] p-6 w-full max-w-md text-center mb-8 relative z-10 shadow-lg">
                    <h3 className="text-xl font-bold mb-1">COO</h3>
                    <p className="text-indigo-100 text-sm mb-4">Operations & coordination</p>
                    <div className="bg-indigo-400/50 text-[#111827] text-sm font-medium py-1.5 px-4 rounded-lg inline-block border border-indigo-300/50">
                      How do we operate?
                    </div>
                  </div>
                  
                  {/* Branching */}
                  <div className="relative w-full max-w-3xl flex justify-center">
                    <div className="absolute top-0 left-1/6 right-1/6 w-2/3 h-0.5 bg-slate-700" />
                    <div className="absolute top-0 left-1/2 w-0.5 h-6 bg-slate-700 -translate-x-1/2 border-l-2 border-dashed border-indigo-400 bg-transparent" />
                    
                    <div className="grid grid-cols-3 gap-4 w-full pt-6">
                      <div className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-[#F4F7FF] rounded-xl p-4 text-center relative flex flex-col items-center">
                        <div className="absolute -top-6 left-1/2 w-0.5 h-6 bg-slate-700 -translate-x-1/2" />
                        <h4 className="font-bold text-[#374151]">CTO</h4>
                        <p className="text-xs text-[#4B5563]">Technology & systems</p>
                      </div>
                      
                      <div className="border-2 border-indigo-500 bg-[#F4F7FF] rounded-xl p-4 text-center relative flex flex-col items-center shadow-lg shadow-indigo-900/50 scale-105 z-10">
                        <div className="absolute -top-4 right-[-10px] bg-indigo-600 text-[#111827] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</div>
                        <h4 className="font-bold text-[#0057FF]">CMO</h4>
                        <p className="text-xs text-[#4B5563]">Customers & growth</p>
                      </div>
                      
                      <div className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-[#F4F7FF] rounded-xl p-4 text-center relative flex flex-col items-center">
                        <div className="absolute -top-6 left-1/2 w-0.5 h-6 bg-slate-700 -translate-x-1/2" />
                        <h4 className="font-bold text-[#374151]">CFO</h4>
                        <p className="text-xs text-[#4B5563]">Financial health & cost</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: EXECUTE */}
            {activeStep === 3 && (
              <div className="w-full max-w-3xl text-center animate-in fade-in zoom-in-95 duration-500">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] mb-2">AI workers execute the work</h2>
                <div className="inline-block bg-amber-500/20 text-amber-400 text-[10px] md:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-10 border border-amber-500/30">
                  INTERACTIVE DEMO — Illustrative activity, not real business results
                </div>
                
                <div className="bg-[#F4F7FF]/50 border border-slate-100 rounded-[32px] p-8 shadow-xl flex flex-col items-center">
                  <div className="bg-indigo-600/20 text-[#0057FF] border border-indigo-500/30 font-bold px-6 py-2 rounded-lg mb-6 text-sm">
                    CMO WORK ASSIGNMENTS
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-[#4B5563] rotate-90 mb-6" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8">
                    <div className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white shadow-sm border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 mb-3 flex items-center justify-center border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"><Target className="w-5 h-5 text-[#4B5563]" /></div>
                      <div className="text-sm font-medium text-[#374151]">Research Worker</div>
                    </div>
                    <div className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white shadow-sm border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 mb-3 flex items-center justify-center border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"><CheckSquare className="w-5 h-5 text-[#4B5563]" /></div>
                      <div className="text-sm font-medium text-[#374151]">Qualify Worker</div>
                    </div>
                    <div className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white shadow-sm border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 mb-3 flex items-center justify-center border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"><Zap className="w-5 h-5 text-[#4B5563]" /></div>
                      <div className="text-sm font-medium text-[#374151]">Execute Worker</div>
                    </div>
                  </div>
                  
                  <div className="bg-[#F4F7FF] border border-slate-100 w-full rounded-xl p-6 text-left font-mono text-sm space-y-3 shadow-inner text-emerald-700">
                    <div className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-700" /> Market research completed</div>
                    <div className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-700" /> Prospects identified</div>
                    <div className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-700" /> Opportunities processed</div>
                    <div className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-700" /> Results recorded in CRM</div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: VERIFY */}
            {activeStep === 4 && (
              <div className="w-full max-w-3xl text-center animate-in fade-in zoom-in-95 duration-500">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] mb-4">ItWield verifies what actually happened</h2>
                <p className="text-lg text-[#4B5563] mb-12 leading-relaxed">
                  AI doesn't get to declare success. ItWield separates planned work, executed work,<br/>and verified business outcomes based on real business data.
                </p>
                
                <div className="bg-[#F4F7FF] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-8 shadow-xl max-w-2xl mx-auto text-left relative">
                  <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-4">
                    <div className="flex items-center text-[#0057FF] font-bold tracking-widest uppercase text-sm">
                      <Activity className="w-5 h-5 mr-2" /> OUTCOME VERIFICATION
                    </div>
                    <span className="bg-white shadow-sm border border-slate-100 text-[#4B5563] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-[10px] px-2 py-1 rounded font-medium">Demo data</span>
                  </div>
                  
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <div className="text-sm font-medium text-[#4B5563] mb-1">Target Customers</div>
                      <div className="text-5xl font-extrabold text-[#111827]">20</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[#0057FF] mb-1">Verified Customers</div>
                      <div className="text-5xl font-extrabold text-indigo-500">7</div>
                    </div>
                  </div>
                  
                  <div className="relative h-4 bg-white shadow-sm border border-slate-100 rounded-full mb-4 overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  
                  <div className="flex justify-between text-xs font-medium text-[#4B5563]">
                    <span>0</span>
                    <span>Remaining: 13</span>
                    <span>20</span>
                  </div>
                  
                  <div className="mt-8 text-center text-sm text-[#4B5563] font-medium">
                    Only supported business records count toward the actual result.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: OPERATE */}
            {activeStep === 5 && (
              <div className="w-full max-w-4xl text-center animate-in fade-in zoom-in-95 duration-500">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] mb-4">Your AI company keeps operating</h2>
                <p className="text-lg text-[#4B5563] mb-16">Autonomous doesn't mean uncontrolled.</p>
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-16 md:gap-24 mt-8">
                  
                  {/* Circle Graphic */}
                  <div className="relative w-64 h-64 shrink-0">
                    <div className="absolute inset-0 rounded-full border-2 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-dashed" />
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-[spin_4s_linear_infinite]" />
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-indigo-500 mb-2" />
                      <span className="font-bold text-[#111827] tracking-widest uppercase text-sm">OPERATE</span>
                    </div>
                    
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-sm px-3 py-1 rounded text-xs font-bold text-[#4B5563]">Evaluate</div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white shadow-sm px-3 py-1 rounded text-xs font-bold text-[#4B5563]">Verify</div>
                    <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 bg-white shadow-sm px-3 py-1 rounded text-xs font-bold text-[#4B5563]">Execute</div>
                    <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 bg-white shadow-sm px-3 py-1 rounded text-xs font-bold text-[#4B5563]">Replan</div>
                  </div>
                  
                  {/* Legend */}
                  <div className="text-left space-y-6">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-4"></div>
                      <div className="text-base"><span className="font-bold text-[#374151]">If it's working:</span> <span className="text-[#4B5563]">Continue</span></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-4"></div>
                      <div className="text-base"><span className="font-bold text-[#374151]">If it's not working:</span> <span className="text-[#4B5563]">Investigate & replan</span></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-4"></div>
                      <div className="text-base"><span className="font-bold text-[#374151]">If it's blocked:</span> <span className="text-[#4B5563]">Coordinate the dependency</span></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-4"></div>
                      <div className="text-base"><span className="font-bold text-[#374151]">If authority required:</span> <span className="text-[#4B5563]">Pause & ask you</span></div>
                    </div>
                  </div>
                  
                </div>
              </div>
            )}
            
          </div>
        </div>
      </section>

      {/* AI EXECUTIVE TEAM */}
      <section id="executive-team" className="py-24 bg-[#F4F7FF] border-t border-slate-100 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-tight text-[#111827] mb-4 tracking-tight">Meet your AI executive team.</h2>
            <p className="text-xl text-[#4B5563]">Five specialized executives. One company. One operating context.</p>
          </div>

          <div className="flex flex-col items-center">
            
            <div className="bg-white shadow-sm border border-slate-100 border border-slate-600 px-8 py-3 rounded-full text-[#111827] font-bold tracking-widest uppercase text-sm shadow-lg mb-6 z-10">
              Founder
            </div>
            
            <div className="w-0.5 h-6 bg-slate-700 mb-6" />

            {/* CEO */}
            <div className="w-full max-w-2xl bg-white shadow-sm border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 shadow-xl relative z-10">
              <div className="w-14 h-14 bg-indigo-600/20 text-[#0057FF] rounded-xl flex items-center justify-center shrink-0"><Briefcase className="w-7 h-7" /></div>
              <div>
                <h3 className="text-2xl font-bold text-[#111827] mb-1">CEO</h3>
                <p className="text-[#4B5563]">Company strategy and priorities.</p>
              </div>
            </div>

            <div className="w-0.5 h-6 bg-slate-700 mb-6" />

            {/* COO */}
            <div className="w-full max-w-2xl bg-white shadow-sm border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 shadow-xl relative z-10">
              <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shrink-0"><Settings className="w-7 h-7" /></div>
              <div>
                <h3 className="text-2xl font-bold text-[#111827] mb-1">COO</h3>
                <p className="text-[#4B5563]">Operations and coordination.</p>
              </div>
            </div>

            <div className="w-0.5 h-6 bg-slate-700 mb-6" />

            {/* Specialists */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl mb-6 relative z-10">
              <div className="bg-white shadow-sm border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-6 flex flex-col items-center text-center shadow-xl">
                <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center mb-4"><TrendingUp className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold text-[#111827] mb-2">CMO</h3>
                <p className="text-sm text-[#4B5563]">Customers and growth.</p>
              </div>
              <div className="bg-white shadow-sm border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-6 flex flex-col items-center text-center shadow-xl">
                <div className="w-12 h-12 bg-slate-700 text-white rounded-xl flex items-center justify-center mb-4"><Terminal className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold text-[#111827] mb-2">CTO</h3>
                <p className="text-sm text-[#4B5563]">Technology and systems.</p>
              </div>
              <div className="bg-white shadow-sm border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-6 flex flex-col items-center text-center shadow-xl">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-700 rounded-xl flex items-center justify-center mb-4"><PieChart className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold text-[#111827] mb-2">CFO</h3>
                <p className="text-sm text-[#4B5563]">Financial health and cost context.</p>
              </div>
            </div>

            <div className="w-0.5 h-6 bg-slate-700 mb-6" />
            
            <div className="bg-white shadow-sm border border-slate-100 border border-slate-600 border-dashed px-8 py-3 rounded-full text-[#374151] font-bold tracking-widest uppercase text-sm mb-6 z-10">
              AI Workforce
            </div>

            <div className="w-0.5 h-6 bg-slate-700 mb-6" />

            <div className="bg-[#111827] border border-slate-100 px-8 py-3 rounded-full text-white font-bold tracking-widest uppercase text-sm z-10">
              Authorized Systems
            </div>

          </div>
        </div>
      </section>
    </>
  );
}