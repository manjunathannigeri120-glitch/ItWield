import { Router } from 'express';
import { getServiceSupabase } from '../db/supabaseClient';
import { calculateNextRunAt } from '../workflows/scheduler';
import { CEOService } from '../services/CEOService';

const router = Router();

// Minimal middleware to protect scheduler
function requireSchedulerAuth(req: any, res: any, next: any) {
  const token = req.headers['authorization'];
  if (token !== `Bearer ${process.env.SCHEDULER_SECRET || 'dev-secret'}`) {
    return res.status(401).json({ error: 'Unauthorized scheduler trigger' });
  }
  next();
}

router.post('/tick', requireSchedulerAuth, async (req: any, res: any) => {
  const supabase = getServiceSupabase();
  if (!supabase) return res.status(500).json({ error: 'Database not available' });

  try {
    const { data: candidates, error: findError } = await supabase
      .from('workflows')
      .select('id, name, definition, status, workspace_id')
      .eq('status', 'active')
      .lte('next_run_at', new Date().toISOString())
      .limit(10);

    if (findError || !candidates || candidates.length === 0) {
      return res.json({ triggered: 0 });
    }

    let triggeredCount = 0;

    for (const workflow of candidates) {
      // 1. Calculate the actual next run time
      const actual_next_run_at = calculateNextRunAt(workflow.definition, workflow.status);
      if (!actual_next_run_at) continue;

      // 2. Claim with a 5-minute lease
      const lease_timeout = new Date(Date.now() + 5 * 60000).toISOString();

      const { data: claimed, error: updateError } = await supabase
        .from('workflows')
        .update({ next_run_at: lease_timeout })
        .eq('id', workflow.id)
        .lte('next_run_at', new Date().toISOString())
        .select()
        .single();

      if (updateError || !claimed) continue; // Concurrency claim failed

      console.log(`[Scheduler] Claimed observation ${workflow.name} (Lease until ${lease_timeout})`);
      triggeredCount++;

      // Log claim
      await supabase.from('task_events').insert({
        task_id: workflow.id, // using workflow id for lack of task id yet
        workspace_id: workflow.workspace_id,
        event_type: 'OBSERVATION_CLAIMED',
        details: { lease_timeout, actual_next_run_at }
      });

      CEOService.run(
        supabase,
        workflow.workspace_id,
        `A scheduled observation "${workflow.name}" (ID: ${workflow.id}) has triggered. Delegate a task to execute this workflow so we can observe the results.`,
        'service_role',
        workflow.id,
        actual_next_run_at
      ).catch(err => console.error(`[Scheduler] CEO invocation failed for ${workflow.id}:`, err));
    }

    // 3. Recover stuck PENDING tasks (crash recovery for retries & follow-ups)
    const { data: stuckWorkspaces } = await supabase
      .from('tasks')
      .select('workspace_id')
      .eq('status', 'PENDING')
      .limit(10);

    if (stuckWorkspaces && stuckWorkspaces.length > 0) {
      const uniqueWids = [...new Set(stuckWorkspaces.map((t: any) => t.workspace_id))];
      for (const wid of uniqueWids) {
        console.log(`[Scheduler] Recovering pending tasks for workspace ${wid}`);
        CEOService.run(supabase, wid as string, 'Execute pending tasks').catch(console.error);
        triggeredCount++;
      }
    }

    return res.json({ triggered: triggeredCount });
  } catch (err: any) {
    console.error('[Scheduler] Tick error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export const schedulerRouter = router;
