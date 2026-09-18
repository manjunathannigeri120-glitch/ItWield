import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from 'react-router-dom';

export function WorkflowRuns() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: workflow } = useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const res = await api.get(`/workflows/${id}`);
      return res.data;
    }
  });

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['workflow_runs', id],
    queryFn: async () => {
      const res = await api.get(`/workflows/${id}/runs`);
      return res.data;
    },
    refetchInterval: 3000 // Simple polling for V0.6
  });

  if (isLoading) return <div className="p-8">Loading runs...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executions: {workflow?.name}</h1>
          <Button variant="link" className="p-0 text-muted-foreground" onClick={() => navigate('/workflows')}>&larr; Back to Workflows</Button>
        </div>
      </div>

      <div className="border rounded-md shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-3">Status</th>
              <th className="p-3">Started</th>
              <th className="p-3">Duration</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-muted-foreground">No executions yet.</td>
              </tr>
            )}
            {runs.map((run: any) => {
              let duration = '-';
              if (run.started_at && run.completed_at) {
                const ms = new Date(run.completed_at).getTime() - new Date(run.started_at).getTime();
                duration = `${(ms / 1000).toFixed(2)}s`;
              }

              let statusColor = 'text-gray-500';
              if (run.status === 'completed') statusColor = 'text-green-500';
              if (run.status === 'failed') statusColor = 'text-red-500';
              if (run.status === 'running') statusColor = 'text-blue-500 animate-pulse';

              return (
                <tr key={run.id} className="border-b hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/workflows/${id}/runs/${run.id}`)}>
                  <td className={`p-3 font-medium capitalize ${statusColor}`}>
                    {run.status === 'completed' && '✓ '}
                    {run.status === 'failed' && '✕ '}
                    {run.status === 'running' && '● '}
                    {run.status}
                  </td>
                  <td className="p-3">{new Date(run.started_at).toLocaleString()}</td>
                  <td className="p-3">{duration}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
