import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AgentNew() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [model, setModel] = useState('gpt-4o-mini');
  const [tools, setTools] = useState<string[]>([]);
  const [selectedKb, setSelectedKb] = useState<string | null>(null);

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces');
      return res.data;
    }
  });

  const workspaceId = workspaces?.[0]?.id;

  const { data: kbs } = useQuery({
    queryKey: ['knowledge_bases', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await api.get(`/knowledge/workspace/${workspaceId}`);
      return res.data;
    },
    enabled: !!workspaceId
  });

  const createAgentMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!workspaceId) throw new Error('No workspace context');
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
    
    createAgentMutation.mutate({
      name,
      description,
      system_prompt: systemPrompt,
      model,
      temperature: 0.7,
      tools,
      knowledge_bases: selectedKb ? [selectedKb] : []
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">New Agent</h1>
          <p className="text-muted-foreground mt-2">Configure a new ItWield agent.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Configuration</CardTitle>
          <CardDescription>Define the agent's identity and instructions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Customer Support Agent" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Helps customers with product questions" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">System Instructions</label>
              <textarea 
                required
                value={systemPrompt} 
                onChange={e => setSystemPrompt(e.target.value)} 
                placeholder="You are a helpful customer support agent..."
                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <select 
                value={model} 
                onChange={e => setModel(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="gpt-4o">GPT-4o (Most capable)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Faster, cheaper)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Knowledge Base</label>
              <select 
                value={selectedKb || ''} 
                onChange={e => setSelectedKb(e.target.value || null)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">None (No Knowledge Base Assigned)</option>
                {kbs?.map((kb: any) => (
                  <option key={kb.id} value={kb.id}>{kb.name}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Assigning a Knowledge Base allows the agent to search internal documents.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tools</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="web_search" 
                  checked={tools.includes('web_search')}
                  onChange={(e) => {
                    if (e.target.checked) setTools([...tools, 'web_search']);
                    else setTools(tools.filter(t => t !== 'web_search'));
                  }}
                  className="rounded border-gray-300"
                />
                <label htmlFor="web_search" className="text-sm font-medium leading-none">Web Search</label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="knowledge_search" 
                  checked={tools.includes('knowledge_search')}
                  onChange={(e) => {
                    if (e.target.checked) setTools([...tools, 'knowledge_search']);
                    else setTools(tools.filter(t => t !== 'knowledge_search'));
                  }}
                  className="rounded border-gray-300"
                />
                <label htmlFor="knowledge_search" className="text-sm font-medium leading-none">Knowledge Base Search</label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="http_request" 
                  checked={tools.includes('http_request')}
                  onChange={(e) => {
                    if (e.target.checked) setTools([...tools, 'http_request']);
                    else setTools(tools.filter(t => t !== 'http_request'));
                  }}
                  className="rounded border-gray-300"
                />
                <label htmlFor="http_request" className="text-sm font-medium leading-none">HTTP Request API</label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/agents')}>Cancel</Button>
              <Button type="submit" disabled={createAgentMutation.isPending}>{createAgentMutation.isPending ? 'Creating...' : 'Create Agent'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
