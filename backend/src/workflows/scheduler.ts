import { getServiceSupabase } from '../db/supabaseClient';
import { WorkflowEngine } from './engine';
import parseExpression from 'cron-parser';

let schedulerInterval: NodeJS.Timeout | null = null;

function calculateNextRunAt(definition: any, status: string): string | null {
  if (status !== 'active') return null;
  const trigger = definition.nodes?.find((n: any) => n.type === 'trigger_schedule');
  if (!trigger || !trigger.config?.cron) return null;
  
  try {
    const opts = trigger.config.timezone ? { tz: trigger.config.timezone } : {};
    const interval = (parseExpression as any).parseExpression ? (parseExpression as any).parseExpression(trigger.config.cron, opts) : (parseExpression as any)(trigger.config.cron, opts);
    return interval.next().toISOString();
  } catch (err) {
    return null;
  }
}

export function startScheduler() {
  if (schedulerInterval) return;

  schedulerInterval = setInterval(async () => {
    const supabase = getServiceSupabase();
    if (!supabase) return; // Mock environment or missing credentials

    try {
      // Find one due workflow using FOR UPDATE SKIP LOCKED
      // Since supabase-js doesn't natively support raw SQL 'FOR UPDATE SKIP LOCKED' easily via the ORM,
      // we can do a lightweight version:
      // Select candidate
      const { data: candidates, error: findError } = await supabase
        .from('workflows')
        .select('id, definition, status, workspace_id')
        .eq('status', 'active')
        .lte('next_run_at', new Date().toISOString())
        .limit(10); // Check a small batch

      if (findError || !candidates || candidates.length === 0) return;

      for (const workflow of candidates) {
        // Calculate new next_run_at to "claim" it
        const next_run_at = calculateNextRunAt(workflow.definition, workflow.status);
        if (!next_run_at) continue;

        // Try to claim it by atomic update
        const { data: claimed, error: updateError } = await supabase
          .from('workflows')
          .update({ next_run_at })
          .eq('id', workflow.id)
          .lte('next_run_at', new Date().toISOString()) // concurrency check!
          .select()
          .single();

        if (updateError || !claimed) {
          // Another instance claimed it, move to next
          continue;
        }

        console.log(`[Scheduler] Triggering workflow ${workflow.id}`);

        // Create a workflow run
        const runData = {
          workflow_id: workflow.id,
          trigger_data: { source: 'schedule' },
          status: 'running'
        };

        const { data: run, error: runError } = await supabase
          .from('workflow_runs')
          .insert(runData)
          .select()
          .single();

        if (runError || !run) {
          console.error(`[Scheduler] Failed to create run for ${workflow.id}`, runError);
          continue;
        }

        // Execute asynchronously so we don't block the scheduler loop
        WorkflowEngine.run(
          supabase,
          claimed,
          run.id,
          runData.trigger_data,
          'service_role' // User ID for the agent context
        ).catch(err => console.error(`[Scheduler] Workflow execution failed for ${workflow.id}:`, err));
      }
    } catch (err) {
      console.error('[Scheduler] Tick error:', err);
    }
  }, 10000); // Check every 10 seconds

  console.log('[Scheduler] Started');
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] Stopped');
  }
}
