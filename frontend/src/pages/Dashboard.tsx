import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Activity, AlertCircle, ArrowRight, Play, Pause, Square, MessageSquare, Target, Zap, Shield, Briefcase } from 'lucide-react';


export default function Dashboard() {
  const navigate = useNavigate();
  
  const [workspace, setWorkspace] = useState<any>(null);
  
  // Data states
  const [ccData, setCcData] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [operatingState, setOperatingState] = useState<string>('READY');
  const [nextAction, setNextAction] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  
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
        api.get(`/command-center/${ws.id}?limit=10`).catch(() => ({ data: null })),
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
      await api.post(`/workspaces/${workspace.id}/control`, { action });
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
        setChatHistory(prev => [...prev, { role: 'ai', text: res.data.reply }]);
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

  const execs = agents.filter(a => ['CEO', 'COO', 'CMO', 'CTO', 'CFO'].some(role => a.name.includes(role)));
  

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      
      {/* 1. GLOBAL STATUS & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Good morning, Founder</h1>
          <p className="text-slate-500 flex items-center gap-2 mt-1">
            <span className="relative flex h-3 w-3">
              {(operatingState === 'OPERATING' || operatingState === 'ACTIVE') && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${operatingState === 'PAUSED' ? 'bg-amber-500' : operatingState === 'STOPPED' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
            </span>
            Your AI company is <strong>{operatingState}</strong>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleControl('pause')} className="text-amber-600 border-amber-200 hover:bg-amber-50">
            <Pause className="w-4 h-4 mr-2" /> Pause
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleControl('resume')} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            <Play className="w-4 h-4 mr-2" /> Resume
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleControl('stop')} className="text-red-600 border-red-200 hover:bg-red-50">
            <Square className="w-4 h-4 mr-2" /> Stop
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 2. ACTIVE BUSINESS OUTCOME */}
          <Card className="border-indigo-100 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4" /> Active Business Outcome
              </CardTitle>
            </CardHeader>
            <CardContent>
              {primaryGoal ? (
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{primaryGoal.objective}</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <div className="text-xs font-semibold text-slate-500 uppercase">Target</div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">20</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                      <div className="text-xs font-semibold text-emerald-600 uppercase">Current Verified</div>
                      <div className="text-2xl font-bold text-emerald-700 mt-1">0</div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <div className="text-xs font-semibold text-indigo-600 uppercase">Gap</div>
                      <div className="text-2xl font-bold text-indigo-700 mt-1">20</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800 font-medium text-xs uppercase">{primaryGoal.status}</span>
                    <Link to={`/goals/${primaryGoal.id}`} className="text-indigo-600 font-medium hover:underline flex items-center">View Details <ArrowRight className="w-4 h-4 ml-1" /></Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No active business outcomes.</p>
                  <p className="text-sm text-slate-400 mb-4">Use the chat below to give your company an objective.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. WHAT SHOULD MY COMPANY DO NEXT? */}
          {nextAction && (
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> What Should My Company Do Next?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
                  <p className="font-medium text-amber-900">{nextAction.currentPriority || 'Continue autonomous operation.'}</p>
                  {nextAction.reason && <p className="text-sm text-amber-700 mt-1">{nextAction.reason}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. AI COMPANY CHAT */}
          <Card className="border-slate-200 shadow-sm flex flex-col h-[500px]">
            <CardHeader className="border-b bg-slate-50 py-3">
              <CardTitle className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> AI Company Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                  <MessageSquare className="w-10 h-10 opacity-20" />
                  <p>Ask your AI Company what they are doing, <br/>or give them a new objective.</p>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {msg.role === 'ai' && <div className="font-bold text-xs text-indigo-600 mb-1">AI CEO</div>}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-500 rounded-lg p-3 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> CEO is thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </CardContent>
            <div className="p-3 border-t bg-slate-50">
              <form onSubmit={sendChatMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="e.g. 'What is happening?', 'Get me 20 customers'" 
                  className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
                  disabled={isChatting}
                />
                <Button type="submit" disabled={!chatInput.trim() || isChatting} className="rounded-full w-10 h-10 p-0 bg-indigo-600 hover:bg-indigo-700">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* 5. FOUNDER ATTENTION */}
          {(pendingApprovals.length > 0 || importantAlerts.length > 0) && (
            <Card className="border-rose-200 shadow-sm bg-rose-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-rose-600 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Founder Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingApprovals.map((a: any) => (
                  <div key={a.id} className="bg-white p-3 rounded border border-rose-100 text-sm">
                    <p className="font-bold text-slate-900">{a.action}</p>
                    <p className="text-slate-600 text-xs mt-1">{a.reason}</p>
                    <Button size="sm" onClick={() => handleApprove(a.id)} className="w-full mt-2 bg-rose-600 hover:bg-rose-700">Approve</Button>
                  </div>
                ))}
                {importantAlerts.map((a: any, i: number) => (
                  <div key={i} className="bg-white p-3 rounded border border-rose-100 text-sm flex gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">{a.title}</p>
                      <p className="text-slate-600 text-xs mt-1">{a.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 6. AI EXECUTIVES */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> AI Executives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {execs.length > 0 ? execs.map((exec) => (
                  <div key={exec.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors cursor-pointer" onClick={() => navigate(`/agents/${exec.id}/chat`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs">
                        {exec.name.replace('AI ', '').substring(0, 3)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{exec.name}</p>
                        <p className="text-xs text-slate-500">{exec.status}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                )) : <p className="text-sm text-slate-500 text-center py-2">No executives found.</p>}
              </div>
            </CardContent>
          </Card>

          {/* 7. COMPANY HEALTH */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" /> Company Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ccData?.health ? Object.entries(ccData.health).map(([key, status]: any) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-600 font-medium">{key}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      status === 'HEALTHY' ? 'bg-emerald-100 text-emerald-700' :
                      status === 'ATTENTION' ? 'bg-amber-100 text-amber-700' :
                      status === 'DEGRADED' ? 'bg-rose-100 text-rose-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{status}</span>
                  </div>
                )) : <p className="text-sm text-slate-500 text-center">Loading health metrics...</p>}
              </div>
            </CardContent>
          </Card>

          {/* 8. LIVE ACTIVITY */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 border-l-2 border-slate-100 ml-2 pl-4 py-1">
                {whileAway.length > 0 ? whileAway.map((d: any, i: number) => (
                  <div key={i} className="relative text-sm">
                    <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-400 ring-4 ring-white"></div>
                    <p className="font-semibold text-slate-900">{d.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{d.description}</p>
                  </div>
                )) : <p className="text-sm text-slate-400">No recent activity recorded.</p>}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
