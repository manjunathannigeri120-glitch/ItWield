import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Terminal, Briefcase, Settings, TrendingUp, PieChart, Pause, Play, Square, Check, ShieldCheck, Database, FileText, Lock, Activity } from 'lucide-react';

export function LandingHero() {
  const { user } = useAuth();
  const ctaDest = user ? "/dashboard" : "/login";

  return (
    <>
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left */}
            <div className="text-left">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-8 border border-indigo-500/20">
                AI Business Operating System
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-[1.1]">
                AI that operates your business automatically 24/7.
              </h1>
              <p className="text-xl text-slate-400 mb-10 leading-relaxed font-medium">
                Give ItWield a business objective.<br className="hidden md:block"/>
                Your AI executives understand your company, coordinate AI workers, execute authorized actions, verify results, and keep your company moving.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link to={ctaDest} className="inline-flex items-center justify-center font-bold h-14 bg-white text-slate-900 hover:bg-slate-200 px-8 text-lg rounded-full shadow-xl transition-all w-full sm:w-auto">
                  Start Building Your AI Company
                </Link>
                <a href="#how-it-works" className="inline-flex items-center justify-center font-semibold h-14 border border-slate-700 text-white px-8 text-lg rounded-full bg-slate-800/50 hover:bg-slate-800 transition-all w-full sm:w-auto backdrop-blur-sm">
                  See How It Works
                </a>
              </div>
              <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" /> No complicated workflow setup. You set the direction. ItWield handles the operating work.
              </div>
            </div>

            {/* Right: Product UI Preview */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-3xl blur opacity-20" />
              
              <div className="relative bg-[#0F172A] border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col h-full">
                
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> AI COMPANY OPERATING
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                    Illustrative Product Preview
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-slate-400 font-bold mb-1">Active Objective</p>
                    <p className="text-sm text-white font-medium">Get me 20 new customers</p>
                  </div>
                  <div className="bg-[#1E293B] p-4 rounded-xl border border-emerald-500/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500/5" />
                    <p className="text-xs text-emerald-500/70 uppercase tracking-wider font-bold mb-1 relative z-10">Progress</p>
                    <p className="text-sm text-emerald-400 font-medium relative z-10">7 / 20 VERIFIED</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {[
                    { role: "CEO", status: "Strategy aligned", icon: Briefcase, color: "text-indigo-400" },
                    { role: "COO", status: "Operations coordinated", icon: Settings, color: "text-blue-400" },
                    { role: "CMO", status: "Customer acquisition", icon: TrendingUp, color: "text-rose-400" },
                    { role: "CTO", status: "No technical blockers", icon: Terminal, color: "text-slate-300" },
                    { role: "CFO", status: "Monitoring financial context", icon: PieChart, color: "text-emerald-400" }
                  ].map((exec, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-800/30 p-2.5 rounded-full border border-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded flex items-center justify-center bg-slate-800 ${exec.color}`}><exec.icon className="w-3.5 h-3.5" /></div>
                        <span className="text-sm font-bold text-slate-300">{exec.role}</span>
                      </div>
                      <span className="text-xs text-slate-400">{exec.status}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 flex items-center justify-between mb-6">
                  <span className="text-xs font-bold text-slate-400">Founder Attention</span>
                  <span className="text-xs text-slate-400 font-medium bg-slate-800 px-2 py-1 rounded">None required</span>
                </div>

                <div className="flex justify-center gap-4 mt-auto">
                  <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center border border-amber-500/20 cursor-pointer hover:bg-amber-500/20"><Pause className="w-4 h-4 fill-current" /></div>
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20"><Play className="w-4 h-4 fill-current" /></div>
                  <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/20 cursor-pointer hover:bg-rose-500/20"><Square className="w-4 h-4 fill-current" /></div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-16 bg-[#0B1121] border-y border-slate-800 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-base font-bold text-slate-400 mb-10">Built around controlled AI operation.</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { title: "Authorized Actions", desc: "Only approved capabilities can execute.", icon: Lock },
              { title: "Verified Results", desc: "Execution is not success until confirmed.", icon: ShieldCheck },
              { title: "Company Context", desc: "Executives use appropriate business context.", icon: Database },
              { title: "Founder Control", desc: "Founder remains the ultimate authority.", icon: Activity },
              { title: "Auditability", desc: "Important operations are recorded.", icon: FileText },
              { title: "Safe Failure", desc: "System stops or escalates when blocked.", icon: Square },
            ].map((trust, i) => (
              <div key={i} className="text-center">
                <trust.icon className="w-6 h-6 mx-auto text-indigo-400 mb-3" />
                <h3 className="text-sm font-bold text-white mb-1">{trust.title}</h3>
                <p className="text-xs text-slate-400">{trust.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}