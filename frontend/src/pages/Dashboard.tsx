import { useState, useEffect } from 'react';

import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Helper to translate raw events to business English
export default function Dashboard() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [whileAwayData, setWhileAwayData] = useState<any>(null);
  const [ceoBriefingData, setCeoBriefingData] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [cooReview, setCooReview] = useState<any>(null);
  const [goalInput, setGoalInput] = useState('');
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [showMissionWizard, setShowMissionWizard] = useState(false);
  const [missionForm, setMissionForm] = useState({ type: 'GET_CUSTOMERS', title: '', description: '', success_criteria: '', objective: '' });

  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async () => {
    if (!selectedApproval || !workspace) return;
    setApprovalSubmitting(true);
    try {
      const res = await api.post(`/workspaces/${workspace.id}/approvals/${selectedApproval.id}/approve`);
      if (res.data.error || (res.data.executed === false && res.data.reason)) {
        alert("Failed to execute: " + (res.data.reason || res.data.error));
      }
      setSelectedApproval(null);
      loadData();
    } catch (e: any) {
      alert("Error approving action: " + e.message);
    }
    setApprovalSubmitting(false);
  };

  const handleReject = async () => {
    if (!selectedApproval || !workspace) return;
    setApprovalSubmitting(true);
    try {
      await api.post(`/workspaces/${workspace.id}/approvals/${selectedApproval.id}/reject`, { reason: rejectionReason });
      setSelectedApproval(null);
      setRejectionReason("");
      loadData();
    } catch (e: any) {
      alert("Error rejecting action: " + e.message);
    }
    setApprovalSubmitting(false);
  };

  const handleCreateMission = async () => {
    if (!workspace) return;
    try {
      await api.post(`/workspaces/${workspace.id}/missions`, missionForm);
      setShowMissionWizard(false);
      setMissionForm({ type: 'GET_CUSTOMERS', title: '', description: '', success_criteria: '', objective: '' });
      loadData();
    } catch (e: any) {
      const errMsg = e.response?.data?.error || e.message;
      alert("Error creating mission: " + errMsg);
    }
  };

  const handleMissionAction = async (missionId: string, action: string) => {
    if (!workspace) return;
    try {
      await api.post(`/workspaces/${workspace.id}/missions/${missionId}/${action}`);
      loadData();
    } catch (e: any) {
      alert("Error updating mission: " + e.message);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);


  const handleCreateGoal = async () => {
    if (!goalInput.trim()) return;
    setGoalSubmitting(true);
    try {
      await api.post(`/workspaces/${workspace.id}/goals`, { input: goalInput });
      setGoalInput('');
      loadData();
    } catch (e) {
      console.error(e);
      alert('Failed to create goal');
    } finally {
      setGoalSubmitting(false);
    }
  };

  const loadData = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      const ws = wsRes.data.find((w: any) => w.status === 'operating');
      if (!ws) return;
      setWorkspace(ws);

      let missionsData = [];
      try {
        const mRes = await api.get(`/workspaces/${ws.id}/missions`);
        missionsData = mRes.data || [];
      } catch (e) {
        console.error('Failed to load missions, continuing with empty list', e);
      }
      setMissions(missionsData);

      const [whileAwayRes, agentsRes, ceoBriefingRes, goalsRes, cooRes] = await Promise.all([
        api.get(`/workspaces/${ws.id}/while-away`),
        api.get(`/agents/workspace/${ws.id}`),
        api.get(`/workspaces/${ws.id}/ceo-briefing`),
        api.get(`/workspaces/${ws.id}/goals`).catch(() => ({ data: [] })),
        api.get(`/workspaces/${ws.id}/goals/what-next`).catch(() => ({ data: null }))
      ]);

      setWhileAwayData(whileAwayRes.data);
      setAgents(agentsRes.data || []);
      setCeoBriefingData(ceoBriefingRes.data);
      setGoals(goalsRes.data || []);
      setCooReview(cooRes.data);
    } catch (e) {
      console.error('Failed to load dashboard', e);
    }
  };

  if (!workspace || !ceoBriefingData) return <div className="p-8">Loading or no active company...</div>;

  const items = whileAwayData?.items || [];
  const whileAway = items.filter((a: any) => !a.requiresAttention).slice(0, 5);
  const attentionItems = ceoBriefingData.attentionItems || [];
  const recommendations = ceoBriefingData.recommendations || [];
  const workforceInfo = ceoBriefingData.workforce || { activeTasks: [], idleAgents: [] };

  const execs = agents.filter(a => a.name.startsWith('AI '));
  const workers = agents.filter(a => !a.name.startsWith('AI '));
  const improvements = ceoBriefingData?.improvements || [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      
      
      {/* WHAT SHOULD MY COMPANY DO NEXT? */}
      {cooReview && (
        <Card className="mb-8 border-2 border-indigo-200 shadow-md bg-indigo-50/30">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <span className="bg-indigo-600 text-white p-1 rounded">COO</span> What Should My Company Do Next?
            </h2>
            <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm mt-4">
              <h3 className="font-bold text-lg text-gray-900">{cooReview.whatNext?.priority}</h3>
              <p className="text-sm text-gray-600 mt-1 font-medium">{cooReview.whatNext?.why}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-50 p-3 rounded text-sm">
                  <span className="block text-xs font-bold text-slate-500 uppercase">Impact</span>
                  {cooReview.whatNext?.impact}
                </div>
                <div className="bg-slate-50 p-3 rounded text-sm">
                  <span className="block text-xs font-bold text-slate-500 uppercase">Recommended Action</span>
                  {cooReview.whatNext?.action}
                </div>
              </div>
            </div>
            
            {cooReview.bottlenecks?.length > 0 && (
              <div className="mt-4 border-t border-indigo-100 pt-4">
                <h3 className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wide">Active Business Bottlenecks</h3>
                <div className="space-y-2">
                  {cooReview.bottlenecks.map((b: any) => (
                    <div key={b.id} className="bg-red-50 text-red-900 p-3 rounded border border-red-100 flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm">{b.category} Bottleneck</div>
                        <div className="text-xs mt-1">{b.evidence}</div>
                        <div className="text-xs italic text-red-700 mt-1">{b.explanation}</div>
                      </div>
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold uppercase">{b.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* BUSINESS GOALS */}
      <div className="mb-8 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Business Outcomes</h2>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 border-2 border-slate-300 rounded-lg p-3 text-lg focus:border-indigo-500 outline-none" 
            placeholder="Tell ItWield what you want your business to achieve (e.g. 'Get me 20 customers')" 
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateGoal()}
          />
          <Button className="h-auto px-6 bg-indigo-600 hover:bg-indigo-700 text-lg text-white" onClick={handleCreateGoal} disabled={goalSubmitting}>
            {goalSubmitting ? 'Planning...' : 'Command'}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4">
          {goals.map(g => (
            <Card key={g.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{g.objective}</h3>
                    <div className="text-sm text-gray-500 mt-1">Goal interpretation from: "{g.raw_input}"</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    g.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    g.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                    g.status === 'STALLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {g.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Target</div>
                    <div className="text-lg font-semibold">{g.target || 'N/A'} {g.target_metric}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Current Progress</div>
                    <div className="text-lg font-semibold">{g.current_metric || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Gap</div>
                    <div className="text-lg font-semibold">{g.target ? (g.target - (g.current_metric || 0)) : 'N/A'}</div>
                  </div>
                </div>

                {g.missing_data && g.missing_data.length > 0 && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded flex flex-col gap-1">
                    <span className="text-amber-800 text-sm font-bold">DATA NOT AVAILABLE</span>
                    <span className="text-amber-700 text-xs">To measure this goal, connect: {g.missing_data.join(', ')}</span>
                  </div>
                )}

                {g.missions && g.missions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Active Execution Missions</h4>
                    <div className="space-y-2">
                      {g.missions.map((m: any) => (
                        <div key={m.id} className="flex justify-between items-center text-sm p-2 bg-white border rounded">
                          <span className="font-medium text-gray-800">{m.objective}</span>
                          <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600">{m.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {showMissionWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900">New Business Mission</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mission Type</label>
                <select className="w-full border rounded-md p-2 text-sm" value={missionForm.type} onChange={e => setMissionForm({...missionForm, type: e.target.value})}>
                  <option value="GET_CUSTOMERS">Get Customers (End-to-End)</option>
                  <option value="UNDERSTAND_COMPETITORS">Understand Competitors</option>
                  <option value="IMPROVE_PRODUCT">Improve Product</option>
                  <option value="MONITOR_BUSINESS">Monitor Business Health</option>
                  <option value="REDUCE_MANUAL_WORK">Reduce Manual Work</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" className="w-full border rounded-md p-2 text-sm" placeholder="e.g. Q3 Lead Generation" value={missionForm.title} onChange={e => setMissionForm({...missionForm, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objective / Target Criteria</label>
                <textarea className="w-full border rounded-md p-2 text-sm" rows={3} placeholder="Describe target customers, competitors to watch, etc." value={missionForm.objective} onChange={e => setMissionForm({...missionForm, objective: e.target.value})} />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowMissionWizard(false)}>Cancel</Button>
              <Button onClick={handleCreateMission} className="bg-indigo-600 hover:bg-indigo-700 text-white">Create Mission</Button>
            </div>
          </div>
        </div>
      )}

      {/* Missions Section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Active Missions</h2>
        <Button onClick={() => setShowMissionWizard(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 shadow">
          + New Business Mission
        </Button>
      </div>

      {missions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {missions.map(m => (
            <Link to={`/missions/${m.id}`} key={m.id} className="block group"><Card className="shadow-sm border border-gray-200 bg-white group-hover:border-indigo-400 group-hover:shadow-md transition-all h-full">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider
                      ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
                      ${m.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : ''}
                      ${m.status === 'PAUSED' ? 'bg-amber-100 text-amber-800' : ''}
                    `}>{m.status}</span>
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">{m.type}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{m.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">{m.objective}</p>
                </div>
                <div className="mt-4 flex gap-2 border-t pt-4">
                  {m.status === 'DRAFT' || m.status === 'PAUSED' ? (
                    <Button variant="outline" size="sm" onClick={() => handleMissionAction(m.id, 'activate')} className="w-full hover:bg-green-50 text-green-700 border-green-200">Activate</Button>
                  ) : m.status === 'ACTIVE' ? (
                    <Button variant="outline" size="sm" onClick={() => handleMissionAction(m.id, 'pause')} className="w-full text-amber-700 hover:bg-amber-50 border-amber-200">Pause</Button>
                  ) : null}
                </div>
              </CardContent>
            </Card></Link>
          ))}
        </div>
      )}

      {/* AI CEO BRIEFING Top Section */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-6 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI CEO BRIEFING</h1>
            <p className="text-gray-500 mt-1">For {workspace.name}</p>
          </div>
          <div className="flex flex-col items-end">
            <div className={`px-4 py-2 rounded-full font-bold flex items-center shadow-sm text-sm
              ${ceoBriefingData.companyStatus === 'Healthy' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
              ${ceoBriefingData.companyStatus === 'Attention needed' ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''}
              ${ceoBriefingData.companyStatus === 'Critical issue' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
              ${ceoBriefingData.companyStatus === 'Blocked' ? 'bg-gray-50 text-gray-700 border border-gray-200' : ''}
            `}>
              <span className={`w-2 h-2 rounded-full mr-2 
                ${ceoBriefingData.companyStatus === 'Healthy' ? 'bg-green-500' : ''}
                ${ceoBriefingData.companyStatus === 'Attention needed' ? 'bg-amber-500' : ''}
                ${ceoBriefingData.companyStatus === 'Critical issue' ? 'bg-red-500' : ''}
                ${ceoBriefingData.companyStatus === 'Blocked' ? 'bg-gray-500' : ''}
              `}></span>
              STATUS: {ceoBriefingData.companyStatus.toUpperCase()}
            </div>
            <p className="text-sm text-gray-500 mt-2 max-w-xs text-right">{ceoBriefingData.statusReason}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1: Since you were away & Workforce */}
          <div className="space-y-6">
            {(ceoBriefingData.activeGoals && ceoBriefingData.activeGoals.length > 0) && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                <h3 className="text-xs font-bold text-blue-800 tracking-wider uppercase mb-1">GOAL</h3>
                <p className="text-sm text-gray-900 font-medium mb-3">{ceoBriefingData.activeGoals[0].goal}</p>

                <h3 className="text-xs font-bold text-blue-800 tracking-wider uppercase mb-1">CURRENT ACTION</h3>
                <p className="text-sm text-gray-700 mb-3">{ceoBriefingData.activeGoals[0].executive} is overseeing: {ceoBriefingData.activeGoals[0].action}</p>

                <h3 className="text-xs font-bold text-blue-800 tracking-wider uppercase mb-1">WORKFORCE</h3>
                <p className="text-sm text-gray-700 mb-3">{ceoBriefingData.activeGoals[0].worker} — Working</p>

                <h3 className="text-xs font-bold text-blue-800 tracking-wider uppercase mb-1">WHY</h3>
                <p className="text-sm text-gray-600 italic">{ceoBriefingData.activeGoals[0].why}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-3 flex items-center"><span className="mr-2">🕒</span> Since you were away</h3>
              {whileAway.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No autonomous activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {whileAway.map((item: any) => (
                    <li key={item.id} className="text-sm">
                      <div className="flex items-start">
                        {item.status === 'success' ? <span className="text-green-500 mr-2">✓</span> : <span className="text-blue-500 mr-2">ℹ</span>}
                        <div>
                          <div className="font-semibold text-gray-800">{item.description}</div>
                          {item.type === 'health_check' && item.details && (
                            <div className="text-xs text-gray-500 mt-1">HTTP {item.details.httpStatus} | {item.details.durationMs}ms</div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-3 flex items-center"><span className="mr-2">💼</span> AI WORK IN PROGRESS</h3>
              <div className="text-sm space-y-2">
                {workforceInfo.activeTasks.length > 0 ? (
                  workforceInfo.activeTasks.map((t: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span className="truncate mr-2 text-gray-700">{t.title}</span>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{t.agent}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No active tasks.</p>
                )}
                {workforceInfo.idleAgents.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">Idle: {workforceInfo.idleAgents.join(', ')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Needs Attention */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-amber-600 tracking-wider uppercase mb-3 flex items-center"><span className="mr-2">⚠</span> Needs your attention</h3>
            {attentionItems.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No active incidents or approvals required.</p>
            ) : (
              <ul className="space-y-4">
                {attentionItems.map((item: any, i: number) => (
                  <li key={i} className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <div className="text-xs font-bold text-amber-800 mb-1 tracking-wider">{item.category}</div>
                    <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-700 mb-3">{item.description}</p>
                    {item.source && (
                      <div className="text-xs text-gray-500 mb-1">Source: {item.source}</div>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-amber-200 border-dashed">
                      <span className="text-xs font-medium text-amber-800">{item.actionRequired}</span>
                      {item.type === 'approval' ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs border-amber-300 hover:bg-amber-100" onClick={() => setSelectedApproval(item.detail)}>Review</Button>
                      ) : (
                        <Button variant="outline" size="sm" className="h-7 text-xs border-amber-300 hover:bg-amber-100" onClick={() => window.location.href="/workflows"}>Review</Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Column 3: Recommendations */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 tracking-wider uppercase mb-3 flex items-center"><span className="mr-2">💡</span> AI Recommendations</h3>
            {recommendations.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No active recommendations.</p>
            ) : (
              <ul className="space-y-4">
                {recommendations.map((item: any, i: number) => (
                  <li key={i} className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                    <div className="text-xs font-bold text-blue-800 mb-1 tracking-wider">{item.category}</div>
                    <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-700">{item.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>

      {ceoBriefingData?.companyMemory && (
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-600 mb-6">Company Memory</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase">Strategic Context</h3>
              {ceoBriefingData.companyMemory.strategic.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No verified strategic goals recorded.</p>
              ) : (
                <ul className="space-y-2 text-sm text-gray-700">
                  {ceoBriefingData.companyMemory.strategic.map((m: any) => (
                    <li key={m.id} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                      <span className="font-semibold block mb-1 text-gray-800">{m.title}</span>
                      <span className="text-gray-600">{m.content}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase">Recent Decisions</h3>
              {ceoBriefingData.companyMemory.decisions.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No recent decisions recorded.</p>
              ) : (
                <ul className="space-y-2 text-sm text-gray-700">
                  {ceoBriefingData.companyMemory.decisions.map((m: any) => (
                    <li key={m.id} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                      <span className="font-semibold block mb-1 text-gray-800">{m.title}</span>
                      <span className="text-gray-600">{m.content}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase">Recent Lessons</h3>
              {ceoBriefingData.companyMemory.lessons.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No recent lessons recorded.</p>
              ) : (
                <ul className="space-y-2 text-sm text-gray-700">
                  {ceoBriefingData.companyMemory.lessons.map((m: any) => (
                    <li key={m.id} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                      <span className="font-semibold block mb-1 text-gray-800">{m.title}</span>
                      <span className="text-gray-600">{m.content}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase">Important Incidents</h3>
              {ceoBriefingData.companyMemory.incidents.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No major incidents recorded.</p>
              ) : (
                <ul className="space-y-2 text-sm text-gray-700">
                  {ceoBriefingData.companyMemory.incidents.map((m: any) => (
                    <li key={m.id} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                      <span className="font-semibold block mb-1 text-gray-800">{m.title}</span>
                      <span className="text-gray-600">{m.content}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>
      )}

      {/* AI IMPROVEMENTS SECTION */}
      {improvements.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-700">AI Improvements</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {improvements.length} pattern{improvements.length !== 1 ? 's' : ''} detected
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {improvements.map((imp: any) => (
              <div key={imp.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                      {imp.category}
                    </span>
                    <h4 className="font-bold text-gray-900 mt-2">{imp.title}</h4>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ml-2 shrink-0
                    ${imp.confidence === 'high' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
                    ${imp.confidence === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''}
                    ${imp.confidence === 'low' ? 'bg-gray-50 text-gray-600 border border-gray-200' : ''}
                  `}>
                    {imp.confidence?.toUpperCase()} confidence
                  </span>
                </div>

                {/* Pattern Detected */}
                <div className="mb-3">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pattern Detected</div>
                  <p className="text-sm text-gray-700">{imp.pattern}</p>
                </div>

                {/* Evidence */}
                {imp.evidenceSummary && (
                  <div className="mb-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Evidence</div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">{imp.evidenceSummary}</p>
                  </div>
                )}

                {/* Recommendation */}
                {imp.recommendation && (
                  <div className="mb-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Recommendation</div>
                    <p className="text-sm text-gray-700 italic">{imp.recommendation}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium
                      ${imp.status === 'PROPOSED' ? 'bg-blue-50 text-blue-700' : ''}
                      ${imp.status === 'DISMISSED' ? 'bg-gray-50 text-gray-400' : ''}
                      ${imp.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : ''}
                      ${imp.status === 'FAILED' ? 'bg-red-50 text-red-700' : ''}
                    `}>
                      {imp.status === 'PROPOSED' ? 'Recommendation' : imp.status}
                    </span>
                    {imp.routedTo && (
                      <span className="text-xs text-gray-400">→ {imp.routedTo}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Did ItWield change anything? {imp.status === 'COMPLETED' ? 'Yes — verified.' : 'No. This is a recommendation only.'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Workforce Directory (Lower level context) */}
      <div className="space-y-4 opacity-80 mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-bold text-gray-600">AI Workforce Directory</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {execs.length === 0 && <p className="text-gray-500 col-span-4">No executives configured.</p>}
          {execs.map(ex => (
            <Link key={ex.id} to={`/agents/${ex.id}/chat`} className="block">
              <Card className="shadow-sm border-t-4 border-t-gray-300 hover:bg-muted/50 transition-colors cursor-pointer bg-white">
                <CardContent className="pt-4 pb-4">
                  <div className="font-bold text-gray-700">{ex.name}</div>
                  <div className="flex items-center mt-1">
                    <span className={`w-2 h-2 rounded-full mr-2 ${ex.status === 'idle' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                    <span className="text-xs text-gray-500">{ex.status === 'idle' ? 'Operating' : ex.status}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {workers.length === 0 && <p className="text-gray-500 col-span-3">No workers configured.</p>}
          {workers.map(w => (
            <Card key={w.id} className="shadow-sm bg-white">
              <CardContent className="pt-4 pb-4">
                <div className="font-bold text-gray-700">{w.name}</div>
                <div className="text-xs text-gray-400 mt-1">Reports to: {agents.find(a => a.id === w.manager_id)?.name || 'CEO'}</div>
                <div className="flex items-center mt-2">
                  <span className={`w-2 h-2 rounded-full mr-2 ${w.status === 'idle' ? 'bg-gray-300' : 'bg-blue-500'}`}></span>
                  <span className="text-xs text-gray-500 capitalize">{w.status === 'idle' ? 'Idle' : 'Working'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {ceoBriefingData?.approvalHistory && ceoBriefingData.approvalHistory.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Approval History</h2>
          <div className="bg-white rounded border border-gray-200 overflow-hidden text-sm">
            {ceoBriefingData.approvalHistory.map((ah: any) => (
              <div key={ah.id} className="p-3 border-b border-gray-100 last:border-b-0 flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-700">{ah.title}</div>
                  <div className="text-xs text-gray-500 mt-1">Status: {ah.status} | Action: {ah.action}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-400">{new Date(ah.resolved_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Action Requires Approval</h3>
              <p className="text-sm text-gray-500 mt-1">Please review the requested action</p>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">What</label>
                <div className="font-medium text-gray-900">{selectedApproval.title}</div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Why</label>
                <div className="text-gray-700 bg-gray-50 p-3 rounded">{selectedApproval.reason}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Who</label>
                  <div className="text-gray-900">{selectedApproval.requestedBy}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Risk Level</label>
                  <div className="text-amber-600 font-bold uppercase">{selectedApproval.riskLevel}</div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rejection Reason (Optional)</label>
                <input 
                  type="text"
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  placeholder="If rejecting, explain why..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setSelectedApproval(null)} disabled={approvalSubmitting}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={approvalSubmitting}>Reject</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleApprove} disabled={approvalSubmitting}>
                {approvalSubmitting ? 'Processing...' : 'Approve & Execute'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

