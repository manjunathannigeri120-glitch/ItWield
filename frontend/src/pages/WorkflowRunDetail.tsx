import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from 'react-router-dom';

export function WorkflowRunDetail() {
  const { id, runId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { data: workflow } = useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const res = await api.get(`/workflows/${id}`);
      return res.data;
    }
  });

  const { data: run, isLoading } = useQuery({
    queryKey: ['workflow_run', id, runId],
    queryFn: async () => {
      const res = await api.get(`/workflows/${id}/runs/${runId}`);
      return res.data;
    },
    refetchInterval: (query) => query.state.data?.status === 'running' ? 2000 : false
  });

  const retryMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      await api.post(`/workflows/${id}/runs/${runId}/retry`, { nodeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow_run', id, runId] });
    }
  });

  if (isLoading || !run || !workflow) return <div className="p-8">Loading execution...</div>;

  let totalDuration = '-';
  if (run.started_at && run.completed_at) {
    const ms = new Date(run.completed_at).getTime() - new Date(run.started_at).getTime();
    totalDuration = `${(ms / 1000).toFixed(2)}s`;
  }

  const selectedLog = selectedIndex !== null ? run.execution_log?.[selectedIndex] : null;

  // Determine if a node is the LATEST attempt and if it's failed, to allow retry
  const canRetry = (nodeId: string, status: string, attempt: number) => {
    if (run.status === 'running') return false;
    if (status !== 'failed') return false;
    if (attempt >= 3) return false;
    // Check if there is a newer attempt for this node
    const hasNewer = run.execution_log?.some((l: any) => l.node_id === nodeId && l.attempt > attempt);
    return !hasNewer;
  };

  return (
    <div className="p-8 flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Execution: {run.id.slice(0,8)}</h1>
          <Button variant="link" className="p-0 text-muted-foreground" onClick={() => navigate(`/workflows/${id}/runs`)}>&larr; Back to Runs</Button>
        </div>
        <div className="text-right">
          <div className={`font-bold capitalize ${run.status === 'completed' ? 'text-green-500' : run.status === 'failed' ? 'text-red-500' : 'text-blue-500'}`}>{run.status}</div>
          <div className="text-sm text-muted-foreground">Duration: {totalDuration}</div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Step List */}
        <div className="w-1/3 border rounded bg-card overflow-y-auto p-4 space-y-2">
          <h3 className="font-bold mb-4">Execution Steps</h3>
          {run.execution_log?.map((step: any, idx: number) => {
            let duration = '-';
            if (step.started_at && step.completed_at) {
              duration = `${((new Date(step.completed_at).getTime() - new Date(step.started_at).getTime()) / 1000).toFixed(2)}s`;
            }
            const isFailed = step.status === 'failed';
            const isRunning = step.status === 'running';
            return (
              <div 
                key={idx} 
                onClick={() => setSelectedIndex(idx)}
                className={`p-3 border rounded cursor-pointer hover:bg-muted/50 ${selectedIndex === idx ? 'ring-2 ring-primary' : ''} ${isFailed ? 'border-red-500/50' : isRunning ? 'border-blue-500/50' : 'border-green-500/30'}`}
              >
                <div className="flex justify-between">
                  <span className="font-semibold text-sm">{step.node_type}</span>
                  <span className="text-xs text-muted-foreground">{duration}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className={`text-xs capitalize ${isFailed ? 'text-red-500' : isRunning ? 'text-blue-500 animate-pulse' : 'text-green-500'}`}>
                    {isFailed ? '✕ Failed' : isRunning ? '● Running' : '✓ Completed'}
                  </div>
                  {step.attempt && <span className="text-xs text-muted-foreground">Attempt {step.attempt}/3</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Node Detail */}
        <div className="w-2/3 border rounded bg-card overflow-y-auto p-4">
          {selectedLog ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold">Node Details: {selectedLog.node_type}</h3>
                {canRetry(selectedLog.node_id, selectedLog.status, selectedLog.attempt || 1) && (
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => retryMutation.mutate(selectedLog.node_id)}
                    disabled={retryMutation.isPending}
                  >
                    {retryMutation.isPending ? 'Retrying...' : 'Retry Step'}
                  </Button>
                )}
              </div>
              
              {selectedLog.error && (
                <div>
                  <h4 className="text-xs font-bold text-red-500 uppercase">Error</h4>
                  <pre className="bg-red-500/10 text-red-600 p-3 rounded text-sm whitespace-pre-wrap mt-1 border border-red-500/20">{selectedLog.error}</pre>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Interpolated Input</h4>
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto mt-1">{JSON.stringify(selectedLog.input, null, 2)}</pre>
              </div>

              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Output Result</h4>
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto mt-1">{JSON.stringify(selectedLog.output, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a step to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
