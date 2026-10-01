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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-100 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 z-50">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Terminal className="w-4 h-4 text-[#111827]" />
          </div>
          <span className="text-xl font-bold text-[#111827] tracking-tight">ItWield</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center space-x-1">
          {/* PRODUCT */}
          <div className="group relative">
            <button className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-[#4B5563] hover:text-[#111827] transition-colors rounded-lg hover:bg-slate-50">
              <span>Product</span>
              <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[800px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out translate-y-2 group-hover:translate-y-0">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden p-8 flex gap-8">
                <div className="w-1/2">
                  <h3 className="text-xs font-bold text-[#6B7280] mb-4">AI Executives</h3>
                  <div className="space-y-4">
                    {[
                      { icon: Briefcase, color: "text-[#0057FF]", bg: "bg-indigo-600/10", title: "CEO", desc: "Company strategy and priorities." },
                      { icon: Settings, color: "text-blue-400", bg: "bg-blue-500/10", title: "COO", desc: "Operations and coordination." },
                      { icon: TrendingUp, color: "text-rose-400", bg: "bg-rose-500/10", title: "CMO", desc: "Customers and growth." },
                      { icon: Terminal, color: "text-white", bg: "bg-slate-700", title: "CTO", desc: "Technology and systems." },
                      { icon: PieChart, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "CFO", desc: "Financial health and cost context." },
                    ].map((item, i) => (
                      <a href="#executive-team" key={i} className="flex items-start gap-4 p-2 -m-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#111827]">{item.title}</div>
                          <div className="text-xs text-[#6B7280]">{item.desc}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
                <div className="w-1/2 flex flex-col gap-8">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-4">Operating System</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <a href="#company-brain" className="text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">Company Brain</a>
                      <a href="#business-outcome" className="text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">Business Outcome Engine</a>
                      <a href="#executive-team" className="text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">AI Workforce</a>
                      <a href="#control-center" className="text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">Founder Control Center</a>
                      <a href="#verification" className="text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">Outcome Verification</a>
                      <a href="#how-it-works" className="text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">Autonomous Loop</a>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-4">Execution</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <a href="#connections" className="text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">Connections</a>
                      <a href="#trust" className="text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">Authorized Actions</a>
                      <a href="#activity" className="text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">Execution History</a>
                      <a href="#activity" className="text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">Activity Timeline</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SOLUTIONS */}
          <div className="group relative">
            <button className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-[#4B5563] hover:text-[#111827] transition-colors rounded-lg hover:bg-slate-50">
              <span>Solutions</span>
              <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out translate-y-2 group-hover:translate-y-0">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden p-8">
                <div className="mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-[#111827]">Give your AI company an objective.</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { title: "Get More Customers", desc: '"Get me 20 new customers."', icon: Target, color: "text-rose-400" },
                    { title: "Reduce Costs", desc: '"Find unnecessary operating costs."', icon: PieChart, color: "text-emerald-400" },
                    { title: "Operate Efficiently", desc: '"Find what is slowing my company down."', icon: Zap, color: "text-amber-400" },
                    { title: "Monitor the Business", desc: '"Tell me what needs attention."', icon: Activity, color: "text-blue-400" },
                    { title: "Fix Problems", desc: '"Investigate and resolve authorized technical issues."', icon: Shield, color: "text-[#0057FF]" },
                    { title: "Keep Operating", desc: '"Continue operating toward my company goals."', icon: Database, color: "text-[#6B7280]" }
                  ].map((sol, i) => (
                    <div key={i} className="flex gap-4">
                      <sol.icon className={`w-5 h-5 shrink-0 ${sol.color}`} />
                      <div>
                        <div className="text-sm font-bold text-[#111827] mb-1">{sol.title}</div>
                        <div className="text-xs text-[#6B7280] font-mono">{sol.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ENTERPRISE */}
          <div className="group relative">
            <button className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-[#4B5563] hover:text-[#111827] transition-colors rounded-lg hover:bg-slate-50">
              <span>Enterprise</span>
              <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[400px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out translate-y-2 group-hover:translate-y-0">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl p-6">
                <h3 className="text-sm font-bold text-[#111827] mb-2">Controlled AI operation</h3>
                <p className="text-xs text-[#6B7280] mb-6">For companies that need visibility, authorization, security, and accountability.</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <span className="text-sm font-medium text-[#4B5563]">Security</span>
                  <span className="text-sm font-medium text-[#4B5563]">Tenant isolation</span>
                  <span className="text-sm font-medium text-[#4B5563]">Role-based authority</span>
                  <span className="text-sm font-medium text-[#4B5563]">Audit trails</span>
                  <span className="text-sm font-medium text-[#4B5563]">Approvals</span>
                  <span className="text-sm font-medium text-[#4B5563]">Verification</span>
                </div>
                <a href="#enterprise" className="block w-full text-center bg-[#0057FF] hover:bg-[#004DE6] hover:text-white text-white text-sm font-bold py-2 rounded-lg transition-colors">Explore Enterprise</a>
              </div>
            </div>
          </div>

          {/* RESOURCES */}
          <div className="group relative">
            <button className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-[#4B5563] hover:text-[#111827] transition-colors rounded-lg hover:bg-slate-50">
              <span>Resources</span>
              <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[300px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out translate-y-2 group-hover:translate-y-0">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl p-6">
                <div className="space-y-3">
                  <a href="#how-it-works" className="block text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">How It Works</a>
                  <a href="#executive-team" className="block text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">AI Executive Team</a>
                  <a href="#business-outcome" className="block text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">Business Outcomes</a>
                  <a href="#trust" className="block text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">Trust & Security</a>
                  <a href="#pricing" className="block text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">Pricing</a>
                  <a href="#faq" className="block text-sm font-medium text-[#4B5563] hover:text-[#0057FF]">FAQ</a>
                </div>
              </div>
            </div>
          </div>

          <a href="#pricing" className="px-4 py-2 text-sm font-medium text-[#4B5563] hover:text-[#111827] transition-colors rounded-lg hover:bg-slate-50">Pricing</a>
        </nav>

        {/* Desktop Auth */}
        <div className="hidden lg:flex items-center space-x-4">
          <Link to="/login" className="text-sm font-medium text-[#4B5563] hover:text-[#111827] transition-colors">Sign In</Link>
          <Link to={ctaDest} className="text-sm font-bold bg-[#0057FF] text-white shadow-lg shadow-[#0057FF]/20 px-5 py-2.5 rounded-full hover:bg-[#004DE6] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">Start Free</Link>
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden text-[#4B5563] hover:text-[#111827] p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col space-y-4">
            <div className="text-xs font-bold text-[#6B7280] uppercase tracking-widest">Navigation</div>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-[#111827]">How It Works</a>
            <a href="#executive-team" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-[#111827]">Executives</a>
            <a href="#trust" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-[#111827]">Trust & Security</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-[#111827]">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-[#111827]">FAQ</a>
            
            <div className="h-px w-full bg-[#0057FF] my-4" />
            
            <Link to="/login" className="text-center w-full py-3 text-[#111827] font-bold rounded-lg border border-slate-100">Sign In</Link>
            <Link to={ctaDest} className="text-center w-full py-3 bg-[#0057FF] text-white shadow-lg shadow-[#0057FF]/20 font-bold rounded-lg">Start Free</Link>
          </div>
        </div>
      )}
    </header>
  );
}