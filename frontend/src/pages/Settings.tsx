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



function PlanSettings({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();

  const { data: planData, isLoading } = useQuery({
    queryKey: ['plan', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}/plan`);
      return res.data;
    },
    enabled: !!workspaceId
  });

  const cancelMutation = useMutation({
    mutationFn: async () => await api.post(`/workspaces/${workspaceId}/subscription/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plan', workspaceId] })
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => await api.post(`/workspaces/${workspaceId}/subscription/reactivate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plan', workspaceId] })
  });

  if (!workspaceId) return null;
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading plan data...</div>;

  const { subscription, usage } = planData || {};

  return (
    <Card className="mt-8 border-2 border-slate-900 shadow-md">
      <CardHeader>
        <CardTitle>Plan & Billing</CardTitle>
        <CardDescription>Manage your subscription and limits.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-semibold text-lg">{subscription?.plan_id?.replace('_', ' ') || 'SOLO BUILDER'} Plan</h3>
            <span className={`px-2 py-1 text-xs font-bold rounded ${
              subscription?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
              subscription?.status === 'PAST_DUE' ? 'bg-amber-100 text-amber-700' :
              subscription?.status === 'CANCELED' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {subscription?.status || 'ACTIVE'}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {subscription?.cancel_at_period_end 
              ? `Cancels at the end of billing period (${new Date(subscription?.current_period_end).toLocaleDateString()})` 
              : `Renews on ${new Date(subscription?.current_period_end).toLocaleDateString()}`}
          </p>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-md border">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-sm">AI Workers Usage</span>
            <span className="text-sm font-semibold">{usage?.metrics?.workers?.current || 0} / {usage?.metrics?.workers?.limit === -1 ? 'Unlimited' : usage?.metrics?.workers?.limit}</span>
          </div>
          {usage?.metrics?.workers?.limit !== -1 && (
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, ((usage?.metrics?.workers?.current || 0) / (usage?.metrics?.workers?.limit || 25)) * 100)}%` }}></div>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-4 mb-2">
            <span className="font-medium text-sm">Mission Usage</span>
            <span className="text-sm font-semibold">{usage?.metrics?.missions?.current || 0} / {usage?.metrics?.missions?.limit === -1 ? 'Unlimited' : usage?.metrics?.missions?.limit}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={() => alert('Billing portal integration pending in next milestone.')}>
            Upgrade Plan
          </Button>
          {subscription?.cancel_at_period_end ? (
            <Button variant="outline" className="flex-1 border-green-200 text-green-700 hover:bg-green-50" onClick={() => reactivateMutation.mutate()} disabled={reactivateMutation.isPending}>
              {reactivateMutation.isPending ? 'Processing...' : 'Reactivate Subscription'}
            </Button>
          ) : (
            <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => { if (confirm('Cancel subscription? You will retain access until the end of the billing period.')) cancelMutation.mutate() }} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? 'Processing...' : 'Cancel Subscription'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
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
        {workspaces && workspaces.length > 0 && <PlanSettings workspaceId={workspaces[0].id} />}

    </div>
  );
}

function ConnectionsManager() {
  const queryClient = useQueryClient();
  const [activeWorkspaceId] = useState(() => localStorage.getItem('itwield_workspace_id') || '');

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
    localStorage.setItem('itwield_oauth_provider', provider);
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
        <Button onClick={() => handleOAuthConnect('github')} variant="outline">Connect GitHub</Button>
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
                  <span className="text-xs text-muted-foreground mt-1">Status: {c.status === 'active' ? 'Connected' : 'Action Required'}</span>
                  <span className="text-xs text-muted-foreground">Last updated: {new Date(c.updated_at).toLocaleString()}</span>
                  {c.metadata?.capabilities && <span className="text-xs text-muted-foreground">Capabilities: {c.metadata.capabilities.join(', ')}</span>}
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
