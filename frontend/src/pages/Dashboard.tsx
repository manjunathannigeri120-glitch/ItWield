import { useState, useEffect } from 'react';

import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Helper to translate raw events to business English
export default function Dashboard() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [whileAwayData, setWhileAwayData] = useState<any>(null);
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

      const [whileAwayRes, agentsRes] = await Promise.all([
        api.get(`/workspaces/${ws.id}/while-away`),
        api.get(`/agents/workspace/${ws.id}`)
      ]);

      setWhileAwayData(whileAwayRes.data);
      setAgents(agentsRes.data || []);
    } catch (e) {
      console.error('Failed to load dashboard', e);
    }
  };

  if (!workspace) return <div className="p-8">Loading or no active company...</div>;

  const items = whileAwayData?.items || [];
  const needsAttention = items.filter((a: any) => a.requiresAttention).slice(0, 5);
  const whileAway = items.filter((a: any) => !a.requiresAttention).slice(0, 5);

  const execs = agents.filter(a => a.name.startsWith('AI '));
  const workers = agents.filter(a => !a.name.startsWith('AI '));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{workspace.name} Dashboard</h1>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
          <span className="text-sm font-medium">COMPANY HEALTH:</span>
          <span className="text-green-600 font-bold flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Healthy
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Needs Attention */}
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center"><span className="mr-2">⚠</span> NEEDS YOUR ATTENTION</CardTitle>
          </CardHeader>
          <CardContent>
            {needsAttention.length === 0 ? (
              <p className="text-gray-500 italic">No active incidents or approvals required.</p>
            ) : (
              <ul className="space-y-4">
                {needsAttention.map((item: any) => (
                  <li key={item.id} className="bg-white p-4 rounded shadow-sm border border-amber-100">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-amber-900">{item.title}</h4>
                      <Button variant="outline" size="sm" className="text-amber-700 border-amber-300 hover:bg-amber-100" onClick={() => window.location.href="/workflows"}>Review</Button>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                    {item.details?.whatWeDid && (
                      <div className="text-xs text-gray-600 bg-amber-50 p-2 rounded">
                        <strong className="block mb-1">What ItWield did:</strong>
                        <ul className="list-disc pl-4 space-y-1">
                          {item.details.whatWeDid.map((action: string, i: number) => <li key={i}>{action}</li>)}
                        </ul>
                      </div>
                    )}
                    {item.details?.ownerAction && (
                      <div className="text-xs text-amber-800 mt-2 font-medium">
                        Owner Action: {item.details.ownerAction}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* While You Were Away */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center"><span className="mr-2">🕒</span> WHILE YOU WERE AWAY</CardTitle>
          </CardHeader>
          <CardContent>
            {whileAway.length === 0 ? (
              <p className="text-gray-500 italic">{whileAwayData?.summary || 'No autonomous activity yet. ItWield is ready.'}</p>
            ) : (
              <ul className="space-y-4">
                {whileAway.map((item: any) => (
                  <li key={item.id} className="flex flex-col border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start">
                      {item.status === 'success' ? (
                        <span className="text-green-500 mr-2 mt-0.5">✓</span>
                      ) : (
                        <span className="text-blue-500 mr-2 mt-0.5">ℹ</span>
                      )}
                      <div>
                        <div className="font-semibold text-gray-800">{item.title}</div>
                        <div className="text-sm text-gray-600">{item.description}</div>
                        {item.type === 'health_check' && item.details && (
                          <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            <span className="font-medium text-green-600 mr-3">Healthy</span>
                            <span className="mr-3">HTTP {item.details.httpStatus}</span>
                            <span>Response time: {item.details.durationMs} ms</span>
                          </div>
                        )}
                        {item.type === 'health_check' && (
                          <div className="text-xs text-gray-400 mt-1">No action was required.</div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>

      {/* AI Workforce */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">AI Workforce</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {execs.length === 0 && <p className="text-gray-500 col-span-4">No executives configured.</p>}
          {execs.map(ex => (
            <Link key={ex.id} to={`/agents/${ex.id}/chat`} className="block">
              <Card className="shadow-sm border-t-4 border-t-blue-500 hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="font-bold text-lg">{ex.name}</div>
                  <div className="flex items-center mt-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-sm text-gray-600">{ex.status === 'idle' ? 'Operating' : ex.status}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {workers.length === 0 && <p className="text-gray-500 col-span-3">No workers configured.</p>}
          {workers.map(w => (
            <Card key={w.id} className="shadow-sm">
              <CardContent className="pt-6">
                <div className="font-bold">{w.name}</div>
                <div className="text-xs text-gray-400 mt-1">Reports to: {agents.find(a => a.id === w.manager_id)?.name || 'CEO'}</div>
                <div className="flex items-center mt-3">
                  <span className={`w-2 h-2 rounded-full mr-2 ${w.status === 'idle' ? 'bg-gray-300' : 'bg-blue-500'}`}></span>
                  <span className="text-sm text-gray-600 capitalize">{w.status === 'idle' ? 'Idle' : 'Working'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Connections */}
      <div className="space-y-4 pt-4">
        <h2 className="text-2xl font-bold">Connections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm bg-gray-50 border-dashed">
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <div className="font-bold">GitHub</div>
                <div className="text-sm text-gray-500">Engineering</div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </CardContent>
          </Card>
          <Card className="shadow-sm bg-gray-50 border-dashed">
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <div className="font-bold">Stripe</div>
                <div className="text-sm text-gray-500">Business</div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </CardContent>
          </Card>
          <Card className="shadow-sm bg-gray-50 border-dashed">
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <div className="font-bold">Slack</div>
                <div className="text-sm text-gray-500">Communication</div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
