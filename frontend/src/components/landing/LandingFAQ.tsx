import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ChevronDown, Terminal } from 'lucide-react';

export function LandingFAQ() {
  const { user } = useAuth();
  const ctaDest = user ? "/dashboard" : "/login";
  
  const faqs = [
    {
      q: "What is ItWield?",
      a: "ItWield is an AI business operating platform. Instead of a standard chatbot or workflow builder, ItWield acts as a complete AI executive team that understands your goals, plans the work, delegates to AI workers, executes authorized actions, and verifies the results."
    },
    {
      q: "How is ItWield different from an AI chatbot?",
      a: "Chatbots wait for you to ask questions and return answers. ItWield operates continuously. You set a business objective, and ItWield coordinates its executive team to actually execute the work and verify outcomes without you needing to micromanage every step."
    },
    {
      q: "Do I need to build workflows?",
      a: "No. You provide a plain-language business objective (e.g., 'Get me 20 new customers'). ItWield's Business Outcome Engine handles the routing, planning, and execution dynamically."
    },
    {
      q: "What are AI workers?",
      a: "AI workers are specialized execution agents that perform specific tasks assigned by the executive team. They operate within strict authorization boundaries using connected tools and systems."
    },
    {
      q: "What do the CEO, COO, CMO, CTO, and CFO do?",
      a: "They form your AI executive team. The CEO aligns strategy, the COO coordinates operations, the CMO drives growth and customers, the CTO handles technical execution, and the CFO monitors financial context."
    },
    {
      q: "Can ItWield actually execute actions?",
      a: "Yes. Through Authorized Capabilities, ItWield can interact with external systems (like GitHub, Vercel, or Supabase) to perform real work, as long as you have granted the system permission."
    },
    {
      q: "How does ItWield verify results?",
      a: "Execution is not treated as success until it is verified. ItWield checks external authoritative evidence (e.g., records in a CRM or a successful deployment log) before considering an objective complete."
    },
    {
      q: "What happens when ItWield cannot safely complete something?",
      a: "ItWield is built for safe failure. If a task fails or requires authority beyond its permissions, it will investigate, attempt authorized fixes, and escalate to the Founder Control Center if it cannot proceed safely."
    },
    {
      q: "Can I pause my AI company?",
      a: "Yes. You have global Pause, Resume, and Stop controls in the Founder Control Center at all times."
    },
    {
      q: "How does ItWield protect company data?",
      a: "ItWield uses tenant isolation, ensuring your Company Brain and business data remain scoped to your workspace. We also employ prompt injection defense and strict role-based capability authorization."
    },
    {
      q: "How does pricing work?",
      a: "Pricing is based on your operating needs. We offer a Free tier to get started, and paid plans starting at $49/month for serious workloads. Paid plans provide more AI workers, credits, and advanced capabilities."
    },
    {
      q: "What are credits?",
      a: "Credits represent the execution capacity of your AI company. Usage limits apply according to your plan, and credits are consumed as your AI executives and workers operate."
    }
  ];

  return (
    <div className="bg-[#0F172A]">
      
      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 py-24 px-6 border-b border-slate-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center tracking-tight">Frequently asked questions.</h2>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6 bg-[#0B1121] text-center border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">Give your company a direction.</h2>
          <p className="text-xl md:text-2xl text-slate-400 mb-10">Let your AI company handle the operating work.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <Link to={ctaDest} className="inline-flex items-center justify-center font-bold h-14 bg-indigo-600 text-white hover:bg-indigo-600 px-10 text-lg rounded-full shadow-xl shadow-indigo-900/20 transition-all w-full sm:w-auto">
              Start Building Your AI Company
            </Link>
            <a href="#how-it-works" className="inline-flex items-center justify-center font-semibold h-14 border border-slate-700 text-white px-8 text-lg rounded-full bg-slate-800/50 hover:bg-slate-800 transition-all w-full sm:w-auto">
              See How It Works
            </a>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm font-bold tracking-widest text-slate-400 uppercase">
            <span>Start with a business objective.</span>
            <span className="hidden sm:inline">•</span>
            <span>Stay in control.</span>
            <span className="hidden sm:inline">•</span>
            <span>Scale when you're ready.</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-24 pb-12 px-6 bg-[#0F172A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            
            <div className="col-span-2">
              <Link to="/" className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">ItWield</span>
              </Link>
              <p className="text-slate-400 text-sm max-w-sm">
                AI that operates your business automatically 24/7.
              </p>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#executive-team" className="hover:text-indigo-400 transition-colors">AI Executives</a></li>
                <li><a href="#company-brain" className="hover:text-indigo-400 transition-colors">Company Brain</a></li>
                <li><a href="#business-outcome" className="hover:text-indigo-400 transition-colors">Business Outcomes</a></li>
                <li><a href="#executive-team" className="hover:text-indigo-400 transition-colors">AI Workforce</a></li>
                <li><a href="#control-center" className="hover:text-indigo-400 transition-colors">Founder Control Center</a></li>
                <li><a href="#connections" className="hover:text-indigo-400 transition-colors">Connections</a></li>
                <li><a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">SOLUTIONS</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Customer Growth</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Operations</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Technology</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Finance</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Business Goals</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">RESOURCES</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#how-it-works" className="hover:text-indigo-400 transition-colors">How It Works</a></li>
                <li><a href="#trust" className="hover:text-indigo-400 transition-colors">Trust & Security</a></li>
                <li><a href="#faq" className="hover:text-indigo-400 transition-colors">FAQ</a></li>
                <li><a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a></li>
              </ul>
            </div>

          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-slate-400 text-sm">
            <p>&copy; 2026 ItWield</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-slate-700 rounded-2xl bg-[#1E293B] overflow-hidden transition-colors hover:border-slate-600">
      <button 
        className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="font-bold text-white pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-slate-400 leading-relaxed text-sm">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}