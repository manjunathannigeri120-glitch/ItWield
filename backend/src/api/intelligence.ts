import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { IntelligenceService } from '../services/IntelligenceService';

const router = Router();
router.use(requireAuth);

router.get('/workspace/:workspaceId/snapshot', async (req: AuthRequest, res) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    if (!req.supabase) return res.status(500).json({ error: 'Supabase client not initialized' });

    // Verify workspace access
    const { data: workspace, error: wErr } = await req.supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .single();

    if (wErr || !workspace) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const snapshot = await IntelligenceService.generateSnapshot(req.supabase, workspaceId);
    return res.json(snapshot);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/workspace/:workspaceId/activity-summary', async (req: AuthRequest, res) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    if (!req.supabase) return res.status(500).json({ error: 'Supabase client not initialized' });

    const { data: events } = await req.supabase
      .from('task_events')
      .select('*, tasks(title, status)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: incidents } = await req.supabase
      .from('incidents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5);

    return res.json({ events: events || [], incidents: incidents || [] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/workspace/:workspaceId/simulate-observation', async (req: AuthRequest, res) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const { competitor_name, type, title, description, significance } = req.body;
    if (!req.supabase) return res.status(500).json({ error: 'Supabase client not initialized' });

    // Ensure competitor exists
    let { data: comp } = await req.supabase.from('competitors').select('id').eq('workspace_id', workspaceId).eq('name', competitor_name).single();
    if (!comp) {
      const { data: newComp, error: err } = await req.supabase.from('competitors').insert({ workspace_id: workspaceId, name: competitor_name }).select().single();
      if (err) throw err;
      comp = newComp;
    }

    const { data: obs, error: obsErr } = await req.supabase.from('competitor_observations').insert({
      workspace_id: workspaceId,
      competitor_id: comp!.id,
      type,
      title,
      description,
      significance
    }).select().single();

    if (obsErr) throw obsErr;

    // Wake up CEO by triggering intelligence run
    const snapshot = await IntelligenceService.generateSnapshot(req.supabase, workspaceId);
    const anomalies = IntelligenceService.detectAnomalies(snapshot);
    await IntelligenceService.syncIncidents(req.supabase, workspaceId, anomalies, snapshot.incidents);

    // Run CEO since there's a new observation
    const { CEOService } = require('../services/CEOService');
    CEOService.run(req.supabase, workspaceId, 'Review new competitor observations.').catch(console.error);

    return res.json({ success: true, observation: obs });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export const intelligenceRouter = router;
