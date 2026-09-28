import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Agents() {
  const workspaceId = localStorage.getItem('itwield_workspace_id') || '00000000-0000-0000-0000-000000000000'; 
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['workforce', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}/workforce`);
      return res.data;
    },
    enabled: !!workspaceId,
    refetchInterval: 5000 // Poll for active status
  });

  const { data: workers } = useQuery({
    queryKey: ['workers', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}/workforce/workers`);
      return res.data;
    },
    enabled: !!workspaceId
  });

  const metrics = data?.metrics || { operating: 0, available: 0, busy: 0, blocked: 0, waitingApproval: 0, failed: 0 };
  const recentActivity = data?.recent_activity || [];

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Workforce</h1>
          <p className="text-muted-foreground">Manage your AI employees, capabilities, and active tasks</p>
        </div>
        <Button onClick={() => navigate('/agents/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Provision Worker
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <Card><CardContent className="p-4 text-center"><h3 className="text-2xl font-bold">{metrics.operating}</h3><p className="text-xs text-muted-foreground uppercase">Operating</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><h3 className="text-2xl font-bold text-green-600">{metrics.available}</h3><p className="text-xs text-muted-foreground uppercase">Available</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><h3 className="text-2xl font-bold text-blue-600">{metrics.busy}</h3><p className="text-xs text-muted-foreground uppercase">Busy</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><h3 className="text-2xl font-bold text-amber-600">{metrics.waitingApproval}</h3><p className="text-xs text-muted-foreground uppercase">Waiting Auth</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><h3 className="text-2xl font-bold text-red-600">{metrics.blocked}</h3><p className="text-xs text-muted-foreground uppercase">Blocked</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><h3 className="text-2xl font-bold text-slate-800">{metrics.failed}</h3><p className="text-xs text-muted-foreground uppercase">Failed</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-xl font-bold">Workers</h2>
          {isError ? (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-md">
              <h3 className="font-bold mb-2">Database Error</h3>
              <p>{(error as any)?.response?.data?.error || (error as any)?.message || 'Failed to load workforce'}</p>
            </div>
          ) : isLoading ? (
            <div>Loading workforce...</div>
          ) : workers?.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-card border-dashed">
              <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No workers provisioned</h3>
              <p className="text-muted-foreground mb-4">Your workforce is currently empty.</p>
              <Button onClick={() => navigate('/agents/new')}>Provision your first worker</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workers?.map((agent: any) => (
                <Card key={agent.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Bot className="w-5 h-5 text-primary" />
                      {agent.name}
                    </CardTitle>
                    <div className="text-sm font-medium text-primary/80">{agent.department} • {agent.role || 'Generalist'}</div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-3 text-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Status</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        agent.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                        agent.status === 'BUSY' ? 'bg-blue-100 text-blue-800' :
                        agent.status === 'WAITING_FOR_APPROVAL' ? 'bg-amber-100 text-amber-800' :
                        agent.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">Workload</span>
                        <span className="font-mono">{agent.current_workload} / {agent.max_concurrent_tasks}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">Authority</span>
                        <span className="font-mono text-xs px-1.5 py-0.5 bg-slate-100 rounded">{agent.authority_level}</span>
                    </div>
                    <div className="border-t pt-2">
                      <span className="font-semibold text-muted-foreground block mb-1">Capabilities</span>
                      <div className="flex flex-wrap gap-1">
                        {(agent.capabilities || []).map((f: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded text-[10px] font-mono">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
           <h2 className="text-xl font-bold">Recent Activity</h2>
           <Card>
              <CardContent className="p-0">
                  {recentActivity.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">No recent tasks.</div>
                  ) : (
                      <div className="divide-y">
                          {recentActivity.map((t: any) => (
                              <div key={t.id} className="p-4 text-sm">
                                  <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold truncate pr-2">{t.title}</span>
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        t.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                        t.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                        t.status === 'RUNNING' ? 'bg-blue-100 text-blue-700' :
                                        t.status === 'WAITING_FOR_APPROVAL' ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-100 text-slate-700'
                                      }`}>
                                        {t.status}
                                      </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                    <span>{t.agents?.name || 'Unassigned'}</span>
                                    <span>{new Date(t.updated_at).toLocaleTimeString()}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
