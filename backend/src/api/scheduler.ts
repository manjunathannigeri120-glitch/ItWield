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
      const next_run_at = calculateNextRunAt(workflow.definition, workflow.status);
      if (!next_run_at) continue;

      const { data: claimed, error: updateError } = await supabase
        .from('workflows')
        .update({ next_run_at })
        .eq('id', workflow.id)
        .lte('next_run_at', new Date().toISOString())
        .select()
        .single();

      if (updateError || !claimed) continue; // Concurrency claim failed

      console.log(`[Scheduler] Invoking CEO for observation ${workflow.name}`);
      triggeredCount++;

      CEOService.run(
        supabase,
        workflow.workspace_id,
        `A scheduled observation "${workflow.name}" (ID: ${workflow.id}) has triggered. Delegate a task to execute this workflow so we can observe the results.`,
        'service_role'
      ).catch(err => console.error(`[Scheduler] CEO invocation failed for ${workflow.id}:`, err));
    }

    return res.json({ triggered: triggeredCount });
  } catch (err: any) {
    console.error('[Scheduler] Tick error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export const schedulerRouter = router;
