import express from 'express';
import { requireAuth } from '../middleware/auth';
import { CustomerGrowthService } from '../services/CustomerGrowthService';

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

// Get all opportunities for pipeline
router.get('/opportunities', async (req: any, res) => {
  const { workspaceId } = req.params;
  const supabase = req.supabase;
  
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record a simulated or real response
router.post('/opportunities/:oppId/response', async (req: any, res) => {
  const { workspaceId, oppId } = req.params;
  const { responseText, classification } = req.body;
  const supabase = req.supabase;

  try {
    const updated = await CustomerGrowthService.recordResponse(supabase, workspaceId, oppId, responseText, classification);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record Conversion (Won / Lost)
router.post('/opportunities/:oppId/convert', async (req: any, res) => {
  const { workspaceId, oppId } = req.params;
  const { outcome, evidence, valueStr } = req.body;
  const supabase = req.supabase;

  try {
    if (!['WON', 'LOST'].includes(outcome)) {
      return res.status(400).json({ error: 'Outcome must be WON or LOST' });
    }
    const updated = await CustomerGrowthService.recordConversion(supabase, workspaceId, oppId, outcome, evidence, valueStr);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Propose a follow up
router.post('/opportunities/:oppId/follow-up', async (req: any, res) => {
  const { workspaceId, oppId } = req.params;
  const { reason } = req.body;
  const supabase = req.supabase;

  try {
    const updated = await CustomerGrowthService.proposeFollowUp(supabase, workspaceId, oppId, reason || 'Automated follow-up sequence');
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
