import { Database, RefreshCcw, Check, Briefcase, Settings, TrendingUp, Terminal, PieChart, Pause, Play, Square } from 'lucide-react';

export function LandingFeatures() {
  return (
    <div className="bg-[#0F172A] overflow-hidden">
      
      {/* FEATURE 1 - COMPANY BRAIN */}
      <section id="company-brain" className="scroll-mt-24 py-24 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Your AI company remembers how your business works.</h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-6">
              Company Brain stores relevant company context, goals, decisions, lessons, failures, and business knowledge so executives do not start from zero every time.
            </p>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-3 py-1 rounded-full w-max mb-6">
                <Database className="w-3 h-3" /> COMPANY BRAIN
              </div>
              <div className="flex flex-wrap gap-2 mb-8">
                {['Goals', 'Decisions', 'Products', 'Customers', 'Markets', 'Strategy', 'Lessons', 'Failures', 'Technical context', 'Operational context'].map((tag, i) => (
                  <span key={i} className="text-xs text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">{tag}</span>
                ))}
              </div>
              <div className="border-t border-slate-700 pt-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Retrieving Context</p>
                <div className="flex gap-2 justify-center">
                  {[Briefcase, Settings, TrendingUp, Terminal, PieChart].map((Icon, i) => (
                    <div key={i} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 2 - BUSINESS OUTCOME ENGINE */}
      <section id="business-outcome" className="scroll-mt-24 py-24 px-6 border-t border-slate-800 bg-[#0B1121]">
        <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 w-full">
            <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 shadow-2xl relative">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono absolute top-6 right-6">Illustrative Product Preview</div>
              <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Customer Acquisition</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Target</p>
                  <p className="text-2xl text-white font-medium">20 <span className="text-sm text-slate-400">customers</span></p>
                </div>
                <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                  <p className="text-xs text-emerald-500/70 font-bold uppercase mb-1">Current</p>
                  <p className="text-2xl text-emerald-400 font-medium">7 <span className="text-sm text-emerald-500/50">verified</span></p>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-6">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Gap</p>
                  <p className="text-lg text-white font-medium">13</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Status</p>
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-1 rounded">Operating</div>
                </div>
              </div>

              <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Next Action</p>
                <p className="text-sm text-indigo-200">Continue customer acquisition</p>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Start with the outcome.</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              You define the measurable business result. The engine determines the current reality, calculates the gap, and operates the company to bridge it.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE 3 - FOUNDER CONTROL CENTER */}
      <section id="control-center" className="scroll-mt-24 py-24 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Know what your AI company is doing.</h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-6">
              You don't have to run your AI executives manually. You stay informed and intervene when your authority is required.
            </p>
            <div className="flex justify-start gap-4 mt-8">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center border border-amber-500/30 mb-2"><Pause className="w-5 h-5 fill-current" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pause</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/30 mb-2"><Play className="w-5 h-5 fill-current" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Resume</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/30 mb-2"><Square className="w-5 h-5 fill-current" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Stop</span>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 shadow-2xl relative">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                  <span className="text-sm font-medium text-slate-300">Company Status</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded uppercase">Operating</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                  <span className="text-sm font-medium text-slate-300">Active Objective</span>
                  <span className="text-sm text-slate-400 truncate max-w-[200px]">Get me 20 new customers</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                  <span className="text-sm font-medium text-slate-300">Blocked Work</span>
                  <span className="text-sm text-slate-400">0 tasks</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                  <span className="text-sm font-medium text-slate-300">Pending Approvals</span>
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded uppercase">1 Required</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-300">Recent Activity</span>
                  <span className="text-sm text-slate-400">CEO updated strategy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 4 - REAL EXECUTION */}
      <section className="py-24 px-6 border-t border-slate-800 bg-[#0B1121]">
        <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 w-full">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
              <div className="space-y-4">
                {['Objective', 'Authorized capability', 'Worker', 'Connected system', 'External action', 'Verification', 'Evidence'].map((step, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">AI that can do more than talk.</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              ItWield separates AI intent from actual system execution, safely bridging the gap between planning and reality.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE 5 - VERIFICATION */}
      <section id="verification" className="scroll-mt-24 py-24 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">AI saying "done" isn't proof.</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Business outcomes are verified using available authoritative evidence. If the evidence isn't there, the result isn't verified.
            </p>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 shadow-2xl relative">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono absolute top-6 right-6">Illustrative Demo Data</div>
              
              <div className="space-y-6 mt-8">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">PLANNED</div>
                  <div className="text-xl text-white">20 customers</div>
                </div>
                <div className="w-full h-px bg-slate-700" />
                <div>
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">EXECUTED</div>
                  <div className="text-xl text-blue-100">14 opportunities processed</div>
                </div>
                <div className="w-full h-px bg-slate-700" />
                <div>
                  <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">VERIFIED</div>
                  <div className="text-xl text-emerald-400">7 customers confirmed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 6 - FAILURE RECOVERY */}
      <section className="py-24 px-6 border-t border-slate-800 bg-[#0B1121]">
        <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 w-full">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
              <div className="flex flex-col items-center text-center">
                <div className="bg-rose-500/10 text-rose-400 px-4 py-2 rounded-lg text-sm font-bold border border-rose-500/20 mb-3">PROBLEM DETECTED</div>
                <div className="w-px h-6 bg-slate-700 mb-3" />
                <div className="text-slate-400 text-sm mb-3">INVESTIGATE</div>
                <div className="w-px h-6 bg-slate-700 mb-3" />
                <div className="text-slate-400 text-sm mb-3">DIAGNOSE</div>
                <div className="w-px h-6 bg-slate-700 mb-3" />
                <div className="text-slate-400 text-sm mb-3">AUTHORIZED FIX</div>
                <div className="w-px h-6 bg-slate-700 mb-3" />
                <div className="text-slate-400 text-sm mb-3">INDEPENDENT VERIFICATION</div>
                <div className="w-px h-6 bg-slate-700 mb-3" />
                <div className="flex gap-4">
                  <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg text-sm font-bold border border-emerald-500/20">RESOLVED</div>
                  <div className="text-slate-500 flex items-center text-sm">OR</div>
                  <div className="bg-amber-500/10 text-amber-400 px-4 py-2 rounded-lg text-sm font-bold border border-amber-500/20">ESCALATE TO FOUNDER</div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">When something goes wrong, ItWield doesn't just say "done."</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Operations fail. The AI operating system detects failures, diagnoses the root cause, attempts authorized recovery, and escalates to you if it lacks authority.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE 7 - CONTINUOUS OPERATION */}
      <section className="py-24 px-6 border-y border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">The work doesn't stop after one task.</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Designed for continuous operation. The system loops endlessly—monitoring reality, planning next steps, delegating work, and verifying outcomes until the goal is met.
            </p>
          </div>
          <div className="lg:w-1/2 w-full flex justify-center">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 rounded-full border-2 border-slate-800 border-dashed" />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCcw className="w-10 h-10 text-indigo-400" />
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 px-3 py-1 rounded text-xs font-bold text-slate-300">MONITOR</div>
              <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 bg-slate-800 px-3 py-1 rounded text-xs font-bold text-slate-300">EXECUTE</div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-slate-800 px-3 py-1 rounded text-xs font-bold text-slate-300">LEARN</div>
              <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 bg-slate-800 px-3 py-1 rounded text-xs font-bold text-slate-300">PLAN</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}