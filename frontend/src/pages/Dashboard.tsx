import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Activity, AlertCircle, Play, Pause, Square, MessageSquare, Target, Zap, Shield, Briefcase } from 'lucide-react';


export default function Dashboard() {
  const navigate = useNavigate();
  
  const [workspace, setWorkspace] = useState<any>(null);
  
  // Data states
  const [ccData, setCcData] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [operatingState, setOperatingState] = useState<string>('READY');
  
  const [agents, setAgents] = useState<any[]>([]);
  const [_nextAction, setNextAction] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  

  // Chat states
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s poll to keep it light
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const loadData = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      const ws = wsRes.data.find((w: any) => w.status === 'operating' || w.status === 'active' || w.status === 'ACTIVE');
      if (!ws) {
        setIsLoading(false);
        return;
      }
      setWorkspace(ws);

      const [goalsRes, ccRes, opStateRes, nextActionRes, agentsRes] = await Promise.all([
        api.get(`/workspaces/${ws.id}/goals`).catch(() => ({ data: [] })),
        api.get(`/workspaces/${ws.id}/command-center?limit=10`).catch(() => ({ data: null })),
        api.get(`/workspaces/${ws.id}/company/operating-state`).catch(() => ({ data: { operating_state: 'READY' } })),
        api.get(`/workspaces/${ws.id}/company/next-action`).catch(() => ({ data: null })),
        api.get(`/agents/workspace/${ws.id}`).catch(() => ({ data: [] }))
      ]);

      setGoals(goalsRes.data);
      setCcData(ccRes.data);
      setOperatingState(opStateRes.data.operating_state || ws.status.toUpperCase());
      setNextAction(nextActionRes.data?.nextAction || nextActionRes.data);
      setAgents(agentsRes.data || []);
      setIsLoading(false);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
      setIsLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    if (!workspace) return;
    try {
      await api.post(`/workspaces/${workspace.id}/approvals/${approvalId}/approve`);
      loadData();
    } catch(e) {
      alert("Failed to approve");
    }
  };

  const handleControl = async (action: 'pause' | 'resume' | 'stop') => {
    if (!workspace) return;
    try {
      const stateMap = { pause: "PAUSED", resume: "OPERATING", stop: "STOPPED" }; await api.post(`/workspaces/${workspace.id}/control/state`, { state: stateMap[action] });
      loadData();
    } catch (e) {
      console.error(`Failed to ${action}:`, e);
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !workspace) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatting(true);
    
    try {
      // Find the CEO agent to route the message to
      const ceo = agents.find((a: any) => a.name.includes('CEO'));
      if (ceo) {
        const res = await api.post(`/agents/${ceo.id}/chat`, { message: userMsg, conversationId: 'dashboard-main' });
        setChatHistory(prev => [...prev, { role: 'ai', text: res.data.response || res.data.reply || "No response received." }]);
      } else {
        // Fallback if CEO not found
        setTimeout(() => {
          setChatHistory(prev => [...prev, { role: 'ai', text: 'CEO agent is currently unavailable to respond.' }]);
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Connection error while contacting AI Company.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  if (!workspace) return (
    <div className="flex h-screen items-center justify-center flex-col gap-4 text-slate-500">
      <AlertCircle className="w-12 h-12" />
      <p>No active workspace found. Please complete onboarding.</p>
      <Link to="/onboarding"><Button>Go to Onboarding</Button></Link>
    </div>
  );

  const pendingApprovals = ccData?.approvals || [];
  const importantAlerts = ccData?.ownerAttention?.filter((a: any) => a.severity === 'high' || a.severity === 'critical') || [];
  const whileAway = ccData?.decisionTimeline?.slice(0, 5) || [];
  const activeGoals = goals.filter(g => g.status === 'ACTIVE' || g.status === 'active');
  const primaryGoal = activeGoals[0];

  
  

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. GLOBAL OPERATING STATUS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Good morning, Founder</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-slate-600">Your AI company is</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              operatingState === 'OPERATING' ? 'bg-emerald-100 text-emerald-700' :
              operatingState === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {operatingState}
            </span>
            {ccData?.autonomy?.last_cycle && operatingState === 'OPERATING' && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-500 animate-pulse" /> Running since {new Date(ccData.autonomy.last_cycle).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {operatingState !== 'OPERATING' && (
            <Button onClick={() => handleControl('resume')} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
              <Play className="w-4 h-4 mr-2" /> Resume
            </Button>
          )}
          {operatingState === 'OPERATING' && (
            <Button onClick={() => handleControl('pause')} variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
              <Pause className="w-4 h-4 mr-2" /> Pause
            </Button>
          )}
          <Button onClick={() => handleControl('stop')} variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">
            <Square className="w-4 h-4 mr-2" /> Stop
          </Button>
        </div>
      </div>

      {/* FOUNDER ATTENTION */}
      {(pendingApprovals.length > 0 || importantAlerts.length > 0) && (
        <Card className="border-rose-200 shadow-sm bg-rose-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-rose-600 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Founder Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApprovals.map((a: any) => (
              <div key={a.id} className="bg-white p-4 rounded-lg border border-rose-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-900">{a.action}</p>
                    <p className="text-slate-600 text-sm mt-1">{a.reason}</p>
                  </div>
                  <Button size="sm" onClick={() => handleApprove(a.id)} className="bg-rose-600 hover:bg-rose-700">Approve</Button>
                </div>
              </div>
            ))}
            {importantAlerts.map((a: any, i: number) => (
              <div key={i} className="bg-white p-4 rounded-lg border border-rose-100 shadow-sm flex gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">{a.title}</p>
                  <p className="text-slate-600 text-sm mt-1">{a.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 2. ACTIVE BUSINESS OUTCOME */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" /> Active Business Outcome
          </CardTitle>
          {primaryGoal && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              IN PROGRESS
            </span>
          )}
        </div>
        <CardContent className="p-6 bg-white">
          {primaryGoal ? (
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">{primaryGoal.objective}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target</div>
                  <div className="text-3xl font-black text-slate-900">{primaryGoal.target || 'N/A'}</div>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full"></div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Verified</div>
                  <div className="text-3xl font-black text-indigo-600">{primaryGoal.current_metric || 0}</div>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gap</div>
                  <div className="text-3xl font-black text-rose-600">{primaryGoal.target ? primaryGoal.target - (primaryGoal.current_metric || 0) : 'N/A'}</div>
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1">
                    <Activity className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">What is happening right now?</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {ccData?.ceo_decisions?.[0]?.assessment || 'The Business Outcome Engine is orchestrating worker agents to achieve this objective.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">No active business outcomes.</p>
              <Link to="/missions"><Button variant="outline">Assign an objective</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. WHAT SHOULD MY COMPANY DO NEXT? */}
      <Card className="border-indigo-100 shadow-sm bg-indigo-50/30 overflow-hidden">
        <CardHeader className="pb-3 border-b border-indigo-100/50 bg-white">
          <CardTitle className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" /> What should my company do next?
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{ccData?.next_action?.recommendation || 'Continue autonomous operation'}</h3>
              <p className="text-sm text-slate-600 mt-2 max-w-2xl">{ccData?.next_action?.reasoning || 'The company is operating normally and progressing towards active outcomes.'}</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button variant="outline" className="bg-white">Review</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700">Approve Next Action</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. AI EXECUTIVE TEAM */}
      <div className="space-y-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-slate-900">AI Executive Team</h2>
          <p className="text-sm text-slate-500">Your AI leadership team, working together to operate the company.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {(ccData?.executives || []).map((exec: any) => {
            const roleColors: Record<string, string> = {
              'CEO': 'bg-slate-900 text-white',
              'COO': 'bg-blue-600 text-white',
              'CMO': 'bg-purple-600 text-white',
              'CTO': 'bg-emerald-600 text-white',
              'CFO': 'bg-amber-600 text-white'
            };
            const roleTitles: Record<string, string> = {
              'CEO': 'Chief Executive Officer',
              'COO': 'Chief Operating Officer',
              'CMO': 'Chief Marketing Officer',
              'CTO': 'Chief Technology Officer',
              'CFO': 'Chief Financial Officer'
            };
            return (
              <Card key={exec.role} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden">
                <div className={`p-4 ${roleColors[exec.role] || 'bg-slate-800 text-white'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-lg tracking-tight">{exec.role}</h3>
                      <p className="text-xs opacity-80 font-medium">{roleTitles[exec.role] || exec.role}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Responsibility</p>
                    <p className="text-sm text-slate-800 mb-4 line-clamp-2">{exec.focus}</p>
                    
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Status</p>
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-2 h-2 rounded-full ${
                        exec.status === 'WORKING' ? 'bg-indigo-500 animate-pulse' :
                        exec.status === 'READY' ? 'bg-emerald-500' :
                        exec.status === 'PAUSED' ? 'bg-amber-500' :
                        exec.status === 'BLOCKED' ? 'bg-rose-500' : 'bg-slate-400'
                      }`} />
                      <span className="text-sm font-medium capitalize">{exec.status?.toLowerCase() || 'Ready'}</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      if (exec.id) navigate(`/agents/${exec.id}/chat`);
                    }}
                    disabled={!exec.id}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Chat with {exec.role}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 6. HEALTH & ACTIVITY */}
        <div className="space-y-8">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" /> Company Health
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {ccData?.health ? Object.entries(ccData.health).map(([key, status]: any) => (
                  <div key={key} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-slate-50">
                    <span className="capitalize text-slate-700 font-medium">{key}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      status === 'HEALTHY' ? 'bg-emerald-100 text-emerald-700' :
                      status === 'ATTENTION' ? 'bg-amber-100 text-amber-700' :
                      status === 'DEGRADED' ? 'bg-rose-100 text-rose-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{status}</span>
                  </div>
                )) : <p className="text-sm text-slate-500 text-center py-4">Loading health metrics...</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm h-[250px] flex flex-col">
            <CardHeader className="pb-3 border-b shrink-0">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-y-auto flex-1">
              <div className="space-y-5 border-l-2 border-slate-100 ml-2 pl-4 py-1">
                {whileAway.length > 0 ? whileAway.map((d: any, i: number) => (
                  <div key={i} className="relative text-sm">
                    <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-400 ring-4 ring-white"></div>
                    <p className="font-semibold text-slate-900">{d.action || d.reason}</p>
                    <p className="text-slate-500 text-xs mt-1">{d.outcome}</p>
                  </div>
                )) : <p className="text-sm text-slate-400 text-center py-4">No recent activity recorded.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
