import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { WorkflowEngine } from '../workflows/engine';
import parseExpression from 'cron-parser';
import { generateWorkflow } from '../workflows/workflowGenerator';
import { getServiceSupabase } from '../db/supabaseClient';

const router = Router();
router.use(requireAuth);

// Simple in-memory rate limiter for the generate endpoint: 10 req/min per user
const generateRateMap = new Map<string, { count: number; resetAt: number }>();
function checkGenerateRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = generateRateMap.get(userId);
  if (!entry || now > entry.resetAt) {
    generateRateMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}


const WorkflowSchema = z.object({
  name: z.string().min(1),
  status: z.string().optional(),
  definition: z.record(z.string(), z.any()).default({ startNode: null, nodes: [] })
});

function calculateNextRunAt(definition: any, status: string): string | null {
  const trigger = definition.nodes?.find((n: any) => n.type === 'trigger_schedule');
  if (!trigger || !trigger.config?.cron) return null;
  
  try {
    const opts = trigger.config.timezone ? { tz: trigger.config.timezone } : {};
    const interval = (parseExpression as any).parseExpression ? (parseExpression as any).parseExpression(trigger.config.cron, opts) : (parseExpression as any)(trigger.config.cron, opts);
    if (status !== 'active') return null; // We parse to validate, but return null if inactive
    return interval.next().toISOString();
  } catch (err: any) {
    throw new Error(`Invalid schedule configuration: ${err.message}`);
  }
}

// Create
router.post('/workspace/:workspaceId', async (req: AuthRequest, res) => {
  try {
    const { workspaceId } = req.params;
    const data = WorkflowSchema.parse(req.body);
    
    const next_run_at = calculateNextRunAt(data.definition, data.status || 'draft');
    if (!req.supabase) return res.json({ id: 'mock-wf-1', workspace_id: workspaceId, ...data, next_run_at });
    
    const { data: wf, error } = await req.supabase.from('workflows').insert({ workspace_id: workspaceId, ...data, next_run_at }).select().single();
    if (error) throw error;
    res.json(wf);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// List
router.get('/workspace/:workspaceId', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.json([]);
    const { data, error } = await req.supabase.from('workflows').select('*').eq('workspace_id', req.params.workspaceId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// Get
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.json({});
    const { data, error } = await req.supabase.from('workflows').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

// Update
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = WorkflowSchema.parse(req.body);
    const next_run_at = calculateNextRunAt(data.definition, data.status || 'draft');
    
    if (!req.supabase) return res.json({ id: req.params.id, ...data, next_run_at });
    const { data: wf, error } = await req.supabase.from('workflows').update({ ...data, next_run_at }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(wf);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// Run Manual
router.post('/:id/run', async (req: AuthRequest, res) => {
  try {
    const triggerData = req.body || {};
    let workflow, runId;
    if (!req.supabase) {
      workflow = { id: req.params.id, definition: { nodes: [] }, workspace_id: 'mock-ws' };
      runId = 'mock-run-' + Date.now();
    } else {
      const { data: wf, error: wfErr } = await req.supabase.from('workflows').select('*').eq('id', req.params.id).single();
      if (wfErr) throw wfErr;
      if (wf.status !== 'active') throw new Error('Workflow is not active');
      workflow = wf;
      const { data: run, error: runErr } = await req.supabase.from('workflow_runs').insert({ workflow_id: wf.id, trigger_data: triggerData }).select().single();
      if (runErr) throw runErr;
      runId = run.id;
    }
    
    // Fire and forget engine
    WorkflowEngine.run(req.supabase || null, workflow, runId, triggerData, req.user?.id || 'mock-user').catch(console.error);
    
    res.json({ runId, message: 'Workflow started' });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// Get Runs
router.get('/:id/runs', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.json([]);
    const { data, error } = await req.supabase.from('workflow_runs').select('*').eq('workflow_id', req.params.id).order('started_at', { ascending: false }).limit(50);
    if (error) throw error;
    res.json(data);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// Get Single Run
router.get('/:id/runs/:runId', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.json({});
    const { data, error } = await req.supabase.from('workflow_runs').select('*').eq('id', req.params.runId).single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

// Retry Run
router.post('/:id/runs/:runId/retry', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) throw new Error('No supabase client');
    const { nodeId } = req.body;
    if (!nodeId) throw new Error('nodeId required');

    // Get workflow
    const { data: workflow, error: wfError } = await req.supabase
      .from('workflows')
      .select('*')
      .eq('id', req.params.id)
      .single();
      
    if (wfError || !workflow) throw new Error('Workflow not found');

    // Fetch the run to check status and started_at vs workflow updated_at
    const { data: run, error: runError } = await req.supabase
      .from('workflow_runs')
      .select('status, started_at')
      .eq('id', req.params.runId)
      .single();
    if (runError || !run) throw new Error('Execution not found');

    if (run.status === 'running') {
      throw new Error('Execution is already running');
    }

    // Workflow Version Safety: Prevent retry if workflow changed after this execution started
    if (new Date(workflow.updated_at).getTime() > new Date(run.started_at).getTime()) {
      throw new Error('Workflow has changed since this execution. Retry is unavailable.');
    }

    // Execute retry in background
    WorkflowEngine.retry(req.supabase || null, workflow, req.params.runId as string, nodeId as string, req.user?.id || 'unknown')
      .catch(console.error);
      
    res.json({ success: true, message: 'Retry initiated' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── AI Workflow Generator ────────────────────────────────────────────────────
router.post('/generate', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Rate limit: 10 requests/min per user
    if (!checkGenerateRateLimit(userId)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait before generating another workflow.' });
    }

    const { prompt, workspaceId } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }
    if (!workspaceId || typeof workspaceId !== 'string') {
      return res.status(400).json({ error: 'workspaceId is required' });
    }
    if (prompt.length > 2000) {
      return res.status(400).json({ error: 'Prompt exceeds 2000 character limit.' });
    }

    // Load safe connection metadata (no credentials ever sent to AI)
    let connections: any[] = [];
    let agents: any[] = [];

    const serviceClient = getServiceSupabase();
    if (serviceClient) {
      // Verify the user actually owns/belongs to this workspace via their own client
      if (req.supabase) {
        const { data: wsData } = await req.supabase
          .from('workspaces')
          .select('id')
          .eq('id', workspaceId)
          .single();
        if (!wsData) return res.status(403).json({ error: 'Workspace not accessible' });
      }

      // Load connections — safe fields only, NEVER credentials
      const { data: connData } = await serviceClient
        .from('connections')
        .select('id, provider, name, status')
        .eq('workspace_id', workspaceId)
        .eq('status', 'connected');
      if (connData) connections = connData;

      // Load agents — safe fields only
      const { data: agentData } = await serviceClient
        .from('agents')
        .select('id, name')
        .eq('workspace_id', workspaceId);
      if (agentData) agents = agentData;
    }

    const result = await generateWorkflow({
      prompt,
      connections,
      agents,
      workspaceId
    });

    res.json(result);
  } catch (err: any) {
    console.error('[generate] Error:', err.message);
    res.status(500).json({ error: 'Internal error during workflow generation' });
  }
});

export default router;
