import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Building2, Target, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    localStorage.removeItem('sb-mock-session');
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Step 1: Basics
  const [basics, setBasics] = useState({
    name: '',
    website: '',
    industry: '',
    short_description: ''
  });

  // Step 2: Context
  const [context, setContext] = useState({
    target_customer: '',
    primary_market: '',
    goals: '',
    biggest_problems: ''
  });

  const handleCreateBasics = async () => {
    if (!basics.name.trim()) return setError('Company name is required');
    if (!basics.website.trim()) return setError('Website or App link is required');
    if (!basics.short_description.trim()) return setError('A brief description is required to help the AI understand your business');
    
    setError(null);
    setStep(2);
  };

  const handleFinishOnboarding = async () => {
    if (!context.target_customer.trim()) return setError('Target customer is required');
    if (!context.biggest_problems.trim()) return setError('Biggest problems are required to give the AI context');

    setLoading(true);
    setError(null);
    try {
      // 1. Create Workspace
      const wsRes = await api.post('/workspaces', { name: basics.name });
      const workspaceId = wsRes.data.id;

      // 2. Analyze Company (Saves to Company Memory)
      await api.post(`/workspaces/${workspaceId}/analyze-company`, {
        ...basics,
        ...context
      });

      // 3. Activate Workspace
      await api.post(`/workspaces/${workspaceId}/activate`);

      // 4. Go to Dashboard
      navigate('/dashboard');
    } catch (e: any) {
      if (e.message === 'Network Error') {
        setError('Unable to connect to the server. Please try again in a moment.');
      } else if (e.response?.status >= 500) {
        setError('Our servers are currently starting up or undergoing maintenance. Please wait 1-2 minutes and try again.');
      } else if (e.response?.status === 404) {
        setError('The setup service is temporarily unreachable. Please refresh your page to ensure you have the latest version.');
      } else {
        setError(e.response?.data?.error || 'Failed to complete setup. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Set Up Your AI Company</h1>
          <p className="text-slate-500 mt-2">Let ItWield learn about your business so it can operate autonomously.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100 font-medium">
            {error}
          </div>
        )}

        {step === 1 && (
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="bg-white border-b border-slate-100 pb-6 rounded-t-xl">
              <CardTitle className="text-2xl flex items-center gap-2"><Globe className="w-5 h-5 text-indigo-500"/> Company Basics</CardTitle>
              <CardDescription className="text-base mt-2">The fundamental details of your business.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5 bg-white">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name <span className="text-red-500 font-normal">*</span></label>
                <Input value={basics.name} onChange={e => setBasics({...basics, name: e.target.value})} placeholder="e.g. Acme Corp" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Website or App Link <span className="text-red-500 font-normal">*</span></label>
                <Input value={basics.website} onChange={e => setBasics({...basics, website: e.target.value})} placeholder="e.g. https://acmecorp.com or App Store link" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Industry <span className="text-slate-400 font-normal">(Optional)</span></label>
                <Input value={basics.industry} onChange={e => setBasics({...basics, industry: e.target.value})} placeholder="e.g. B2B SaaS" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Brief Description <span className="text-red-500 font-normal">*</span></label>
                <textarea 
                  className="w-full border border-slate-300 rounded-md p-3 text-sm focus:border-indigo-500 outline-none h-24"
                  value={basics.short_description} 
                  onChange={e => setBasics({...basics, short_description: e.target.value})} 
                  placeholder="What does your company do?" 
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100 rounded-b-xl py-4 flex justify-between">
              <Button variant="ghost" onClick={handleSignOut} className="text-slate-500 hover:text-slate-700">
                &lt;- Back to Login
              </Button>
              <Button onClick={handleCreateBasics} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Continue Setup -&gt;
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="bg-white border-b border-slate-100 pb-6 rounded-t-xl">
              <CardTitle className="text-2xl flex items-center gap-2"><Target className="w-5 h-5 text-indigo-500"/> Business Context</CardTitle>
              <CardDescription className="text-base mt-2">Help the AI understand your market and goals.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5 bg-white">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Customer <span className="text-red-500 font-normal">*</span></label>
                <Input value={context.target_customer} onChange={e => setContext({...context, target_customer: e.target.value})} placeholder="e.g. Mid-market marketing agencies" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Market / Geography <span className="text-slate-400 font-normal">(Optional)</span></label>
                <Input value={context.primary_market} onChange={e => setContext({...context, primary_market: e.target.value})} placeholder="e.g. United States, English speaking" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Goals <span className="text-slate-400 font-normal">(Optional)</span></label>
                <textarea 
                  className="w-full border border-slate-300 rounded-md p-3 text-sm focus:border-indigo-500 outline-none h-20"
                  value={context.goals} 
                  onChange={e => setContext({...context, goals: e.target.value})} 
                  placeholder="e.g. We want to reach $10k MRR this quarter." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Biggest Problems / Constraints <span className="text-red-500 font-normal">*</span></label>
                <textarea 
                  className="w-full border border-slate-300 rounded-md p-3 text-sm focus:border-indigo-500 outline-none h-20"
                  value={context.biggest_problems} 
                  onChange={e => setContext({...context, biggest_problems: e.target.value})} 
                  placeholder="e.g. High customer churn, expensive ad spend." 
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100 rounded-b-xl py-4 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>&lt;- Back</Button>
              <Button onClick={handleFinishOnboarding} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                {loading ? 'Finalizing Setup...' : 'Start Operating'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}


