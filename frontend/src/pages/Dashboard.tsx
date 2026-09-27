import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Activity, AlertCircle, ArrowRight, Sparkles, Play } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<any>(null);
  const [ceoBriefingData, setCeoBriefingData] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [operatingState, setOperatingState] = useState<string>('READY');
  const [nextAction, setNextAction] = useState<any>(null);
  const [commandInput, setCommandInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOperating, setIsOperating] = useState(false);

  // Approvals
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s poll to keep it light
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      const ws = wsRes.data.find((w: any) => w.status === 'operating' || w.status === 'ACTIVE');
      if (!ws) return setIsLoading(false);
      setWorkspace(ws);

      const [goalsRes, ccRes, opStateRes, nextActionRes] = await Promise.all([
        api.get(`/workspaces/${ws.id}/goals`),
        api.get(`/command-center/${ws.id}?limit=10`),
        api.get(`/workspaces/${ws.id}/company/operating-state`),
        api.get(`/workspaces/${ws.id}/company/next-action`)
      ]);

      setGoals(goalsRes.data);
      setCeoBriefingData(ccRes.data.ceoBriefing || { unreadAlerts: [], latestDecisions: [], approvalHistory: [] });
      setOperatingState(opStateRes.data.operating_state);
      setNextAction(nextActionRes.data);
      setIsLoading(false);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApproval || !workspace) return;
    setApprovalSubmitting(true);
    try {
      await api.post(`/workspaces/${workspace.id}/approvals/${selectedApproval.id}/approve`);
      setSelectedApproval(null);
      loadData();
    } catch(e) {
      alert("Failed to approve");
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const handleCommand = () => {
    if (!commandInput.trim()) return;
    navigate('/missions', { state: { initialCommand: commandInput } });
  };
  
  const handleRunCoo = async () => {
    if (!workspace) return;
    setIsOperating(true);
    try {
      await api.post(`/workspaces/${workspace.id}/company/operate`);
      loadData();
    } catch (e) {
      console.error("Failed to run COO:", e);
    } finally {
      setIsOperating(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  const pendingApprovals = ceoBriefingData?.unreadAlerts?.filter((a: any) => a.type === 'APPROVAL_REQUIRED') || [];
  const importantAlerts = ceoBriefingData?.unreadAlerts?.filter((a: any) => a.severity === 'high' || a.severity === 'critical') || [];
  const whileAway = ceoBriefingData?.latestDecisions?.slice(0, 5) || [];
  const activeGoals = goals.filter(g => g.status === 'ACTIVE');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      
      {/* HEADER & COMMAND */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Founder Control Center</h1>
          <div className="mt-2 flex items-center gap-3">
             <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center ${operatingState === 'OPERATING' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                {operatingState === 'OPERATING' ? <><Activity className="w-3 h-3 mr-1 animate-pulse" /> AI COMPANY OPERATING</> : 'AI COMPANY READY'}
             </div>
             <Button variant="outline" size="sm" onClick={handleRunCoo} disabled={isOperating || operatingState === 'OPERATING'}>
               {isOperating || operatingState === 'OPERATING' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
               Run Operating Cycle
             </Button>
          </div>
        </div>
        <div className="w-full md:w-96 flex relative">
          <input 
            type="text" 
            className="w-full pl-4 pr-12 py-3 border-2 border-slate-200 rounded-full text-sm focus:border-indigo-500 outline-none shadow-sm"
            placeholder="Command your AI company..."
            value={commandInput}
            onChange={e => setCommandInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCommand()}
          />
          <button onClick={handleCommand} className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-indigo-700 transition-colors">
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. EMERGENCIES / ATTENTION REQUIRED */}
      {(pendingApprovals.length > 0 || importantAlerts.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Attention Required</h2>
          <div className="grid gap-3">
            {pendingApprovals.map((pa: any, i: number) => (
              <Card key={i} className="border-l-4 border-l-amber-500 bg-amber-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <div>
                      <h3 className="font-bold text-amber-900">{pa.title || 'Action Requires Approval'}</h3>
                      <p className="text-sm text-amber-700">{pa.message || 'An executive has proposed an action that exceeds their current authority limit.'}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100" onClick={() => setSelectedApproval(pa)}>Review</Button>
                </CardContent>
              </Card>
            ))}
            {importantAlerts.map((ia: any, i: number) => (
              <Card key={i} className="border-l-4 border-l-red-500 bg-red-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="font-bold text-red-900">{ia.title || 'System Alert'}</h3>
                    <p className="text-sm text-red-700">{ia.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* NEXT ACTION RECOMMENDATION */}
      {nextAction && (
        <Card className="border-indigo-100 bg-indigo-50/50 shadow-sm">
           <CardContent className="p-5">
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">COO</div>
                <div>
                   <h3 className="font-bold text-indigo-900 mb-1">What should we do next?</h3>
                   <div className="text-indigo-800 font-medium bg-white px-3 py-2 rounded-md border border-indigo-100 mb-3 shadow-sm">
                     {nextAction.next_action}
                   </div>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-slate-500 font-bold uppercase tracking-wider text-xs block mb-1">Why</span><span className="text-slate-700">{nextAction.why}</span></div>
                      <div><span className="text-slate-500 font-bold uppercase tracking-wider text-xs block mb-1">Authority Needed</span><span className="text-slate-700">{nextAction.authority}</span></div>
                   </div>
                </div>
             </div>
           </CardContent>
        </Card>
      )}

      {/* 2. WHILE YOU WERE AWAY */}
      {whileAway.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">While you were away</h2>
          <Card className="shadow-sm border-slate-200">
            <div className="divide-y divide-slate-100">
              {whileAway.map((d: any, i: number) => (
                <div key={i} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {d.agent_id ? d.agent_id.substring(0,2).toUpperCase() : 'AI'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{d.event_name.replace(/_/g, ' ')}</h4>
                    <p className="text-slate-600 text-sm mt-1">{d.conclusion || d.proposed_action}</p>
                    <div className="text-xs text-slate-400 mt-2">{new Date(d.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 3. IMPORTANT BUSINESS OUTCOMES */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Business Outcomes</h2>
          <Link to="/missions" className="text-sm text-indigo-600 font-medium flex items-center hover:underline">View All <ArrowRight className="w-4 h-4 ml-1" /></Link>
        </div>
        
        {activeGoals.length === 0 ? (
          <Card className="border-dashed shadow-none bg-slate-50">
            <CardContent className="p-8 text-center text-slate-500">
              No active business outcomes. Use the command box above to assign an objective.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map(g => (
              <Link key={g.id} to={`/goals/${g.id}`}>
                <Card className="hover:border-indigo-300 transition-colors cursor-pointer h-full border-slate-200 shadow-sm">
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">ACTIVE</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg">{g.objective}</h3>
                    </div>
                    <div className="mt-4 text-sm text-slate-500 border-t border-slate-100 pt-3">
                      {g.target_metric ? `Target: ${g.target || ''} ${g.target_metric}` : 'Investigation in progress'}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* MODAL FOR APPROVALS */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">Review Required</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Action</label>
                <div className="font-medium">{selectedApproval.title}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Reason</label>
                <div className="text-sm bg-slate-50 p-3 rounded text-slate-700">{selectedApproval.message || selectedApproval.reason}</div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setSelectedApproval(null)} disabled={approvalSubmitting}>Cancel</Button>
              <Button onClick={handleApprove} disabled={approvalSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                {approvalSubmitting ? 'Approving...' : 'Approve & Execute'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

