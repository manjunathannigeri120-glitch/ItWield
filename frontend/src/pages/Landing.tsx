import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { HowItWorksDemo } from "@/components/landing/HowItWorksDemo";
import { 
  Briefcase, 
  Settings, 
  TrendingUp, 
  Terminal, 
  PieChart, 
  CheckCircle2, 
  ShieldAlert, 
  Bell, 
  CheckSquare,
  ArrowRight
} from "lucide-react";

export function Landing() {
  const { user } = useAuth();

  const ctaDestination = user ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* SECTION 1 — HERO */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-6 text-center max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1]">
          AI to operate your business automatically 24/7
        </h1>
        
        <div className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
          <p className="mb-2">Give ItWield a business objective.</p>
          <p>Your AI executives plan, coordinate, execute, verify, and keep your company moving.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to={ctaDestination}
            className="inline-flex items-center justify-center font-semibold h-14 bg-indigo-600 text-white hover:bg-indigo-700 px-8 text-lg rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto"
          >
            Start Building Your AI Company
          </Link>
          <a 
            href="#how-it-works"
            className="inline-flex items-center justify-center font-semibold h-14 border-2 border-slate-200 text-slate-700 px-8 text-lg rounded-full bg-white hover:bg-slate-50 hover:border-slate-300 transition-all w-full sm:w-auto"
          >
            See How It Works
          </a>
        </div>
      </section>

      {/* SECTION 2 — INTERACTIVE HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-white border-y border-slate-200 px-4 md:px-6">
        <div className="max-w-5xl mx-auto mb-16 text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-6">How ItWield Runs Your Business</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Give your AI company an outcome.<br className="hidden md:block"/>
            ItWield plans the work, coordinates your AI executives and workers, executes authorized actions, verifies the result, and keeps operating.
          </p>
        </div>
        
        <HowItWorksDemo />
      </section>

      {/* SECTION 3 — AI EXECUTIVE TEAM */}
      <section className="py-24 bg-slate-50 px-6 border-b border-slate-200">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Meet Your AI Executive Team</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-16">
            ItWield gives your company specialized AI executives that coordinate instead of leaving you to manage every task.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">CEO</h3>
              <p className="text-slate-600 text-sm">Company strategy and priorities.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-4">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">COO</h3>
              <p className="text-slate-600 text-sm">Operations and coordination.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition-shadow lg:transform lg:-translate-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">CMO</h3>
              <p className="text-slate-600 text-sm">Customers and growth.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center mb-4">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">CTO</h3>
              <p className="text-slate-600 text-sm">Technology and systems.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mb-4">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">CFO</h3>
              <p className="text-slate-600 text-sm">Financial health and cost context.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — FOUNDER CONTROL */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 text-left">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Stay informed.<br/>Stay in control.</h2>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Autonomy does not remove the founder. ItWield continuously updates your Founder Control Center so you always know what your AI company is doing, what is blocked, and when your authority is required.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckSquare className="w-6 h-6 text-indigo-600 mr-3 shrink-0" />
                <span className="text-slate-700 font-medium">Review pending approvals safely.</span>
              </li>
              <li className="flex items-start">
                <ShieldAlert className="w-6 h-6 text-indigo-600 mr-3 shrink-0" />
                <span className="text-slate-700 font-medium">Get notified of emergency blockers.</span>
              </li>
              <li className="flex items-start">
                <Bell className="w-6 h-6 text-indigo-600 mr-3 shrink-0" />
                <span className="text-slate-700 font-medium">See what happened while you were away.</span>
              </li>
            </ul>
          </div>
          
          <div className="lg:w-1/2 w-full">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-2 right-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">Product Interface Preview</div>
              <div className="flex items-center space-x-2 mb-6 border-b border-slate-200 pb-4">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="font-bold text-slate-900">COMPANY STATUS</div>
                <div className="text-emerald-600 text-sm font-semibold ml-auto">AI COMPANY OPERATING</div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Objective</div>
                  <div className="font-semibold text-slate-800">Get me 20 new customers</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-l-4 border-l-emerald-400">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">CMO</div>
                    <div className="text-sm font-medium text-slate-700">Customer acquisition in progress</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-l-4 border-l-blue-400">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">COO</div>
                    <div className="text-sm font-medium text-slate-700">Monitoring dependencies</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-l-4 border-l-purple-400">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">CTO</div>
                    <div className="text-sm font-medium text-slate-700">No technical blockers</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-l-4 border-l-slate-300">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Founder Attention</div>
                    <div className="text-sm font-medium text-slate-500">None required</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — VERIFIED OUTCOMES */}
      <section className="py-24 bg-slate-900 text-white px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-6">Built around real business outcomes</h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-16">
            AI plans are not the same as business results. No fabricated AI outcomes.
          </p>

          <div className="flex flex-col md:flex-row items-stretch justify-center gap-6">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 flex-1 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-600"></div>
              <h3 className="font-bold text-2xl mb-2">PLAN</h3>
              <p className="text-slate-400 text-sm mb-6 h-10">What AI intends to accomplish</p>
              <div className="text-5xl font-extrabold text-slate-200">20</div>
              <div className="text-slate-500 font-medium mt-2">Target Customers</div>
            </div>

            <div className="hidden md:flex flex-col items-center justify-center">
              <ArrowRight className="w-8 h-8 text-slate-600" />
            </div>

            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 flex-1 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
              <h3 className="font-bold text-2xl mb-2">EXECUTION</h3>
              <p className="text-slate-400 text-sm mb-6 h-10">What AI workers attempted</p>
              <div className="text-5xl font-extrabold text-indigo-400">14</div>
              <div className="text-slate-500 font-medium mt-2">Opportunities Processed</div>
            </div>

            <div className="hidden md:flex flex-col items-center justify-center">
              <ArrowRight className="w-8 h-8 text-slate-600" />
            </div>

            <div className="bg-slate-800 p-8 rounded-2xl border border-emerald-900/50 flex-1 relative overflow-hidden group shadow-[0_0_40px_rgba(16,185,129,0.1)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
              <h3 className="font-bold text-2xl mb-2 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 mr-2" /> VERIFIED
              </h3>
              <p className="text-slate-400 text-sm mb-6 h-10">What your business data confirms</p>
              <div className="text-5xl font-extrabold text-emerald-400">7</div>
              <div className="text-slate-500 font-medium mt-2">Verified Customers</div>
            </div>
          </div>
          
          <div className="mt-8 text-sm font-medium text-slate-500 bg-slate-800/50 inline-block px-4 py-2 rounded-lg border border-slate-700">
            Illustrative demo data
          </div>
        </div>
      </section>

      {/* SECTION 6 — FINAL CTA */}
      <section className="py-32 px-6 text-center bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-extrabold text-slate-900 mb-8 leading-tight">
            Your business doesn't need another dashboard.<br/>
            It needs an AI company that can operate.
          </h2>
          <p className="text-2xl text-slate-600 mb-12 font-medium">
            Set the direction.<br/>
            Let ItWield handle the operating work.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to={ctaDestination}
              className="inline-flex items-center justify-center font-semibold h-16 bg-indigo-600 text-white hover:bg-indigo-700 px-10 text-xl rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto"
            >
              Start Building Your AI Company
            </Link>
            <a 
              href="#how-it-works"
              className="inline-flex items-center justify-center font-semibold h-16 border-2 border-slate-200 text-slate-700 px-10 text-xl rounded-full bg-white hover:bg-slate-50 hover:border-slate-300 transition-all w-full sm:w-auto"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 border-t border-slate-200 bg-slate-50">
        <p>© {new Date().getFullYear()} ItWield. AI to operate your business automatically 24/7.</p>
      </footer>
    </div>
  );
}
