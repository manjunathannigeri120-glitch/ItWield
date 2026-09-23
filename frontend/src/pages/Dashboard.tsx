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

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      const ws = wsRes.data.find((w: any) => w.status === 'operating');
      if (!ws) return;
      setWorkspace(ws);

      const [whileAwayRes, agentsRes, ceoBriefingRes] = await Promise.all([
        api.get(`/workspaces/${ws.id}/while-away`),
        api.get(`/agents/workspace/${ws.id}`),
        api.get(`/workspaces/${ws.id}/ceo-briefing`)
      ]);

      setWhileAwayData(whileAwayRes.data);
      setAgents(agentsRes.data || []);
      setCeoBriefingData(ceoBriefingRes.data);
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

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      
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
              <h3 className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-3 flex items-center"><span className="mr-2">💼</span> Workforce Status</h3>
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
                      <Button variant="outline" size="sm" className="h-7 text-xs border-amber-300 hover:bg-amber-100" onClick={() => window.location.href="/workflows"}>Review</Button>
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

    </div>
  );
}
