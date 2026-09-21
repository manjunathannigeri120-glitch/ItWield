import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Bot, Plus, Activity, AlertCircle, PlayCircle, Eye, Edit, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Agents() {
  const workspaceId = '00000000-0000-0000-0000-000000000000'; 
  const navigate = useNavigate();

  const { data: agents, isLoading, isError, error } = useQuery({
    queryKey: ['agents', workspaceId],
    queryFn: async () => {
      const agentsRes = await api.get(`/agents/workspace/${workspaceId}`);
      return agentsRes.data;
    },
    retry: false
  });

  const totalWorkers = agents?.length || 0;
  const activeWorkers = agents?.filter((a: any) => a.status === 'idle' || a.status === 'working').length || 0;
  const workingWorkers = agents?.filter((a: any) => a.status === 'working').length || 0;
  const blockedWorkers = agents?.filter((a: any) => a.status === 'blocked').length || 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Workforce</h1>
          <p className="text-muted-foreground">Manage your AI employees and capabilities</p>
        </div>
        <Button onClick={() => navigate('/agents/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Worker
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Workers</p>
              <h3 className="text-2xl font-bold">{totalWorkers}</h3>
            </div>
            <Bot className="w-8 h-8 text-muted-foreground opacity-50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Workers</p>
              <h3 className="text-2xl font-bold">{activeWorkers}</h3>
            </div>
            <Activity className="w-8 h-8 text-blue-500 opacity-50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Working</p>
              <h3 className="text-2xl font-bold">{workingWorkers}</h3>
            </div>
            <PlayCircle className="w-8 h-8 text-green-500 opacity-50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Blocked</p>
              <h3 className="text-2xl font-bold">{blockedWorkers}</h3>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
          </CardContent>
        </Card>
      </div>

      {isError ? (
        <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-md">
          <h3 className="font-bold mb-2">Database Error</h3>
          <p>{(error as any)?.response?.data?.error || (error as any)?.message || 'Failed to load agents'}</p>
        </div>
      ) : isLoading ? (
        <div>Loading workforce...</div>
      ) : agents?.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card border-dashed">
          <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No workers found</h3>
          <p className="text-muted-foreground mb-4">Your workforce is currently empty.</p>
          <Button onClick={() => navigate('/agents/new')}>Hire your first worker</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents?.map((agent: any) => {
            let caps = { role: 'Unassigned', features: [] as string[], permissions: [], tools: [] };
            if (agent.capabilities && typeof agent.capabilities === 'object' && !Array.isArray(agent.capabilities)) {
              caps = { ...caps, ...agent.capabilities };
            } else if (Array.isArray(agent.capabilities)) {
              caps.features = agent.capabilities;
            }

            return (
            <Card key={agent.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  {agent.name}
                </CardTitle>
                <div className="text-sm font-medium text-primary/80">{caps.role}</div>
                <CardDescription className="line-clamp-2 mt-1">{agent.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <div className="mb-4">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Status:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    agent.status === 'working' ? 'bg-green-100 text-green-800' :
                    agent.status === 'blocked' ? 'bg-red-100 text-red-800' :
                    agent.status === 'disabled' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Capabilities:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {caps.features?.map((f: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
                        {f}
                      </span>
                    )) || <span className="text-xs text-muted-foreground">None</span>}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t bg-muted/20 flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs"><Eye className="w-4 h-4 mr-1"/> View</Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs"><Edit className="w-4 h-4 mr-1"/> Edit</Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-destructive hover:text-destructive"><Ban className="w-4 h-4 mr-1"/> Disable</Button>
              </CardFooter>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
}
