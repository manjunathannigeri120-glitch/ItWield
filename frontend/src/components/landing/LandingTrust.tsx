import { Lock, FileText, Pause, Target, Building2, Briefcase, Users, Activity, GitBranch, Database, Cloud } from 'lucide-react';

export function LandingTrust() {
  return (
    <div className="bg-[#0F172A]">
      
      {/* SECURITY / TRUST SECTION */}
      <section id="trust" className="scroll-mt-24 py-24 px-6 border-b border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Autonomous doesn't mean uncontrolled.</h2>
            <p className="text-xl text-slate-400">Your AI company should be powerful enough to operate and controlled enough to trust.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#1E293B] border border-slate-700 p-8 rounded-2xl">
              <Lock className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">TENANT ISOLATION</h3>
              <p className="text-slate-400 text-sm">Company data remains scoped to its workspace.</p>
            </div>
            <div className="bg-[#1E293B] border border-slate-700 p-8 rounded-2xl">
              <Activity className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">AUTHORIZED CAPABILITIES</h3>
              <p className="text-slate-400 text-sm">AI actions are constrained by available capabilities.</p>
            </div>
            <div className="bg-[#1E293B] border border-slate-700 p-8 rounded-2xl">
              <Target className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">RISK CONTROLS</h3>
              <p className="text-slate-400 text-sm">Higher-risk actions can require approval.</p>
            </div>
            <div className="bg-[#1E293B] border border-slate-700 p-8 rounded-2xl">
              <FileText className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">AUDIT TRAIL</h3>
              <p className="text-slate-400 text-sm">Important actions are recorded.</p>
            </div>
            <div className="bg-[#1E293B] border border-slate-700 p-8 rounded-2xl">
              <Lock className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">PROMPT INJECTION DEFENSE</h3>
              <p className="text-slate-400 text-sm">Instructions from untrusted content cannot override server-side controls.</p>
            </div>
            <div className="bg-[#1E293B] border border-slate-700 p-8 rounded-2xl">
              <Pause className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">FOUNDER CONTROL</h3>
              <p className="text-slate-400 text-sm">PAUSE / RESUME / STOP remain available.</p>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE ACTIVITY / OBSERVABILITY */}
      <section id="activity" className="scroll-mt-24 py-24 px-6 border-b border-slate-800 bg-[#0B1121]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 tracking-tight">See what your AI company is doing.</h2>
          
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 shadow-2xl text-left max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute top-4 right-6 text-[10px] uppercase tracking-widest text-slate-500">Illustrative Activity Feed</div>
            <div className="space-y-6 mt-6">
              {[
                { time: "10:42:18", role: "CMO", action: "Customer acquisition task started", color: "text-rose-400" },
                { time: "10:42:14", role: "COO", action: "Dependency checked", color: "text-blue-400" },
                { time: "10:42:09", role: "CTO", action: "No technical blockers detected", color: "text-slate-300" },
                { time: "10:42:03", role: "CFO", action: "Financial context reviewed", color: "text-emerald-400" },
                { time: "10:41:58", role: "CEO", action: "Strategic priority confirmed", color: "text-indigo-400" },
              ].map((log, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="text-xs text-slate-500 font-mono w-20 shrink-0 pt-0.5">{log.time}</div>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-widest mr-2 ${log.color}`}>{log.role}</span>
                    <span className="text-sm text-slate-300">{log.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHILE YOU ARE AWAY */}
      <section className="py-24 px-6 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Your company can keep working while you're away.</h2>
          <p className="text-xl text-slate-400 mb-16">You don't need to sit in front of ItWield and repeatedly press Run.</p>

          <div className="flex flex-wrap justify-center items-center gap-4 text-sm font-bold tracking-widest text-slate-300 uppercase">
            <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg">Founder leaves</div>
            <span className="text-slate-600">→</span>
            <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2 rounded-lg">AI company operates</div>
            <span className="text-slate-600">→</span>
            <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg">Progress monitored</div>
            <span className="text-slate-600">→</span>
            <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg">Problems detected</div>
            <span className="text-slate-600">→</span>
            <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg">Safe actions executed</div>
            <span className="text-slate-600">→</span>
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg">Results verified</div>
            <span className="text-slate-600">→</span>
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-lg">Founder notified when attention is required</div>
          </div>
        </div>
      </section>

      {/* WHO ITWIELD IS FOR */}
      <section className="py-24 px-6 border-b border-slate-800 bg-[#0B1121]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#1E293B] border border-slate-700 p-8 rounded-2xl">
              <Briefcase className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">FOUNDERS</h3>
              <p className="text-slate-400 text-sm">Set direction and let AI handle operating work.</p>
            </div>
            <div className="bg-[#1E293B] border border-slate-700 p-8 rounded-2xl">
              <Building2 className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">STARTUPS</h3>
              <p className="text-slate-400 text-sm">Build an AI operating layer without hiring a large operations team.</p>
            </div>
            <div className="bg-[#1E293B] border border-slate-700 p-8 rounded-2xl">
              <Activity className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">GROWING COMPANIES</h3>
              <p className="text-slate-400 text-sm">Coordinate customer, technical, operational, and financial work.</p>
            </div>
            <div className="bg-[#1E293B] border border-slate-700 p-8 rounded-2xl">
              <Users className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">TEAMS</h3>
              <p className="text-slate-400 text-sm">Give specialized AI workers clearly defined responsibilities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORTED CONNECTIONS */}
      <section id="connections" className="scroll-mt-24 py-24 px-6 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-10 tracking-tight">Connect the systems your AI company is authorized to operate.</h2>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#1E293B] border border-slate-700 rounded-2xl flex items-center justify-center mb-3 text-white">
                <GitBranch className="w-8 h-8" />
              </div>
              <span className="text-sm font-bold text-slate-300">GitHub</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#1E293B] border border-slate-700 rounded-2xl flex items-center justify-center mb-3 text-white">
                <Cloud className="w-8 h-8" />
              </div>
              <span className="text-sm font-bold text-slate-300">Vercel</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#1E293B] border border-slate-700 rounded-2xl flex items-center justify-center mb-3 text-emerald-400">
                <Database className="w-8 h-8" />
              </div>
              <span className="text-sm font-bold text-slate-300">Supabase</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}