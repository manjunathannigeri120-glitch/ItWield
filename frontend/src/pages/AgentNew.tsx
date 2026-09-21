import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AgentNew() {
  const navigate = useNavigate();
  const workspaceId = '00000000-0000-0000-0000-000000000000';

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [objective, setObjective] = useState('');
  const [instructions, setInstructions] = useState('');
  const [featuresText, setFeaturesText] = useState('');

  const createAgentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/agents/workspace/${workspaceId}`, data);
      return res.data;
    },
    onSuccess: () => {
      navigate('/agents');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || error.message || 'Failed to create agent');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const features = featuresText.split(',').map(f => f.trim()).filter(f => f);

    createAgentMutation.mutate({
      name,
      description: objective,
      system_prompt: instructions,
      model: 'gpt-4o-mini',
      temperature: 0.7,
      status: 'idle',
      capabilities: {
        role,
        features,
        permissions: [],
        tools: [],
        memory: {}
      }
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">New Worker</h1>
          <p className="text-muted-foreground mt-2">Hire a new AI employee for your workforce.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Worker Configuration</CardTitle>
          <CardDescription>Define the worker's role and capabilities.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Application Monitor" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Input required value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Monitoring Specialist" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Objective</label>
              <Input required value={objective} onChange={e => setObjective(e.target.value)} placeholder="Monitor application health and identify problems." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Instructions</label>
              <textarea 
                required
                value={instructions} 
                onChange={e => setInstructions(e.target.value)} 
                placeholder="Investigate application health and report abnormal conditions..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Capabilities (comma separated)</label>
              <Input value={featuresText} onChange={e => setFeaturesText(e.target.value)} placeholder="monitoring, health_checks, error_detection, incident_reporting" />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/agents')}>Cancel</Button>
              <Button type="submit" disabled={createAgentMutation.isPending}>{createAgentMutation.isPending ? 'Hiring...' : 'Hire Worker'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
