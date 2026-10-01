import { Check, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function LandingPricing() {
  const { user } = useAuth();
  const ctaDest = user ? "/dashboard" : "/login";

  return (
    <div className="bg-[#0F172A]">
      
      {/* PRICING HEADER */}
      <section id="pricing" className="scroll-mt-24 pt-24 px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Choose how you want to build your AI company.</h2>
          <p className="text-xl text-slate-400">Start free. Scale your AI workforce as your operating needs grow.</p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          
          {/* FREE */}
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl p-6 flex flex-col hover:border-slate-500 transition-colors">
            <h3 className="text-lg font-bold text-white mb-2">FREE</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-extrabold text-white">$0 aria-hidden="true">?</span>
              <span className="text-sm text-slate-400">/ forever aria-hidden="true">?</span>
            </div>
            <p className="text-xs text-slate-400 mb-6 min-h-[40px]">Learning, testing, and your first AI company.</p>
            <Link to={ctaDest} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold text-center rounded-xl mb-6 transition-colors">Start Free</Link>
            <ul className="space-y-3 text-sm text-slate-300 mt-auto">
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> 1 workspace</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Up to 5 AI workers</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> 200 credits (one-time)</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> 1 seat</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Core AI company capabilities</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Multi-agent / multi-worker operation where supported</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Basic execution capabilities</li>
            </ul>
          </div>

          {/* SOLO BUILDER */}
          <div className="bg-[#1E293B] border-2 border-indigo-500/50 rounded-3xl p-6 flex flex-col relative shadow-xl shadow-indigo-900/20 hover:border-indigo-400 transition-colors lg:-mt-4 lg:mb-4">
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">Popular</div>
            <h3 className="text-lg font-bold text-white mb-2">SOLO BUILDER</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-extrabold text-white">$49 aria-hidden="true">?</span>
              <span className="text-sm text-slate-400">/ month aria-hidden="true">?</span>
            </div>
            <p className="text-xs text-slate-400 mb-6 min-h-[40px]">Builders shipping real workloads.</p>
            <Link to={ctaDest} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-600 text-white text-sm font-bold text-center rounded-xl mb-6 transition-colors">Start with Solo</Link>
            <ul className="space-y-3 text-sm text-slate-300 mt-auto">
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Unlimited workspaces</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Up to 25 AI workers</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> 5,000 credits / month</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Additional credits at $10 / 1,000</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> 1 seat</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Production operation</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Multi-agent / multi-worker workflows</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> API access</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Evaluation / preview capabilities</li>
            </ul>
          </div>

          {/* PROFESSIONAL */}
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl p-6 flex flex-col hover:border-slate-500 transition-colors">
            <h3 className="text-lg font-bold text-white mb-2">PROFESSIONAL</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-extrabold text-white">$199 aria-hidden="true">?</span>
              <span className="text-sm text-slate-400">/ month aria-hidden="true">?</span>
            </div>
            <p className="text-xs text-slate-400 mb-6 min-h-[40px]">For teams operating AI across more serious workloads.</p>
            <Link to={ctaDest} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold text-center rounded-xl mb-6 transition-colors">Start with Professional</Link>
            <ul className="space-y-3 text-sm text-slate-300 mt-auto">
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Unlimited workspaces</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Up to 25 AI workers</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> 10,000 credits / month</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Additional credits at $10 / 1,000</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> 2 seats</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Additional seats at $10/mo</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Production operation</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Multi-worker workflows</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> API access</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Advanced company capabilities</li>
            </ul>
          </div>

          {/* BUSINESS */}
          <div className="bg-[#1E293B] border-2 border-indigo-500/30 rounded-3xl p-6 flex flex-col relative hover:border-indigo-400 transition-colors">
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">Popular</div>
            <h3 className="text-lg font-bold text-white mb-2">BUSINESS</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-extrabold text-white">$299 aria-hidden="true">?</span>
              <span className="text-sm text-slate-400">/ month aria-hidden="true">?</span>
            </div>
            <p className="text-xs text-slate-400 mb-6 min-h-[40px]">For larger operating workloads.</p>
            <Link to={ctaDest} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold text-center rounded-xl mb-6 transition-colors">Start with Business</Link>
            <ul className="space-y-3 text-sm text-slate-300 mt-auto">
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Unlimited workspaces</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Unlimited AI workers</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> 20,000 credits / month</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Additional credits at $10 / 1,000</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> 2 seats</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Additional seats at $10/mo</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Production operation</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Multi-worker workflows</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> API access</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Priority support & SLA</li>
            </ul>
          </div>

          {/* ENTERPRISE */}
          <div className="bg-[#111827] border border-slate-700 rounded-3xl p-6 flex flex-col hover:border-slate-500 transition-colors">
            <h3 className="text-lg font-bold text-white mb-2">ENTERPRISE</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-extrabold text-white">Custom aria-hidden="true">?</span>
            </div>
            <p className="text-xs text-slate-400 mb-6 min-h-[40px]">Scoped to your company.</p>
            <a href="#enterprise" className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold text-center rounded-xl mb-6 transition-colors">Talk to Sales</a>
            <ul className="space-y-3 text-sm text-slate-400 mt-auto">
              <li className="flex gap-2"><Check className="w-4 h-4 text-slate-400 shrink-0" /> Unlimited workspaces</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-slate-400 shrink-0" /> Unlimited AI workers</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-slate-400 shrink-0" /> Unlimited seats</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-slate-400 shrink-0" /> Custom usage volume</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-slate-400 shrink-0" /> Custom pricing</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-slate-400 shrink-0" /> Advanced security controls</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-slate-400 shrink-0" /> Enterprise support</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-slate-400 shrink-0" /> Custom operating requirements</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-slate-400 shrink-0" /> Deployment support</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-slate-400 shrink-0" /> Enterprise SLA where applicable</li>
            </ul>
          </div>

        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="px-6 pb-24 border-b border-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8">Every plan, side by side.</h2>
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-4 border-b border-slate-700 text-sm font-bold text-slate-400 w-1/4">Features</th>
                  <th className="p-4 border-b border-slate-700 text-sm font-bold text-white">Free</th>
                  <th className="p-4 border-b border-slate-700 text-sm font-bold text-white">Solo Builder</th>
                  <th className="p-4 border-b border-slate-700 text-sm font-bold text-white">Professional</th>
                  <th className="p-4 border-b border-slate-700 text-sm font-bold text-white">Business</th>
                  <th className="p-4 border-b border-slate-700 text-sm font-bold text-white">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-300">
                {[
                  { label: "Workspaces", values: ["1", "Unlimited", "Unlimited", "Unlimited", "Unlimited"] },
                  { label: "AI workers", values: ["Up to 5", "Up to 25", "Up to 25", "Unlimited", "Unlimited"] },
                  { label: "Credits", values: ["200 (one-time)", "5,000 / mo", "10,000 / mo", "20,000 / mo", "Custom"] },
                  { label: "Additional credits", values: ["—", "$10 / 1,000", "$10 / 1,000", "$10 / 1,000", "Custom"] },
                  { label: "Seats", values: ["1", "1", "2", "2", "Unlimited"] },
                  { label: "Production operation", values: ["—", "✓", "✓", "✓", "✓"] },
                  { label: "Multi-worker workflows", values: ["Basic", "✓", "✓", "✓", "✓"] },
                  { label: "API access", values: ["—", "✓", "✓", "✓", "✓"] },
                  { label: "Company Brain", values: ["Basic", "✓", "Advanced", "Advanced", "Custom isolated"] },
                  { label: "Founder Control Center", values: ["✓", "✓", "✓", "✓", "✓"] },
                  { label: "Outcome verification", values: ["✓", "✓", "✓", "✓", "✓"] },
                  { label: "Controlled autonomy", values: ["✓", "✓", "✓", "✓", "✓"] },
                  { label: "Priority support", values: ["—", "—", "—", "✓", "Enterprise"] },
                  { label: "SLA", values: ["—", "—", "—", "✓", "Enterprise"] },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 border-b border-slate-800 font-medium">{row.label}</td>
                    {row.values.map((val, j) => (
                      <td key={j} className="p-4 border-b border-slate-800 text-slate-400">
                        {val === "✓" ? <Check className="w-4 h-4 text-indigo-400" /> : val === "—" ? <Minus className="w-4 h-4 text-slate-400" /> : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* COST EXAMPLES & CREDITS */}
      <section className="py-24 px-6 border-b border-slate-800 bg-[#0B1121]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">See what your plan looks like in practice.</h2>
            <div className="space-y-4">
              <div className="bg-[#1E293B] border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">STARTER COMPANY</div>
                  <div className="text-sm text-slate-300">Free plan • Small AI workforce</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 mb-1">Total:</div>
                  <div className="text-lg font-bold text-white">$0 / month</div>
                </div>
              </div>
              <div className="bg-[#1E293B] border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">GROWING COMPANY</div>
                  <div className="text-sm text-slate-300">Solo Builder • 25 AI workers</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 mb-1">Total:</div>
                  <div className="text-lg font-bold text-white">$49 / month</div>
                </div>
              </div>
              <div className="bg-[#1E293B] border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">OPERATING TEAM</div>
                  <div className="text-sm text-slate-300">Professional • 25 AI workers</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 mb-1">Total:</div>
                  <div className="text-lg font-bold text-white">$199 / month</div>
                </div>
              </div>
              <div className="bg-[#1E293B] border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">LARGER OPERATION</div>
                  <div className="text-sm text-slate-300">Business • Unlimited AI workers</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 mb-1">Total:</div>
                  <div className="text-lg font-bold text-white">$299 / month</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">One simple usage system.</h2>
            <div className="prose prose-invert prose-slate">
              <p className="text-slate-400">
                ItWield uses a simple credit system for execution limits. 
              </p>
              <p className="text-slate-400">
                Usage limits and capacity may apply according to your plan. You don't need to worry about complex per-token accounting or hidden AI model fees. Your plan's credits map directly to the operating capabilities and capacity of your AI company.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ENTERPRISE / TRUST */}
      <section id="enterprise" className="scroll-mt-24 py-24 px-6 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight">AI operation your company can control.</h2>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["Tenant isolation", "Authorization", "Risk controls", "Auditability", "Company Brain isolation", "Controlled execution", "Approvals", "Verification", "Emergency controls"].map((tag, i) => (
              <span key={i} className="bg-slate-800 border border-slate-700 text-slate-300 text-sm px-4 py-2 rounded-full">{tag} aria-hidden="true">?</span>
            ))}
          </div>
          <Link to={ctaDest} className="inline-flex items-center justify-center font-bold h-12 bg-white text-slate-900 px-8 rounded-full hover:bg-slate-200 transition-colors">
            Contact / Start Free
          </Link>
        </div>
      </section>

    </div>
  );
}