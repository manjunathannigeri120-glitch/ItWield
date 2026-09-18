import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';

import { WorkflowEditor } from '@/components/workflow/WorkflowEditor';
import { AIWorkflowGenerator } from '@/components/workflow/AIWorkflowGenerator';

export function Workflows() {
  const queryClient = useQueryClient();
  const [newWfName, setNewWfName] = useState('');
  const [editingWf, setEditingWf] = useState<any>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  
  // Fetch workspace
  useQuery({
    queryKey: ['workspace'],
    queryFn: async () => {
      const res = await api.get(`/workspaces`);
      if (res.data.length > 0) {
        const wsId = res.data[0].id;
        setWorkspaceId(wsId);
        localStorage.setItem('dovia_workspace_id', wsId);
      }
      return res.data;
    }
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await api.get(`/workflows/workspace/${workspaceId}`);
      return res.data;
    },
    enabled: !!workspaceId
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; definition?: any }) => {
      const res = await api.post(`/workflows/workspace/${workspaceId}`, {
        name: payload.name,
        definition: payload.definition || { startNode: null, nodes: [] }
      });
      return res.data;
    },
    onSuccess: (wf) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      // If this came from the AI generator, open the editor immediately
      if (wf && wf.id) setEditingWf(wf);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (wf: any) => {
      const res = await api.put(`/workflows/${wf.id}`, { name: wf.name, status: wf.status, definition: wf.definition });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setEditingWf(null);
    }
  });

  const runMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/workflows/${id}/run`, {});
      return res.data;
    },
    onSuccess: () => alert('Workflow triggered! Check Runs.')
  });

  // Called when user clicks "Load into Editor" from the AI generator
  const handleAILoad = (generated: any) => {
    setShowAIGenerator(false);
    // Create the workflow as a draft with the generated definition
    createMutation.mutate({ name: generated.name || 'AI Generated Workflow', definition: generated });
  };

  if (!workspaceId) return <div className="p-8 text-muted-foreground">Loading workspace...</div>;

  // AI Generator view
  if (showAIGenerator) {
    return (
      <div className="p-8">
        <AIWorkflowGenerator
          workspaceId={workspaceId}
          onLoad={handleAILoad}
          onCancel={() => setShowAIGenerator(false)}
        />
      </div>
    );
  }

  if (editingWf) {
    return (
      <div className="p-8 space-y-4 h-full flex flex-col">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Editing: {editingWf.name}</h1>
          <div className="flex gap-4 items-center">
            <select 
              className="border rounded p-1"
              value={editingWf.status} 
              onChange={e => updateMutation.mutate({ ...editingWf, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
        <WorkflowEditor 
          workflow={editingWf} 
          onSave={(definition) => updateMutation.mutate({ ...editingWf, definition })}
          onCancel={() => setEditingWf(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Workflows</h1>
        <div className="flex gap-2 items-center">
          <Input value={newWfName} onChange={e => setNewWfName(e.target.value)} placeholder="New workflow name..." />
          <Button onClick={() => createMutation.mutate({ name: newWfName })} disabled={!newWfName}>Create</Button>
          <Button
            variant="outline"
            onClick={() => setShowAIGenerator(true)}
            className="flex items-center gap-2 border-primary text-primary hover:bg-primary/5"
          >
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
        </div>
      </div>

      {workflows.length === 0 && (
        <div className="border-2 border-dashed rounded-xl p-12 text-center space-y-4">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No workflows yet. Create one manually or use AI to generate from a description.</p>
          <Button onClick={() => setShowAIGenerator(true)} variant="outline" className="text-primary border-primary">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map((wf: any) => (
          <div key={wf.id} className="p-4 border rounded shadow-sm flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="font-semibold">{wf.name}</span>
              <span className={`text-sm ${wf.status === 'active' ? 'text-green-500' : 'text-gray-500'}`}>{wf.status}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingWf(wf)}>Edit Graph</Button>
              <Button size="sm" onClick={() => runMutation.mutate(wf.id)}>Run Manually</Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = `/workflows/${wf.id}/runs`}>Runs</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
