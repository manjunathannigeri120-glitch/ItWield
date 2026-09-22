import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pendingWsId, setPendingWsId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    business_model: '',
    short_description: '',
    target_customer: '',
    primary_market: '',
    goals: '',
    secondary_goals: '',
    biggest_problems: '',
    competitors: ''
  });

  const [aiPreferences, setAiPreferences] = useState({
    monitor_health: true,
    investigate_issues: true,
    run_approved_workflows: true,
    analyze_competitors: true,
    create_proposals: true,
    execute_low_risk: false,
    require_approval_production: true,
    require_approval_financial: true
  });

  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    // Fetch pending workspace
    api.get('/workspaces').then(res => {
      const pending = res.data.find((w: any) => w.status === 'pending_activation');
      if (pending) setPendingWsId(pending.id);
    });
  }, []);

  const handleNext = async () => {
    if (step === 3) {
      setLoading(true);
      try {
        let wsId = pendingWsId;
        if (!wsId) {
          const createRes = await api.post('/workspaces', { name: formData.name });
          wsId = createRes.data.id;
          setPendingWsId(wsId);
        }

        const res = await api.post(`/workspaces/${wsId}/analyze-company`, {
          ...formData,
          ai_preferences: aiPreferences
        });
        setAnalysis(res.data);
        setStep(4);
      } catch (err) {
        console.error(err);
        alert('Failed to analyze company');
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      if (!pendingWsId) throw new Error("No pending workspace");
      await api.post(`/workspaces/${pendingWsId}/activate`, {});
      setStep(5); // Success state
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to activate AI company');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Welcome to ItWield</CardTitle>
              <CardDescription>Tell us about your company so your AI CEO can understand the business.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label>Company Name</label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label>Website</label>
                <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label>Industry</label>
                  <Input value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label>Business Model</label>
                  <Input value={formData.business_model} onChange={e => setFormData({ ...formData, business_model: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label>Short Description</label>
                <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={formData.short_description} onChange={e => setFormData({ ...formData, short_description: e.target.value })} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleNext} disabled={!formData.name}>Next: Market & Goals</Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Market & Goals</CardTitle>
              <CardDescription>What are you trying to achieve?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label>Target Customer</label>
                  <Input value={formData.target_customer} onChange={e => setFormData({ ...formData, target_customer: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label>Primary Market</label>
                  <Input value={formData.primary_market} onChange={e => setFormData({ ...formData, primary_market: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label>Primary Business Goal</label>
                <Input value={formData.goals} onChange={e => setFormData({ ...formData, goals: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label>Current Biggest Problems</label>
                <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={formData.biggest_problems} onChange={e => setFormData({ ...formData, biggest_problems: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label>Competitors (comma separated)</label>
                <Input value={formData.competitors} onChange={e => setFormData({ ...formData, competitors: e.target.value })} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleNext}>Next: AI Permissions</Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>AI Permissions</CardTitle>
              <CardDescription>Set boundaries for your AI workforce. Pricing actions are permanently disabled.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">AI can automatically:</h4>
                <div className="flex items-center space-x-2"><input type="checkbox" checked={aiPreferences.monitor_health} onChange={(e: any) => setAiPreferences({ ...aiPreferences, monitor_health: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" /> <label>Monitor application health</label></div>
                <div className="flex items-center space-x-2"><input type="checkbox" checked={aiPreferences.investigate_issues} onChange={(e: any) => setAiPreferences({ ...aiPreferences, investigate_issues: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" /> <label>Investigate non-critical issues</label></div>
                <div className="flex items-center space-x-2"><input type="checkbox" checked={aiPreferences.create_proposals} onChange={(e: any) => setAiPreferences({ ...aiPreferences, create_proposals: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" /> <label>Create improvement proposals</label></div>
                <div className="flex items-center space-x-2"><input type="checkbox" checked={aiPreferences.execute_low_risk} onChange={(e: any) => setAiPreferences({ ...aiPreferences, execute_low_risk: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" /> <label>Execute approved low-risk improvements</label></div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-amber-700">Requires owner approval:</h4>
                <div className="flex items-center space-x-2"><input type="checkbox" checked disabled className="w-4 h-4 text-gray-400 rounded border-gray-300" /> <label className="text-gray-500">Production deployment</label></div>
                <div className="flex items-center space-x-2"><input type="checkbox" checked disabled className="w-4 h-4 text-gray-400 rounded border-gray-300" /> <label className="text-gray-500">Financial actions</label></div>
                <div className="flex items-center space-x-2"><input type="checkbox" checked disabled className="w-4 h-4 text-gray-400 rounded border-gray-300" /> <label className="text-gray-500">Major product changes</label></div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>Back</Button>
              <Button onClick={handleNext} disabled={loading}>
                {loading ? 'CEO is analyzing company...' : 'Analyze Company'}
              </Button>
            </CardFooter>
          </>
        )}

        {step === 4 && analysis && (
          <>
            <CardHeader>
              <CardTitle>Your AI company is ready.</CardTitle>
              <CardDescription>Review the CEO's initial operating plan and proposed workforce.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto">
              <div>
                <h3 className="font-bold text-lg mb-2">CEO Operating Plan</h3>
                <ul className="space-y-1 list-disc pl-5">
                  {analysis.plan.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Proposed Executives</h3>
                <div className="grid grid-cols-2 gap-4">
                  {analysis.workforce.executives.map((ex: any, i: number) => (
                    <div key={i} className="border p-3 rounded-md bg-white">
                      <div className="font-semibold text-blue-600">{ex.role}</div>
                      <div className="text-sm text-gray-600">{ex.objective}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Proposed Workers</h3>
                <div className="grid grid-cols-2 gap-4">
                  {analysis.workforce.workers.map((w: any, i: number) => (
                    <div key={i} className="border p-3 rounded-md bg-white">
                      <div className="font-semibold text-indigo-600">{w.role}</div>
                      <div className="text-sm text-gray-600">{w.objective}</div>
                      <div className="text-xs text-gray-400 mt-1">Reports to: {w.manager}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={() => setStep(3)} disabled={loading}>Back</Button>
              <Button onClick={handleActivate} className="bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? 'Activating...' : 'Activate AI Company'}
              </Button>
            </CardFooter>
          </>
        )}

        {step === 5 && (
          <CardContent className="py-20 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-green-600 text-2xl font-bold">✓</span>
            </div>
            <h2 className="text-2xl font-bold">AI CEO: OPERATING</h2>
            <p className="text-gray-600">Your AI company is now active. Routing to dashboard...</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
