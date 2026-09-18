import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Agents() {
  // Hardcoded for V0.1 until workspace selector is built
  const workspaceId = '00000000-0000-0000-0000-000000000000'; 
  const navigate = useNavigate();

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents', workspaceId],
    queryFn: async () => {
      // Mocking for now since we don't have workspace selection perfectly wired up yet in the UI
      try {
        const res = await api.get(`/workspaces`);
        if (res.data.length > 0) {
          const wsId = res.data[0].id;
          const agentsRes = await api.get(`/agents/workspace/${wsId}`);
          return agentsRes.data;
        }
        return [];
      } catch (err) {
        console.error(err);
        return [];
      }
    }
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">Manage your AI workforce</p>
        </div>
        <Button onClick={() => navigate('/agents/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {isLoading ? (
        <div>Loading agents...</div>
      ) : agents?.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card border-dashed">
          <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No agents found</h3>
          <p className="text-muted-foreground mb-4">You haven't created any agents yet.</p>
          <Button onClick={() => navigate('/agents/new')}>Create your first agent</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents?.map((agent: any) => (
            <Card key={agent.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/agents/${agent.id}/chat`)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  {agent.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">{agent.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span className="capitalize">{agent.model}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {agent.status}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
