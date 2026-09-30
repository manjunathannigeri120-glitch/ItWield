import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Target, Activity, ChevronRight, Loader2, Sparkles } from 'lucide-react';

export function Missions() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [workspace, setWorkspace] = useState<any>(null);

  const [commandInput, setCommandInput] = useState(location.state?.initialCommand || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [intakeMode, setIntakeMode] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [intakeMessage, setIntakeMessage] = useState('');
  const [directAnswer, setDirectAnswer] = useState<string | null>(null);
  const [contextAnswers, setContextAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/workspaces').then(res => {
      const ws = res.data.find((w: any) => w.status === 'operating' || w.status === 'active' || w.status === 'ACTIVE');
      if (ws) {
        setWorkspace(ws);
        if (location.state?.initialCommand) {
          handleCommandSubmit(undefined, ws.id, location.state.initialCommand);
        }
      }
    });
  }, [location.state?.initialCommand]);

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals', workspace?.id],
    queryFn: async () => {
      if (!workspace) return [];
      const res = await api.get(`/workspaces/${workspace.id}/goals`);
      return res.data;
    },
    enabled: !!workspace
  });

  const handleCommandSubmit = async (e?: React.FormEvent, wsId?: string, cmdInput?: string) => {
    if (e) e.preventDefault();
    const activeWorkspaceId = wsId || workspace?.id;
    const activeCommand = cmdInput || commandInput;
    if (!activeCommand.trim() || !activeWorkspaceId) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(`/workspaces/${activeWorkspaceId}/goals`, { 
        input: activeCommand,
        context_answers: contextAnswers
      });
      
      if (res.data.is_direct_response) {
          setDirectAnswer(res.data.answer);
          setIsSubmitting(false);
          setCommandInput('');
          return;
        }

        if (res.data.requires_context) {
        setIntakeMode(true);
        setMissingFields(res.data.missing_fields || []);
        setIntakeMessage(res.data.message || 'I need more context to begin.');
        setIsSubmitting(false);
        return;
      }

      // Success
      setIntakeMode(false);
      setCommandInput('');
      setContextAnswers({});
      queryClient.invalidateQueries({ queryKey: ['goals', activeWorkspaceId] });
      if (res.data.goal?.id) {
        navigate(`/goals/${res.data.goal.id}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to submit command');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Missions & Goals</h1>
          <p className="text-muted-foreground mt-2">Give ItWield an objective or investigation to execute.</p>
        </div>
      </div>

      {directAnswer && (
          <Card className="mb-8 shadow-sm border-2 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <h3 className="font-bold text-green-900 mb-2">AI Assistant Response</h3>
              <div className="text-green-800 whitespace-pre-wrap">{directAnswer}</div>
              <Button className="mt-4 bg-green-600 hover:bg-green-700" onClick={() => setDirectAnswer(null)}>Clear</Button>
            </CardContent>
          </Card>
        )}

        {!intakeMode ? (
        <Card className="mb-8 shadow-sm border-2 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <input 
                type="text" 
                className="flex-1 border-2 border-slate-300 rounded-lg p-4 text-lg focus:border-indigo-500 outline-none" 
                placeholder="e.g. Find what's stopping my growth, Get me 20 customers, Reduce operating costs..." 
                value={commandInput}
                onChange={e => setCommandInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCommandSubmit()}
              />
              <Button onClick={() => handleCommandSubmit()} disabled={isSubmitting || !commandInput.trim()} className="h-auto px-8 bg-indigo-600 hover:bg-indigo-700 text-white text-lg">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 mr-2"/> Command</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 shadow-lg border-2 border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">Clarification Needed</CardTitle>
            <CardDescription className="text-amber-700 font-medium">{intakeMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {missingFields.map(field => (
              <div key={field}>
                <label className="block text-sm font-bold text-amber-900 mb-1 uppercase tracking-wide">{field.replace(/_/g, ' ')}</label>
                <input 
                  type="text" 
                  className="w-full border-2 border-amber-200 rounded-lg p-3 outline-none focus:border-amber-500 bg-white" 
                  placeholder={`Provide ${field.replace(/_/g, ' ')}`}
                  value={contextAnswers[field] || ''}
                  onChange={e => setContextAnswers({...contextAnswers, [field]: e.target.value})}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
             <Button variant="ghost" onClick={() => { setIntakeMode(false); setContextAnswers({}); }} className="text-amber-700 hover:bg-amber-200">Cancel</Button>
             <Button onClick={() => handleCommandSubmit()} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white">
               {isSubmitting ? 'Processing...' : 'Continue'}
             </Button>
          </CardFooter>
        </Card>
      )}

      {(!goals || goals.length === 0) ? (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-200">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No active goals</h3>
          <p className="text-slate-500">Submit a command above to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals?.map((g: any) => (
            <Link key={g.id} to={`/goals/${g.id}`}>
              <Card className="hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer bg-white">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${g.status === 'ACTIVE' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{g.objective}</h3>
                      <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <span className="font-semibold uppercase text-xs">{g.status}</span>
                        {g.target_metric && (
                          <>
                            <span>�</span>
                            <span>Target: {g.target || 'Auto'} {g.target_metric}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-400" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


