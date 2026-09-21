import { useState, useEffect } from 'react';
import { Play, Activity, User, Briefcase } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Dashboard() {
  const workspaceId = '00000000-0000-0000-0000-000000000000';
  const [objective, setObjective] = useState('Keep my application healthy');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [latestEvents, setLatestEvents] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, agentsRes] = await Promise.all([
        api.get('/tasks', { params: { workspaceId } }),
        api.get(`/agents/workspace/${workspaceId}`)
      ]);
      setTasks(tasksRes.data || []);
      setWorkers(agentsRes.data || []);

      // Load events for the latest 3 tasks
      const recentTasks = (tasksRes.data || []).slice(0, 3);
      const eventsPromises = recentTasks.map((t: any) => api.get(`/tasks/${t.id}/events`));
      const eventsRes = await Promise.all(eventsPromises);
      
      const allEvents = eventsRes.flatMap((res: any) => res.data).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setLatestEvents(allEvents.slice(0, 5));
    } catch (e) {
      console.error(e);
    }
  };

  let orchestratorStatus = 'WAITING';
  if (tasks.some(t => t.status === 'RUNNING' || t.status === 'PENDING' || t.status === 'ASSIGNED')) orchestratorStatus = 'OPERATING';
  else if (tasks.some(t => t.status === 'ESCALATED')) orchestratorStatus = 'ACTION_REQUIRED';
  else if (tasks.some(t => t.status === 'BLOCKED')) orchestratorStatus = 'BLOCKED';

  const runCEO = async () => {
    setLoading(true);
    try {
      await api.post('/ceo/run', {
        workspace_id: workspaceId,
        objective
      });
      loadData();
      loadData();
    } catch (e) {
      console.error(e);
      alert('Failed to run CEO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI CEO Dashboard</h1>
          <p className="text-muted-foreground mt-1">Orchestrate your CEO and workforce</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> Orchestrator</CardTitle>
            <CardDescription>
              Status: <span className="font-bold">{loading ? 'Operating' : orchestratorStatus}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Owner Objective</label>
              <Input 
                value={objective} 
                onChange={e => setObjective(e.target.value)} 
                placeholder="E.g. Keep my application healthy" 
              />
            </div>
            <Button onClick={runCEO} disabled={loading} className="w-full">
              {loading ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              {loading ? 'Executing...' : 'Run CEO'}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Workforce Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workers.map((w: any) => (
               <div key={w.id} className="flex items-center justify-between p-3 border rounded-md">
                 <div>
                   <div className="font-semibold flex items-center gap-2"><User className="w-4 h-4" /> {w.name}</div>
                   <div className="text-xs text-muted-foreground">Capabilities: {w.capabilities?.features?.join(', ')}</div>
                 </div>
                 <span className={`px-2 py-1 uppercase font-bold text-xs rounded-full ${w.status === 'working' ? 'bg-green-100 text-green-800' : w.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                   {w.status}
                 </span>
               </div>
            ))}
            {workers.length === 0 && <div className="text-sm text-muted-foreground">No workers found in this workspace.</div>}
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Latest Activity & CEO Evaluations</h2>
          <div className="space-y-4">
            {latestEvents.map((evt: any) => {
              if (evt.event_type === 'CEO_EVALUATION') {
                return (
                  <Card key={evt.id} className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-center text-purple-900">
                        <span className="font-bold text-sm">CEO EVALUATION</span>
                        <span className="text-xs">{new Date(evt.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-sm"><strong>Assessment:</strong> {evt.details?.evaluation}</div>
                      <div className="text-sm"><strong>Conclusion:</strong> <span className="font-bold">{evt.details?.conclusion}</span></div>
                      <div className="text-sm"><strong>Owner Update:</strong> {evt.details?.owner_update}</div>
                    </CardContent>
                  </Card>
                )
              }
              return (
                <Card key={evt.id} className="bg-card">
                  <CardContent className="p-4 space-y-1">
                     <div className="flex justify-between items-center text-muted-foreground text-xs">
                        <span className="font-bold">{evt.event_type}</span>
                        <span>{new Date(evt.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-sm">
                        <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(evt.details, null, 2)}</pre>
                      </div>
                  </CardContent>
                </Card>
              )
            })}
            {latestEvents.length === 0 && <div className="text-sm text-muted-foreground">No recent activity.</div>}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Tasks</h2>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tasks.map((task: any) => (
                  <tr key={task.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">{task.description}</div>
                      {task.error && <div className="text-xs text-red-500 truncate max-w-[150px]">Err: {task.error}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {task.assigned_agent?.name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={task.status === 'COMPLETED' ? 'px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800' : task.status === 'FAILED' ? 'px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800' : task.status === 'BLOCKED' ? 'px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800' : 'px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800'}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No tasks delegated yet. Run the CEO to generate work.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
