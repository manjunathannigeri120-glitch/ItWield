import { Router } from 'express';
import { getServiceSupabase } from '../db/supabaseClient';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { calculateNextRunAt } from '../workflows/scheduler';
import { CEOService } from '../services/CEOService';
import { IntelligenceService } from '../services/IntelligenceService';

const router = Router();

// Minimal middleware to protect scheduler
function requireSchedulerAuth(req: any, res: any, next: any) {
  const token = req.headers['authorization'];
  if (token !== `Bearer ${process.env.SCHEDULER_SECRET || 'dev-secret'}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
}

router.post('/tick', requireSchedulerAuth, async (req: any, res: any) => {
  const supabase = getServiceSupabase();
  if (!supabase) return res.status(500).json({ ok: false, error: 'Internal tick error' });

  try {
    const { data: candidates, error: findError } = await supabase
      .from('workflows')
      .select('id, name, definition, status, workspace_id')
      .eq('status', 'active')
      .lte('next_run_at', new Date().toISOString())
      .limit(10);

    if (findError) {
      console.error('[Scheduler] Error fetching workflows:', findError);
    }

    let triggeredCount = 0;

    if (candidates && candidates.length > 0) {
      for (const workflow of candidates) {
      const wid = (workflow.workspace_id || '').trim();
      const ZERO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';
      
      if (wid === ZERO_WORKSPACE_ID) {
        console.warn(`[Scheduler] Skipping zero-UUID workspace workflow ${workflow.id}`);
        await supabase.from('workflows').update({ status: 'suspended', next_run_at: null }).eq('id', workflow.id);
        continue;
      }

      // Check if workspace exists
      const { data: wsData, error: wsError } = await supabase.from('workspaces').select('id').eq('id', wid).single();
      // PGRST116: 0 rows, 22P02: invalid uuid syntax
      if (!wsData || (wsError && ((wsError as any).code === 'PGRST116' || (wsError as any).code === '22P02'))) { 
        console.warn(`[Scheduler] Workspace ${wid} does not exist for workflow ${workflow.id}. Suspending.`);
        await supabase.from('workflows').update({ status: 'suspended', next_run_at: null }).eq('id', workflow.id);
        continue;
      }

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
      const { error: claimEvtErr } = await supabase.from('task_events').insert({
        task_id: null, // no task yet; workflow.id violates FK constraint on tasks(id)
        workspace_id: workflow.workspace_id,
        event_type: 'OBSERVATION_CLAIMED',
        details: { workflow_id: workflow.id, lease_timeout, actual_next_run_at }
      });
      if (claimEvtErr) console.error('[Scheduler] Failed to log OBSERVATION_CLAIMED event:', claimEvtErr);

      CEOService.run(
        supabase,
        workflow.workspace_id,
        `SCHEDULED_OBSERVATION:WORKFLOW_EXECUTION - Workflow "${workflow.name}" (ID: ${workflow.id}) has triggered. Delegate a task to execute this.`,
        'service_role',
        workflow.id,
        actual_next_run_at
      ).catch(err => console.error(`[Scheduler] CEO invocation failed for ${workflow.id}:`, err));
      }
    }

    // 2b. Recover crashed/stuck RUNNING tasks via execution_lease_until
    // Worker processes heartbeat this lease. If it expires, the process crashed or hung.
    const now = new Date().toISOString();
    const { data: staleTasks } = await supabase
      .from('tasks')
      .update({ status: 'PENDING', error: 'Execution lease expired. Worker crash assumed. Retrying.' })
      .eq('status', 'RUNNING')
      .not('execution_lease_until', 'is', null)
      .lt('execution_lease_until', now)
      .select('id, workspace_id');

    if (staleTasks && staleTasks.length > 0) {
      for (const t of staleTasks) {
        console.log(`[Scheduler] Recovered stale RUNNING task ${t.id}`);
        await supabase.from('task_events').insert({
          task_id: t.id,
          workspace_id: t.workspace_id,
          event_type: 'RETRY',
          details: { error: 'Execution lease expired. Worker crash assumed. Retrying.' }
        });
      }
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

    // 3b. Recover stuck workspaces (crash recovery for CEO evaluations)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
    const { data: stuckWs } = await supabase
      .from('workspaces')
      .update({ status: 'operating' })
      .in('status', ['evaluating', 'ceo_evaluating'])
      .lt('updated_at', fifteenMinsAgo)
      .select('id');
      
    if (stuckWs && stuckWs.length > 0) {
      console.log(`[Scheduler] Recovered ${stuckWs.length} stuck workspaces.`);
    }

    // 4. Intelligence Loop & 5. Autonomous Observation
    const { data: activeWorkspaces } = await supabase.from('workspaces').select('id, status').eq('status', 'operating');
    if (activeWorkspaces) {
      for (const w of activeWorkspaces) {
        try {
          const snapshot = await IntelligenceService.generateSnapshot(supabase, w.id);
          const anomalies = IntelligenceService.detectAnomalies(snapshot);
          const changed = await IntelligenceService.syncIncidents(supabase, w.id, anomalies, snapshot.incidents);
          
          if (changed) {
            console.log(`[Scheduler] Anomalies changed for workspace ${w.id}, triggering CEO`);
            CEOService.run(supabase, w.id, 'Review new company incidents and anomalies.').catch(console.error);
            triggeredCount++;
          }
          
          // Phase 1-3 - Trigger deterministic observations
          await CEOService.observeWorkspace(supabase, w.id);

        } catch (e) {
          console.error('[Scheduler] Intelligence/Observation error for workspace', w.id, e);
        }
      }
    }

    return res.status(200).json({ ok: true, triggered: triggeredCount });
  } catch (err: any) {
    console.error('[Scheduler] Tick error:', err);
    return res.status(500).json({ ok: false, error: 'Internal tick error' });
  }
});

export const schedulerRouter = router;
