import { Router } from 'express';
import { getServiceSupabase } from '../db/supabaseClient';
import { WorkflowEngine } from '../workflows/engine';

const router = Router();

// ─── Webhook Rate Limiter ─────────────────────────────────────────────────────
// Simple in-memory per-workflow rate limit: 60 requests/min
const webhookRateMap = new Map<string, { count: number; resetAt: number }>();
function checkWebhookRateLimit(workflowId: string): boolean {
  const now = Date.now();
  const entry = webhookRateMap.get(workflowId);
  if (!entry || now > entry.resetAt) {
    webhookRateMap.set(workflowId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count++;
  return true;
}

/**
 * POST /api/v1/webhooks/:workflowId
 *
 * External webhook trigger. No user auth token required (external callers),
 * but we:
 *  - validate the workflow exists and is ACTIVE
 *  - confirm workspace ownership via DB (workspace owner_id lookup)
 *  - apply rate limiting per workflow
 *  - never expose internal DB errors
 *
 * Limitation: no HMAC signature verification for generic webhooks.
 * See KNOWN LIMITATIONS in v1.3-report.md.
 */
router.post('/:workflowId', async (req, res) => {
  const { workflowId } = req.params;

  // Basic input validation
  if (!workflowId || typeof workflowId !== 'string' || workflowId.length > 100) {
    return res.status(400).json({ error: 'Invalid workflow ID' });
  }

  // Rate limiting
  if (!checkWebhookRateLimit(workflowId)) {
    return res.status(429).json({ error: 'Too many webhook requests. Please slow down.' });
  }

  // Payload is already limited to 64kb via middleware in index.ts
  const triggerData = req.body || {};

  const supabase = getServiceSupabase();
  if (!supabase) {
    // Development mock
    return res.status(200).json({ runId: 'mock-run', message: 'Mock webhook received' });
  }

  try {
    // Load workflow via service client (external callers have no JWT)
    const { data: wf, error: wfErr } = await supabase
      .from('workflows')
      .select('id, status, definition, workspace_id')
      .eq('id', workflowId)
      .single();

    if (wfErr || !wf) {
      // Return 404 without leaking whether the workflow exists or not
      return res.status(404).json({ error: 'Workflow not found or not accessible' });
    }

    if (wf.status !== 'active') {
      return res.status(409).json({ error: 'Workflow is not active' });
    }

    // Resolve workspace owner for the execution user context
    const { data: ws } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', wf.workspace_id)
      .single();

    const { data: run, error: runErr } = await supabase
      .from('workflow_runs')
      .insert({
        workflow_id: wf.id,
        trigger_data: triggerData,
        status: 'pending'
      })
      .select('id')
      .single();

    if (runErr || !run) {
      console.error('[Webhook] Failed to create run:', runErr?.message);
      return res.status(500).json({ error: 'Failed to initiate workflow run' });
    }

    // Fire and forget — errors are logged, not exposed
    WorkflowEngine.run(
      supabase,
      wf,
      run.id,
      triggerData,
      ws?.owner_id || 'webhook'
    ).catch(err => console.error(`[Webhook] Execution error for ${workflowId}:`, err.message));

    res.json({ runId: run.id, message: 'Workflow triggered via webhook' });
  } catch (err: any) {
    // Never expose raw error details to external callers
    console.error('[Webhook] Error:', err.message);
    res.status(500).json({ error: 'Internal error processing webhook' });
  }
});

export default router;
