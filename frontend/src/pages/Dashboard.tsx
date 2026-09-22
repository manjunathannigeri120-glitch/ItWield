import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Helper to translate raw events to business English
const formatEventText = (evt: any, allTasks: any[]) => {
  const task = allTasks.find(t => t.id === evt.task_id);
  const taskTitle = task?.title || 'a task';
  const workerName = task?.assigned_agent?.name || 'an agent';

  if (evt.event_type === 'CEO_EVALUATION') return `CEO investigated: "${evt.details?.ownerUpdate || 'Reported findings'}"`;

  switch (evt.event_type) {
    case 'TASK_CREATED': return `CEO assigned a new task: "${taskTitle}" to ${workerName}.`;
    case 'TASK_STARTED': return `${workerName} began executing "${taskTitle}".`;
    case 'TASK_COMPLETED': return `${workerName} successfully completed "${taskTitle}".`;
    case 'TASK_FAILED': return `${workerName} encountered a failure while executing "${taskTitle}".`;
    case 'TASK_BLOCKED': return `"${taskTitle}" was paused because ${workerName} requires additional capabilities.`;
    case 'TASK_ESCALATED': return `CEO paused "${taskTitle}" because additional autonomous actions require attention.`;
    case 'APPROVAL_REQUIRED': return `Owner approval is required for "${taskTitle}".`;
    case 'OBSERVATION_CLAIMED': return `System scheduled an automatic health observation.`;
    case 'INCIDENT_DETECTED': return `System detected an issue: ${evt.details?.title || 'Operational Anomaly'}.`;
    default: return `System logged a new ${evt.event_type} event.`;
  }
};

export default function Dashboard() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
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

      const [evtsRes, tasksRes, agentsRes] = await Promise.all([
        api.get(`/workspaces/${ws.id}/events`),
        api.get(`/tasks?workspace_id=${ws.id}`),
        api.get(`/agents?workspace_id=${ws.id}`)
      ]);

      setEvents(evtsRes.data || []);
      setTasks(tasksRes.data || []);
      setAgents(agentsRes.data || []);
    } catch (e) {
      console.error('Failed to load dashboard', e);
    }
  };

  if (!workspace) return <div className="p-8">Loading or no active company...</div>;

  const needsAttention = events.filter(e => e.event_type === 'APPROVAL_REQUIRED' || e.event_type === 'INCIDENT_DETECTED' || e.event_type === 'TASK_FAILED').slice(0, 5);
  const whileAway = events.filter(e => e.event_type !== 'APPROVAL_REQUIRED' && e.event_type !== 'INCIDENT_DETECTED').slice(0, 5);

  const execs = agents.filter(a => a.name.startsWith('AI '));
  const workers = agents.filter(a => !a.name.startsWith('AI '));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{workspace.name} Dashboard</h1>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
          <span className="text-sm font-medium">COMPANY HEALTH:</span>
          <span className="text-green-600 font-bold flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Healthy</span>
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
                {needsAttention.map((e, i) => (
                  <li key={i} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-amber-100">
                    <span className="text-sm text-gray-700">{formatEventText(e, tasks)}</span>
                    <Button variant="outline" size="sm" className="ml-4 shrink-0 text-amber-700 border-amber-300 hover:bg-amber-100">Review</Button>
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
              <p className="text-gray-500 italic">No activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {whileAway.map((e, i) => (
                  <li key={i} className="flex items-start text-sm text-gray-600">
                    <span className="text-green-500 mr-2">✓</span>
                    {formatEventText(e, tasks)}
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
            <Card key={ex.id} className="shadow-sm border-t-4 border-t-blue-500">
              <CardContent className="pt-6">
                <div className="font-bold text-lg">{ex.name}</div>
                <div className="flex items-center mt-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-sm text-gray-600">{ex.status === 'idle' ? 'Operating' : ex.status}</span>
                </div>
              </CardContent>
            </Card>
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
