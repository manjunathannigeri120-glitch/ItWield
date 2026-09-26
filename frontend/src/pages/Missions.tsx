import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Target, Plus, ChevronRight, Activity, Loader2 } from 'lucide-react';

export function Missions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [workspace, setWorkspace] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'GET_CUSTOMERS',
    objective: '',
    success_criteria: ''
  });

  useEffect(() => {
    api.get('/workspaces').then(res => {
      const ws = res.data.find((w: any) => w.status === 'operating' || w.status === 'ACTIVE');
      if (ws) setWorkspace(ws);
    });
  }, []);

  const { data: missions, isLoading } = useQuery({
    queryKey: ['missions', workspace?.id],
    queryFn: async () => {
      if (!workspace) return [];
      const res = await api.get(`/command-center/${workspace.id}?limit=50`);
      return res.data.activeMissions;
    },
    enabled: !!workspace
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/workspaces/${workspace.id}/missions`, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      navigate(`/missions/${data.id}`);
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.objective) return;
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Missions</h1>
          <p className="text-muted-foreground mt-2">Assign objectives to your AI CEO.</p>
        </div>
        <Button onClick={() => setShowNew(!showNew)}>
          <Plus className="w-4 h-4 mr-2" /> Start New Mission
        </Button>
      </div>

      {showNew && (
        <Card className="mb-8 border-2 border-slate-900 shadow-md">
          <CardHeader>
            <CardTitle>What should your AI company accomplish?</CardTitle>
            <CardDescription>The AI CEO will break this down into actionable tasks and route them to your workforce.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mission Title</label>
                  <Input value={formData.title} onChange={(e: any) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Q4 Customer Outreach" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mission Type</label>
                  <select className="w-full border p-2 rounded" value={formData.type} onChange={(e: any) => setFormData({...formData, type: e.target.value})}>
  <option value="GET_CUSTOMERS">Get Customers</option>
  <option value="UNDERSTAND_COMPETITORS">Understand Competitors</option>
  <option value="IMPROVE_PRODUCT">Improve Product</option>
  <option value="MONITOR_BUSINESS">Monitor Business</option>
  <option value="REDUCE_MANUAL_WORK">Reduce Manual Work</option>
</select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Objective (Detailed Context)</label>
                <textarea 
                  className="min-h-[100px]" 
                  value={formData.objective} 
                  onChange={(e: any) => setFormData({...formData, objective: e.target.value})} 
                  placeholder="Explain exactly what you want the AI to achieve. e.g., Find 50 SaaS founders on LinkedIn, research their recent funding, and draft personalized outreach emails." 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Success Criteria (Optional)</label>
                <Input value={formData.success_criteria} onChange={(e: any) => setFormData({...formData, success_criteria: e.target.value})} placeholder="e.g. 50 drafted emails waiting for approval" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
                <Button type="submit" disabled={!formData.title || !formData.objective || createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Launch Mission
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {(!missions || missions.length === 0) && !showNew ? (
        <Card className="border-dashed border-2 bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Target className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Create your first business mission.</h3>
            <p className="text-slate-500 mb-6 max-w-sm">Missions are high-level goals that the AI CEO plans and executes using the workforce.</p>
            <Button onClick={() => setShowNew(true)}>Start a Mission</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {missions?.map((m: any) => (
            <Link key={m.id} to={`/missions/${m.id}`}>
              <Card className="hover:border-slate-400 transition-colors cursor-pointer">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${m.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{m.title}</h3>
                      <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <span className="font-semibold uppercase text-xs">{m.type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span className={m.status === 'ACTIVE' ? 'text-blue-600' : 'text-slate-500'}>{m.status}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-400" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
