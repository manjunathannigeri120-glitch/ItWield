import React, { useEffect, useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const PLANS = {
  solo: { USD: 49, INR: 4067, AED: 179, EUR: 45, credits: 5000 },
  professional: { USD: 199, INR: 16517, AED: 730, EUR: 183, credits: 10000 },
  business: { USD: 299, INR: 24817, AED: 1097, EUR: 275, credits: 20000 },
};

const SYMBOLS: any = { USD: '$', INR: '?', AED: '?.?', EUR: '€' };

export function UpgradeModal() {
  const [currency, setCurrency] = useState<'USD' | 'INR' | 'AED' | 'EUR'>('USD');
  const [isOpen, setIsOpen] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    const handleTrigger = () => setIsOpen(true);
    window.addEventListener('trigger_upgrade', handleTrigger);
    return () => window.removeEventListener('trigger_upgrade', handleTrigger);
  }, []);

  const handleUpgrade = async (planId: keyof typeof PLANS) => {
    try {
      setLoadingPlan(planId);
      const wsRes = await api.get('/workspaces');
      if (!wsRes.data || wsRes.data.length === 0) {
        alert("Workspace not found.");
        return;
      }
      const wsId = wsRes.data[0].id;
      const credits = PLANS[planId].credits;

      // 1. Create Subscription
      const orderRes = await api.post('/payments/create-subscription', {
        planId,
        workspaceId: wsId,
        currency
      });

      const { subscriptionId } = orderRes.data;

      // 2. Open Razorpay Checkout for Subscriptions
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        name: "ItWield",
        description: `Upgrade to ${planId.toUpperCase()} Plan (${currency})`,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment on success
            await api.post('/payments/verify-subscription', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              workspaceId: wsId
            });
            
            setIsOpen(false);
            alert(`Payment successful! ${credits.toLocaleString()} credits added to your workspace. Your subscription is now active.`);
            window.location.reload();
          } catch (err) {
            console.error(err);
            alert("Payment verification failed. Please contact support.");
          }
        },
        theme: {
          color: "#0057FF"
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any){
        alert("Payment Failed: " + response.error.description);
      });
      rzp1.open();

    } catch (error: any) {
      console.error(error);
      alert("Payment failed: " + (error.response?.data?.error || error.message || "Please try again later."));
    } finally {
      setLoadingPlan(null);
    }
  };

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

        <div className="p-8 text-center border-b flex flex-col items-center relative">
          
          <div className="absolute right-8 top-8 flex items-center gap-2">
            <label className="text-sm font-semibold text-muted-foreground">Currency:</label>
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value as any)}
              className="bg-secondary text-secondary-foreground text-sm rounded-md px-2 py-1 border border-border"
            >
              <option value="USD">???? USD ($)</option>
              <option value="INR">???? INR (?) - UPI Available</option>
              <option value="AED">???? AED</option>
              <option value="EUR">???? EUR (€)</option>
            </select>
          </div>

          <h2 className="text-3xl font-bold mb-2">Upgrade your digital workforce</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Select a plan to start your automated monthly subscription. Cancel anytime.
          </p>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Solo */}
            <div className="border rounded-xl p-6 flex flex-col bg-background/50 hover:border-primary/50 transition-colors">
              <h3 className="font-bold text-lg mb-1">Solo Builder</h3>
              <div className="text-3xl font-bold mb-4">{SYMBOLS[currency]}{PLANS.solo[currency]}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <p className="text-sm text-muted-foreground mb-6">For single founders starting automation.</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> 5,000 Compute Credits</li>
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> CEO & COO Agents</li>
              </ul>
              <button 
                disabled={loadingPlan !== null}
                onClick={() => handleUpgrade('solo')}
                className="w-full py-2 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-colors flex justify-center items-center gap-2"
              >
                {loadingPlan === 'solo' && <Loader2 className="w-4 h-4 animate-spin" />}
                Select Solo
              </button>
            </div>

            {/* Pro */}
            <div className="border-2 border-primary rounded-xl p-6 flex flex-col bg-primary/5 relative">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full">
                Popular
              </div>
              <h3 className="font-bold text-lg mb-1">Professional</h3>
              <div className="text-3xl font-bold mb-4">{SYMBOLS[currency]}{PLANS.professional[currency]}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <p className="text-sm text-muted-foreground mb-6">For teams automating standard processes.</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> 10,000 Compute Credits</li>
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> Full Executive Board</li>
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> CRM Integrations</li>
              </ul>
              <button 
                disabled={loadingPlan !== null}
                onClick={() => handleUpgrade('professional')}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-lg flex justify-center items-center gap-2"
              >
                {loadingPlan === 'professional' && <Loader2 className="w-4 h-4 animate-spin" />}
                Select Pro
              </button>
            </div>

            {/* Business */}
            <div className="border rounded-xl p-6 flex flex-col bg-background/50 hover:border-primary/50 transition-colors">
              <h3 className="font-bold text-lg mb-1">Business</h3>
              <div className="text-3xl font-bold mb-4">{SYMBOLS[currency]}{PLANS.business[currency]}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <p className="text-sm text-muted-foreground mb-6">For scaling high-volume automation.</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> 20,000 Compute Credits</li>
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> Advanced Company Brain</li>
                <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> Parallel Workflows</li>
              </ul>
              <button 
                disabled={loadingPlan !== null}
                onClick={() => handleUpgrade('business')}
                className="w-full py-2 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-colors flex justify-center items-center gap-2"
              >
                {loadingPlan === 'business' && <Loader2 className="w-4 h-4 animate-spin" />}
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
              <button onClick={() => window.location.href = 'mailto:supportitwield@gmail.com?subject=Enterprise%20Plan%20Inquiry'} className="w-full py-2 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-colors border border-dashed border-muted-foreground/50">
                Contact Sales
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
