import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  
  const [companyData, setCompanyData] = useState({
    name: '',
    industry: '',
    description: ''
  });

  const [goalInput, setGoalInput] = useState('');
  const [goalResult, setGoalResult] = useState<any>(null);

  const handleCreateCompany = async () => {
    if (!companyData.name) return setError('Company name is required');
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/workspaces', { ...companyData, status: 'operating' });
      setWorkspaceId(res.data.id);
      setStep(2);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!goalInput) return setError('Please enter a goal');
    if (!workspaceId) return setError('No active workspace');
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/goals`, { input: goalInput });
      setGoalResult(res.data);
      setStep(3); // Interpretation & Plan preview
    } catch (e: any) {
      setError(e.response?.data?.error || 'Your goal could not be interpreted. Please rephrase it.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ItWield</h1>
          <p className="text-slate-500 mt-2">AI Business Operating System</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {step === 1 && (
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6 rounded-t-xl">
              <CardTitle className="text-2xl">Welcome to ItWield.</CardTitle>
              <CardDescription className="text-base mt-2">What does your company do?</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                <Input value={companyData.name} onChange={e => setCompanyData({...companyData, name: e.target.value})} placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                <Input value={companyData.industry} onChange={e => setCompanyData({...companyData, industry: e.target.value})} placeholder="B2B SaaS" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-md p-3 text-sm focus:border-indigo-500 outline-none h-24"
                  value={companyData.description} 
                  onChange={e => setCompanyData({...companyData, description: e.target.value})} 
                  placeholder="We provide cloud infrastructure for small businesses..." 
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100 rounded-b-xl py-4 flex justify-end">
              <Button onClick={handleCreateCompany} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? 'Creating...' : 'Continue ->'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6 rounded-t-xl">
              <CardTitle className="text-2xl">Set Your Business Outcome</CardTitle>
              <CardDescription className="text-base mt-2">What do you want your business to achieve?</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6">
                <textarea 
                  className="w-full border-2 border-indigo-200 rounded-lg p-4 text-lg focus:border-indigo-500 outline-none h-32 bg-indigo-50/30"
                  value={goalInput} 
                  onChange={e => setGoalInput(e.target.value)} 
                  placeholder="e.g. Get me 20 customers in 60 days." 
                />
              </div>
              
              <div className="space-y-3">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Example Goals</div>
                <div className="flex flex-wrap gap-2">
                  {["Get me 20 customers", "Generate 100 qualified leads", "Double my revenue", "Find what's stopping my growth"].map((g, i) => (
                    <button key={i} onClick={() => setGoalInput(g)} className="text-sm bg-white border border-slate-300 rounded-full px-4 py-2 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-slate-700 text-left">
                      "{g}"
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100 rounded-b-xl py-4 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>Back</Button>
              <Button onClick={handleCreateGoal} disabled={loading || !goalInput} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {loading ? 'Interpreting Goal & Planning...' : 'Interpret Goal ->'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && goalResult && (
          <div className="space-y-6">
            <Card className="shadow-lg border-indigo-200">
              <CardHeader className="bg-indigo-50 border-b border-indigo-100 pb-4 rounded-t-xl">
                <CardTitle className="text-xl text-indigo-900">1. Interpretation & Data Requirements</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">How ItWield understands this:</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-semibold">Objective:</span> {goalResult.goal.objective}</div>
                      <div><span className="font-semibold">Target:</span> {goalResult.goal.target || 'N/A'} {goalResult.goal.target_metric}</div>
                      <div><span className="font-semibold">Timeframe:</span> {goalResult.goal.timeframe || 'None specified'}</div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Required Data</h4>
                    <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1 mb-4">
                      {goalResult.goal.required_data?.map((d: string, i: number) => <li key={i}>{d}</li>)}
                    </ul>
                    
                    {goalResult.goal.missing_data?.length > 0 ? (
                      <div className="bg-amber-100 text-amber-800 p-3 rounded text-xs">
                        <span className="font-bold block mb-1">DATA NOT CONNECTED</span>
                        Missing: {goalResult.goal.missing_data.join(', ')}. 
                        <br/>Execution can begin, but outcome measurement will be unavailable until connected.
                      </div>
                    ) : (
                      <div className="bg-green-100 text-green-800 p-3 rounded text-xs font-medium">
                        All required data sources are available.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 rounded-t-xl">
                <CardTitle className="text-xl">2. Initial Outcome Plan</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg mb-6 italic border border-slate-100">
                  {goalResult.plan?.plan?.strategy || 'Analyzing current state and executing baseline discovery...'}
                </div>
                
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Planned Missions</h4>
                <div className="space-y-3">
                  {goalResult.plan?.plan?.missions?.map((m: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg bg-white">
                      <div className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded text-xs font-bold shrink-0">{i+1}</div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{m.objective}</div>
                        <div className="text-xs text-slate-500 mt-1">Expected contribution: {m.contribution_metric}</div>
                        <div className="text-xs text-slate-400 mt-1">Requires approval for sensitive actions.</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t border-slate-100 rounded-b-xl py-4 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={handleFinish} className="bg-indigo-600 hover:bg-indigo-700 px-8 text-white">
                  Start Operating
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
