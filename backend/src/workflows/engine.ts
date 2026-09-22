import { SupabaseClient } from '@supabase/supabase-js';
import { AgentRuntime } from '../agents/runtime';
import { HttpRequestTool } from '../tools/httpRequest';
import { ActionRegistry } from './actions/ActionRegistry';

export class WorkflowEngine {
  static async run(
    supabase: SupabaseClient | null,
    workflow: any,
    runId: string,
    triggerData: any,
    userId: string
  ) {
    const execution_log: any[] = [];
    const context: any = { trigger: triggerData, steps: {} };
    const { status, error, output } = await this.executeLoop(supabase, workflow, runId, workflow.definition.startNode, context, execution_log, userId);
    return { status, error, execution_log, output };
  }

  static async retry(
    supabase: SupabaseClient | null,
    workflow: any,
    runId: string,
    retryNodeId: string,
    userId: string
  ) {
    if (!supabase) throw new Error('Supabase required for retry');
    const { data: run, error } = await supabase.from('workflow_runs').select('*').eq('id', runId).single();
    if (error || !run) throw new Error('Execution not found');
    if (run.status === 'running') throw new Error('Execution is currently running');

    const execution_log = run.execution_log || [];
    const context: any = { trigger: run.trigger_data || {}, steps: {} };

    // Restore context from successful steps
    for (const step of execution_log) {
      if (step.status === 'completed') {
        context.steps[step.node_id] = { output: step.output };
      }
    }

    // Check retry limits (max 3 attempts total)
    const attempts = execution_log.filter((s: any) => s.node_id === retryNodeId).length;
    if (attempts >= 3) throw new Error('Retry limit reached');

    const { status, error: execError } = await this.executeLoop(supabase, workflow, runId, retryNodeId, context, execution_log, userId);
    return { status, error: execError };
  }

  private static async executeLoop(
    supabase: SupabaseClient | null,
    workflow: any,
    runId: string,
    startNodeId: string,
    context: any,
    execution_log: any[],
    userId: string
  ) {
    let status = 'completed';
    let error = null;

    let heartbeatInterval: any;
    if (supabase) {
      heartbeatInterval = setInterval(async () => {
        try {
          const newLease = new Date(Date.now() + 15 * 60000).toISOString();
          const { data, error, count } = await supabase
            .from('tasks')
            .update({ execution_lease_until: newLease })
            .eq('workflow_run_id', runId)
            .eq('status', 'RUNNING')
            .select('id');

          if (error) {
            console.error('[WorkflowEngine] Heartbeat failed:', error.message);
          } else if (!data || data.length === 0) {
            console.log(`[WorkflowEngine] Heartbeat affected 0 rows for run ${runId}. Task may no longer be RUNNING.`);
          } else {
             // successfully renewed
          }
        } catch (err) {
          console.error('[WorkflowEngine] Heartbeat threw error:', err);
        }
      }, 5 * 60000);
    }

    try {
      const updateRunStatus = async (st: string, err?: any) => {
      if (supabase) {
        const { error: updErr } = await supabase.from('workflow_runs')
          .update({ status: st, error: err, execution_log, completed_at: new Date().toISOString() })
          .eq('id', runId);
        if (updErr) {
          console.error('[WorkflowEngine] Failed to update run status:', updErr);
        }
      }
    };

    if (supabase) {
      await supabase.from('workflow_runs').update({ status: 'running' }).eq('id', runId);
    }

    try {
      const nodes = workflow.definition.nodes || [];
      const MAX_NODES = 50;
      let currentNodeId = startNodeId;
      let stepCount = 0;

      while (currentNodeId && stepCount < MAX_NODES) {
        stepCount++;
        const node = nodes.find((n: any) => n.id === currentNodeId);
        if (!node) break;

        // Calculate attempt number
        const previousAttempts = execution_log.filter((s: any) => s.node_id === node.id).length;
        const attempt = previousAttempts + 1;

        const stepLog: any = {
          node_id: node.id,
          node_type: node.type,
          attempt,
          started_at: new Date().toISOString(),
          status: 'running',
          input: null,
          output: null,
          error: null
        };
        execution_log.push(stepLog);

        const redact = (obj: any): any => {
          if (!obj) return obj;
          if (typeof obj === 'string') {
            if (/bearer\s+[a-zA-Z0-9-_\.]+/i.test(obj)) return '********';
            if (/sk-[a-zA-Z0-9]{20,}/.test(obj)) return '********';
            return obj;
          }
          if (Array.isArray(obj)) return obj.map(redact);
          if (typeof obj === 'object') {
            const copy = { ...obj };
            for (const k in copy) {
              if (k.toLowerCase().includes('key') || k.toLowerCase().includes('password') || k.toLowerCase().includes('token') || k.toLowerCase() === 'authorization') {
                copy[k] = '********';
              } else {
                copy[k] = redact(copy[k]);
              }
            }
            return copy;
          }
          return obj;
        };

        try {
          // Interpolate config
          const configStr = JSON.stringify(node.config || {}).replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
            return path.split('.').reduce((acc: any, part: string) => acc && acc[part], context) || '';
          });
          const config = JSON.parse(configStr);
          stepLog.input = redact(config);

          // Execute Node
          let output: any = null;
          let nextNodeId = node.next;

          if (node.type.startsWith('trigger_')) {
            output = context.trigger || {};
          } else {
            const action = ActionRegistry.get(node.type);
            if (action) {
              output = await action.execute(config, {
                supabase,
                runId,
                userId,
                workspaceId: workflow.workspace_id,
                attempt
              });

              if (node.type === 'control_condition') {
                nextNodeId = output.evaluated_true ? config.true_next : config.false_next;
              }
            } else {
              output = { error: `Action type ${node.type} not registered` };
            }
          }

          context.steps[node.id] = { output };
          stepLog.output = redact(output);
          stepLog.status = 'completed';
          stepLog.completed_at = new Date().toISOString();
          currentNodeId = nextNodeId;
          
        } catch (err: any) {
          stepLog.status = 'failed';
          stepLog.error = err.message;
          stepLog.completed_at = new Date().toISOString();
          throw err; 
        }
      }
      
      if (stepCount >= MAX_NODES) throw new Error('Max nodes exceeded (infinite loop protection)');
      
    } catch (err: any) {
      status = 'failed';
      error = err.message;
    }

    const finalOutput = execution_log.length > 0 ? execution_log[execution_log.length - 1].output : null;
    await updateRunStatus(status, error);
    return { status, error, output: finalOutput };
  } finally {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  }
  }
}
