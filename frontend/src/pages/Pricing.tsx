import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

export function Pricing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Simple pricing for autonomous operations</h1>
        <p className="text-lg text-slate-600">Choose the plan that fits your business goals.</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Solo Builder</h2>
          <p className="text-slate-500 mb-6">Perfect for founders ready to automate.</p>
          <div className="text-5xl font-extrabold text-slate-900 mb-8">$299<span className="text-lg text-slate-500 font-normal">/mo</span></div>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-slate-700">
              <Check className="w-5 h-5 text-green-500" />
              <span>Up to <strong>25 AI Agents</strong></span>
            </li>
            <li className="flex items-center gap-3 text-slate-700">
              <Check className="w-5 h-5 text-green-500" />
              <span>Unlimited Business Missions</span>
            </li>
            <li className="flex items-center gap-3 text-slate-700">
              <Check className="w-5 h-5 text-green-500" />
              <span>Full AI Executive Suite</span>
            </li>
            <li className="flex items-center gap-3 text-slate-700">
              <Check className="w-5 h-5 text-green-500" />
              <span>Real-time Command Center</span>
            </li>
          </ul>

          <Button 
            size="lg" 
            className="w-full bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => navigate("/login")}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
