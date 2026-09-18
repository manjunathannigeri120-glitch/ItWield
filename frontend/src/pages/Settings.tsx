import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Briefcase, Loader2 } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

export function Settings() {
  const queryClient = useQueryClient();
  const [newProjectName, setNewProjectName] = useState('');

  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces');
      return res.data;
    }
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post('/workspaces', { name });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setNewProjectName('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || 'Failed to create project');
    }
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      createWorkspaceMutation.mutate(newProjectName.trim());
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your projects, workspaces, and account preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects (Workspaces)</CardTitle>
          <CardDescription>
            Projects act as isolated workspaces for your agents. Agents in one project cannot access agents in another.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleCreateProject} className="flex gap-4 items-end">
            <div className="space-y-2 flex-1">
              <label htmlFor="projectName" className="text-sm font-medium">New Project Name</label>
              <Input
                id="projectName"
                placeholder="e.g. Customer Support AI"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                disabled={createWorkspaceMutation.isPending}
              />
            </div>
            <Button type="submit" disabled={!newProjectName.trim() || createWorkspaceMutation.isPending}>
              {createWorkspaceMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Project
            </Button>
          </form>

          <div className="rounded-md border">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading projects...</div>
            ) : workspaces && workspaces.length > 0 ? (
              <div className="divide-y">
                {workspaces.map((workspace) => (
                  <div key={workspace.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{workspace.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {workspace.id}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No projects found. Create one above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connections</CardTitle>
          <CardDescription>
            Connect external services to your active workspace for use in workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectionsManager />
        </CardContent>
      </Card>
    </div>
  );
}

function ConnectionsManager() {
  const queryClient = useQueryClient();
  const [activeWorkspaceId] = useState(() => localStorage.getItem('dovia_workspace_id') || '');

  const { data: connections, isLoading } = useQuery<any[]>({
    queryKey: ['connections', activeWorkspaceId],
    queryFn: async () => {
      const res = await api.get('/connections', { headers: { 'x-workspace-id': activeWorkspaceId } });
      return res.data;
    },
    enabled: !!activeWorkspaceId
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/connections/${id}`, { headers: { 'x-workspace-id': activeWorkspaceId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    }
  });

  const handleOAuthConnect = async (provider: string) => {
    localStorage.setItem('dovia_oauth_provider', provider);
    try {
      const res = await api.get(`/connections/${provider}/connect`, { headers: { 'x-workspace-id': activeWorkspaceId } });
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      } else {
        alert('Failed to initiate OAuth flow');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Error connecting');
    }
  };

  const handleConnectGoogle = () => handleOAuthConnect('google_sheets');
  const handleConnectSlack = () => handleOAuthConnect('slack');
  const handleConnectDiscord = () => handleOAuthConnect('discord');

  if (!activeWorkspaceId) {
    return <div className="text-muted-foreground text-sm">Please select an active workspace first to manage connections.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button onClick={handleConnectGoogle} variant="outline">Connect Google Sheets</Button>
        <Button onClick={handleConnectSlack} variant="outline">Connect Slack</Button>
        <Button onClick={handleConnectDiscord} variant="outline">Connect Discord</Button>
      </div>

      <div className="rounded-md border">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading connections...</div>
        ) : connections && connections.length > 0 ? (
          <div className="divide-y">
            {connections.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span className="font-medium">{c.name} ({c.provider})</span>
                  <span className="text-xs text-muted-foreground">Status: {c.status}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOAuthConnect(c.provider)}>Reconnect</Button>
                  <Button variant="destructive" size="sm" onClick={() => {
                    if (confirm('Disconnect connection?')) deleteConnectionMutation.mutate(c.id);
                  }}>Disconnect</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No connections found.
          </div>
        )}
      </div>
    </div>
  );
}
