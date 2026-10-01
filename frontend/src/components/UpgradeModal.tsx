import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleTrigger = () => setIsOpen(true);
    window.addEventListener('trigger_upgrade', handleTrigger);
    
    // Also auto-trigger if an API call returns 402 or credits reach 0
    const handleCredits = (e: any) => {
      if (typeof e.detail === 'number' && e.detail <= 0) {
        setIsOpen(true);
      }
    };
    window.addEventListener('credits_updated', handleCredits);

    return () => {
      window.removeEventListener('trigger_upgrade', handleTrigger);
      window.removeEventListener('credits_updated', handleCredits);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border shadow-2xl rounded-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden relative">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center border-b">
          <h2 className="text-3xl font-bold mb-2">Upgrade your digital workforce</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Your AI executives have paused operations because your workspace ran out of compute credits. Upgrade to continue scaling.
          </p>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Solo */}
            <div className="border rounded-xl p-6 flex flex-col bg-background/50 hover:border-primary/50 transition-colors">
              <h3 className="font-bold text-lg mb-1">Solo</h3>
              <div className="text-3xl font-bold mb-4">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <p className="text-sm text-muted-foreground mb-6">For single founders starting automation.</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> 5,000 Compute Credits</li>
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> CEO & COO Agents</li>
              </ul>
              <button className="w-full py-2 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-colors">
                Select Solo
              </button>
            </div>

            {/* Pro */}
            <div className="border-2 border-primary rounded-xl p-6 flex flex-col bg-primary/5 relative">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full">
                Popular
              </div>
              <h3 className="font-bold text-lg mb-1">Pro</h3>
              <div className="text-3xl font-bold mb-4">$199<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <p className="text-sm text-muted-foreground mb-6">For teams automating standard processes.</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> 10,000 Compute Credits</li>
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> Full Executive Board</li>
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> CRM Integrations</li>
              </ul>
              <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-lg">
                Select Pro
              </button>
            </div>

            {/* Business */}
            <div className="border rounded-xl p-6 flex flex-col bg-background/50 hover:border-primary/50 transition-colors">
              <h3 className="font-bold text-lg mb-1">Business</h3>
              <div className="text-3xl font-bold mb-4">$299<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <p className="text-sm text-muted-foreground mb-6">For scaling high-volume automation.</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> 25,000 Compute Credits</li>
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> Advanced Company Brain</li>
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> Parallel Workflows</li>
              </ul>
              <button className="w-full py-2 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-colors">
                Select Business
              </button>
            </div>

            {/* Custom */}
            <div className="border rounded-xl p-6 flex flex-col bg-background/50 hover:border-primary/50 transition-colors">
              <h3 className="font-bold text-lg mb-1">Custom</h3>
              <div className="text-3xl font-bold mb-4">Enterprise</div>
              <p className="text-sm text-muted-foreground mb-6">For dedicated infrastructure and limits.</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> Unlimited Compute</li>
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> Private Instance</li>
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> Dedicated Account Manager</li>
              </ul>
              <button className="w-full py-2 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-colors border border-dashed border-muted-foreground/50">
                Contact Sales
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
