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
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-8 border border-indigo-500/20">
                AI Business Operating System
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-[1.1]">
                AI that operates your business automatically 24/7.
              </h1>
              <p className="text-xl text-slate-400 mb-10 leading-relaxed font-medium">
                Give ItWield a business objective.<br className="hidden md:block"/>
                Your AI executives understand your company, coordinate AI workers, execute authorized actions, verify results, and ensure continuous business operation.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link to={ctaDest} className="inline-flex items-center justify-center font-bold h-14 bg-white text-slate-900 hover:bg-slate-200 px-8 text-lg rounded-full shadow-xl transition-all w-full sm:w-auto">
                  Start Building Your AI Company
                </Link>
                <a href="#how-it-works" className="inline-flex items-center justify-center font-semibold h-14 border border-slate-700 text-white px-8 text-lg rounded-full bg-slate-800/50 hover:bg-slate-800 transition-all w-full sm:w-auto backdrop-blur-sm">
                  See How It Works
                </a>
              </div>
              <div className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> No complicated workflow setup. You set the direction. ItWield handles the operating work.
              </div>
            </div>

            
            {/* Right: Integrated Hero Visual */}
            <div className="relative w-full h-full min-h-[400px] lg:min-h-[600px] flex items-center justify-center">
              {/* Decorative background glow matching the premium enterprise aesthetic */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-[3rem] blur-3xl" />
              
              <div className="relative w-full max-w-lg aspect-square">
                {/* Outer gradient mask to blend edges naturally into the #0F172A / #0B1121 background */}
                <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'radial-gradient(circle, transparent 40%, #0F172A 70%)' }}></div>
                <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #0F172A 0%, transparent 20%, transparent 80%, #0F172A 100%)' }}></div>
                <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, #0F172A 0%, transparent 20%, transparent 80%, #0F172A 100%)' }}></div>

                <img 
                  src="/images/hero-visual.jpg" 
                  alt="Autonomous AI Company Operations" 
                  className="absolute inset-0 w-full h-full object-cover rounded-full mix-blend-screen opacity-90"
                />
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