import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ChevronDown, Menu, X, Terminal, Briefcase, Settings, TrendingUp, PieChart, Shield, Zap, Database, Activity, Target } from 'lucide-react';

export function LandingNav() {
  const { user } = useAuth();
  const ctaDest = user ? "/dashboard" : "/login";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0B1121]/90 backdrop-blur-md border-b border-slate-800 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 z-50">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ItWield aria-hidden="true">?</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center space-x-1">
          {/* PRODUCT */}
          <div className="group relative">
            <button className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
              <span>Product aria-hidden="true">?</span>
              <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[800px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out translate-y-2 group-hover:translate-y-0">
              <div className="bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-8 flex gap-8">
                <div className="w-1/2">
                  <h3 className="text-xs font-bold text-slate-400 mb-4">AI Executives</h3>
                  <div className="space-y-4">
                    {[
                      { icon: Briefcase, color: "text-indigo-400", bg: "bg-indigo-600/10", title: "CEO", desc: "Company strategy and priorities." },
                      { icon: Settings, color: "text-blue-400", bg: "bg-blue-500/10", title: "COO", desc: "Operations and coordination." },
                      { icon: TrendingUp, color: "text-rose-400", bg: "bg-rose-500/10", title: "CMO", desc: "Customers and growth." },
                      { icon: Terminal, color: "text-slate-300", bg: "bg-slate-700/50", title: "CTO", desc: "Technology and systems." },
                      { icon: PieChart, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "CFO", desc: "Financial health and cost context." },
                    ].map((item, i) => (
                      <a href="#executive-team" key={i} className="flex items-start gap-4 p-2 -m-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-200">{item.title}</div>
                          <div className="text-xs text-slate-400">{item.desc}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
                <div className="w-1/2 flex flex-col gap-8">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Operating System</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <a href="#company-brain" className="text-sm font-medium text-slate-300 hover:text-indigo-400">Company Brain</a>
                      <a href="#business-outcome" className="text-sm font-medium text-slate-300 hover:text-indigo-400">Business Outcome Engine</a>
                      <a href="#executive-team" className="text-sm font-medium text-slate-300 hover:text-indigo-400">AI Workforce</a>
                      <a href="#control-center" className="text-sm font-medium text-slate-300 hover:text-indigo-400">Founder Control Center</a>
                      <a href="#verification" className="text-sm font-medium text-slate-300 hover:text-indigo-400">Outcome Verification</a>
                      <a href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-indigo-400">Autonomous Loop</a>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Execution</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <a href="#connections" className="text-sm font-medium text-slate-300 hover:text-indigo-400">Connections</a>
                      <a href="#trust" className="text-sm font-medium text-slate-300 hover:text-indigo-400">Authorized Actions</a>
                      <a href="#activity" className="text-sm font-medium text-slate-300 hover:text-indigo-400">Execution History</a>
                      <a href="#activity" className="text-sm font-medium text-slate-300 hover:text-indigo-400">Activity Timeline</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SOLUTIONS */}
          <div className="group relative">
            <button className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
              <span>Solutions aria-hidden="true">?</span>
              <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out translate-y-2 group-hover:translate-y-0">
              <div className="bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-8">
                <div className="mb-6 border-b border-slate-800 pb-4">
                  <h3 className="text-lg font-bold text-white">Give your AI company an objective.</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { title: "Get More Customers", desc: '"Get me 20 new customers."', icon: Target, color: "text-rose-400" },
                    { title: "Reduce Costs", desc: '"Find unnecessary operating costs."', icon: PieChart, color: "text-emerald-400" },
                    { title: "Operate Efficiently", desc: '"Find what is slowing my company down."', icon: Zap, color: "text-amber-400" },
                    { title: "Monitor the Business", desc: '"Tell me what needs attention."', icon: Activity, color: "text-blue-400" },
                    { title: "Fix Problems", desc: '"Investigate and resolve authorized technical issues."', icon: Shield, color: "text-indigo-400" },
                    { title: "Keep Operating", desc: '"Continue operating toward my company goals."', icon: Database, color: "text-slate-400" }
                  ].map((sol, i) => (
                    <div key={i} className="flex gap-4">
                      <sol.icon className={`w-5 h-5 shrink-0 ${sol.color}`} />
                      <div>
                        <div className="text-sm font-bold text-slate-200 mb-1">{sol.title}</div>
                        <div className="text-xs text-slate-400 font-mono">{sol.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ENTERPRISE */}
          <div className="group relative">
            <button className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
              <span>Enterprise aria-hidden="true">?</span>
              <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[400px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out translate-y-2 group-hover:translate-y-0">
              <div className="bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-2">Controlled AI operation</h3>
                <p className="text-xs text-slate-400 mb-6">For companies that need visibility, authorization, security, and accountability.</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <span className="text-sm font-medium text-slate-300">Security aria-hidden="true">?</span>
                  <span className="text-sm font-medium text-slate-300">Tenant isolation aria-hidden="true">?</span>
                  <span className="text-sm font-medium text-slate-300">Role-based authority aria-hidden="true">?</span>
                  <span className="text-sm font-medium text-slate-300">Audit trails aria-hidden="true">?</span>
                  <span className="text-sm font-medium text-slate-300">Approvals aria-hidden="true">?</span>
                  <span className="text-sm font-medium text-slate-300">Verification aria-hidden="true">?</span>
                </div>
                <a href="#enterprise" className="block w-full text-center bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold py-2 rounded-lg transition-colors">Explore Enterprise</a>
              </div>
            </div>
          </div>

          {/* RESOURCES */}
          <div className="group relative">
            <button className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
              <span>Resources aria-hidden="true">?</span>
              <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[300px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out translate-y-2 group-hover:translate-y-0">
              <div className="bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl p-6">
                <div className="space-y-3">
                  <a href="#how-it-works" className="block text-sm font-medium text-slate-300 hover:text-indigo-400">How It Works</a>
                  <a href="#executive-team" className="block text-sm font-medium text-slate-300 hover:text-indigo-400">AI Executive Team</a>
                  <a href="#business-outcome" className="block text-sm font-medium text-slate-300 hover:text-indigo-400">Business Outcomes</a>
                  <a href="#trust" className="block text-sm font-medium text-slate-300 hover:text-indigo-400">Trust & Security</a>
                  <a href="#pricing" className="block text-sm font-medium text-slate-300 hover:text-indigo-400">Pricing</a>
                  <a href="#faq" className="block text-sm font-medium text-slate-300 hover:text-indigo-400">FAQ</a>
                </div>
              </div>
            </div>
          </div>

          <a href="#pricing" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">Pricing</a>
        </nav>

        {/* Desktop Auth */}
        <div className="hidden lg:flex items-center space-x-4">
          <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign In</Link>
          <Link to={ctaDest} className="text-sm font-bold bg-white text-slate-900 px-5 py-2.5 rounded-full hover:bg-slate-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">Start Free</Link>
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden text-slate-300 hover:text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0B1121] border-b border-slate-800 p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Navigation</div>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-white">How It Works</a>
            <a href="#executive-team" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-white">Executives</a>
            <a href="#trust" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-white">Trust & Security</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-white">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-white">FAQ</a>
            
            <div className="h-px w-full bg-slate-800 my-4" />
            
            <Link to="/login" className="text-center w-full py-3 text-white font-bold rounded-lg border border-slate-700">Sign In</Link>
            <Link to={ctaDest} className="text-center w-full py-3 bg-white text-slate-900 font-bold rounded-lg">Start Free</Link>
          </div>
        </div>
      )}
    </header>
  );
}