import React, { useEffect, useState } from 'react';
import { X, Check, Loader2, ArrowLeft, CreditCard, Smartphone } from 'lucide-react';
import { api } from '@/lib/api';

const PLANS = {
  solo: { USD: 49, INR: 4067, AED: 179, EUR: 45, credits: 5000, name: 'Solo Builder' },
  professional: { USD: 199, INR: 16517, AED: 730, EUR: 183, credits: 10000, name: 'Professional' },
  business: { USD: 299, INR: 24817, AED: 1097, EUR: 275, credits: 20000, name: 'Business' },
};

const SYMBOLS: any = { USD: '$', INR: '₹', AED: 'د.إ', EUR: '€' };

export function UpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLANS | null>(null);
  const [loadingCurrency, setLoadingCurrency] = useState<string | null>(null);

  useEffect(() => {
    const handleTrigger = () => {
      setStep(1);
      setSelectedPlan(null);
      setIsOpen(true);
    };
    window.addEventListener('trigger_upgrade', handleTrigger);
    return () => window.removeEventListener('trigger_upgrade', handleTrigger);
  }, []);

  const handleSelectPlan = (planId: keyof typeof PLANS) => {
    setSelectedPlan(planId);
    setStep(2);
  };

  const handleProcessPayment = async (currency: 'USD' | 'INR' | 'AED' | 'EUR') => {
    if (!selectedPlan) return;
    
    try {
      setLoadingCurrency(currency);
      const wsRes = await api.get('/workspaces');
      if (!wsRes.data || wsRes.data.length === 0) {
        alert("Workspace not found.");
        return;
      }
      const wsId = wsRes.data[0].id;
      const credits = PLANS[selectedPlan].credits;

      const orderRes = await api.post('/payments/create-subscription', {
        planId: selectedPlan,
        workspaceId: wsId,
        currency
      });

      const { subscriptionId } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        name: "ItWield",
        description: `Upgrade to ${PLANS[selectedPlan].name} (${currency})`,
        handler: async function (response: any) {
          try {
            await api.post('/payments/verify-subscription', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              workspaceId: wsId
            });
            
            setIsOpen(false);
            alert(`Payment successful! ${credits.toLocaleString()} credits added. Subscription active.`);
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
      setLoadingCurrency(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
      <div className="bg-card border shadow-2xl rounded-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden relative">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 1 && (
          <>
            <div className="p-8 text-center border-b relative">
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
                  <div className="text-3xl font-bold mb-4">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  <p className="text-sm text-muted-foreground mb-6">For single founders starting automation.</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> 5,000 Compute Credits</li>
                    <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> CEO & COO Agents</li>
                  </ul>
                  <button 
                    onClick={() => handleSelectPlan('solo')}
                    className="w-full py-2 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-colors"
                  >
                    Select Solo
                  </button>
                </div>

                {/* Pro */}
                <div className="border-2 border-primary rounded-xl p-6 flex flex-col bg-primary/5 relative">
                  <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full">
                    Popular
                  </div>
                  <h3 className="font-bold text-lg mb-1">Professional</h3>
                  <div className="text-3xl font-bold mb-4">$199<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  <p className="text-sm text-muted-foreground mb-6">For teams automating standard processes.</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> 10,000 Compute Credits</li>
                    <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> Full Executive Board</li>
                    <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> CRM Integrations</li>
                  </ul>
                  <button 
                    onClick={() => handleSelectPlan('professional')}
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-lg"
                  >
                    Select Pro
                  </button>
                </div>

                {/* Business */}
                <div className="border rounded-xl p-6 flex flex-col bg-background/50 hover:border-primary/50 transition-colors">
                  <h3 className="font-bold text-lg mb-1">Business</h3>
                  <div className="text-3xl font-bold mb-4">$299<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  <p className="text-sm text-muted-foreground mb-6">For scaling high-volume automation.</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> 20,000 Compute Credits</li>
                    <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> Advanced Company Brain</li>
                    <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /> Parallel Workflows</li>
                  </ul>
                  <button 
                    onClick={() => handleSelectPlan('business')}
                    className="w-full py-2 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-colors"
                  >
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
          </>
        )}

        {step === 2 && selectedPlan && (
          <div className="flex flex-col h-full bg-slate-50/50">
            <div className="p-6 border-b flex items-center">
              <button 
                onClick={() => setStep(1)}
                className="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Select Currency & Payment Method</h2>
                <p className="text-sm text-slate-500">You are upgrading to the <span className="font-bold text-indigo-600">{PLANS[selectedPlan].name}</span> plan</p>
              </div>
            </div>
            
            <div className="p-8 max-w-2xl mx-auto w-full grid grid-cols-1 gap-4 overflow-y-auto">
              
              <button 
                disabled={loadingCurrency !== null}
                onClick={() => handleProcessPayment('INR')}
                className="flex items-center p-6 border-2 border-indigo-100 rounded-2xl bg-white hover:border-indigo-600 hover:shadow-md transition-all text-left relative group overflow-hidden"
              >
                {loadingCurrency === 'INR' && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mr-4 text-indigo-600 shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900">Pay with UPI / Indian Rupee</h3>
                  <p className="text-sm text-slate-500">Google Pay, PhonePe, Paytm, and Indian Cards</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">₹{PLANS[selectedPlan].INR}</div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Per Month</div>
                </div>
              </button>

              <button 
                disabled={loadingCurrency !== null}
                onClick={() => handleProcessPayment('USD')}
                className="flex items-center p-6 border-2 border-slate-200 rounded-2xl bg-white hover:border-slate-800 hover:shadow-md transition-all text-left relative group overflow-hidden"
              >
                {loadingCurrency === 'USD' && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4 text-slate-700 shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900">Pay with USD ($)</h3>
                  <p className="text-sm text-slate-500">International Credit & Debit Cards</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">${PLANS[selectedPlan].USD}</div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Per Month</div>
                </div>
              </button>

              <button 
                disabled={loadingCurrency !== null}
                onClick={() => handleProcessPayment('AED')}
                className="flex items-center p-6 border-2 border-slate-200 rounded-2xl bg-white hover:border-slate-800 hover:shadow-md transition-all text-left relative group overflow-hidden"
              >
                {loadingCurrency === 'AED' && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4 text-slate-700 shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900">Pay with AED (د.إ)</h3>
                  <p className="text-sm text-slate-500">International Credit & Debit Cards</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">د.إ {PLANS[selectedPlan].AED}</div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Per Month</div>
                </div>
              </button>

              <button 
                disabled={loadingCurrency !== null}
                onClick={() => handleProcessPayment('EUR')}
                className="flex items-center p-6 border-2 border-slate-200 rounded-2xl bg-white hover:border-slate-800 hover:shadow-md transition-all text-left relative group overflow-hidden"
              >
                {loadingCurrency === 'EUR' && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4 text-slate-700 shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900">Pay with Euro (€)</h3>
                  <p className="text-sm text-slate-500">International Credit & Debit Cards</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">€{PLANS[selectedPlan].EUR}</div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Per Month</div>
                </div>
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}