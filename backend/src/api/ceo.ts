import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { CEOService } from '../services/CEOService';
import { CreditService } from '../services/CreditService';

const router = Router();
router.use(requireAuth);

// Run CEO evaluation loop
router.post('/run', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { objective, workspace_id } = req.body;
    if (!objective) return res.status(400).json({ error: 'objective is required' });
    if (!workspace_id) return res.status(400).json({ error: 'workspace_id is required' });

    // Strict server-side verification of workspace access
    const { data: workspace, error: wErr } = await req.supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspace_id)
      .single();

    if (wErr || !workspace) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    // --- CREDIT ENFORCEMENT BOUNDARY ---
    // Atomically deduct 2 AI credits for CEO command execution
    const creditCheck = await CreditService.deductCredits(req.supabase, workspace_id, 2);
    if (!creditCheck.allowed) {
      return res.status(402).json({
        error: 'INSUFFICIENT_CREDITS',
        message: 'Insufficient AI credits. Please upgrade your plan to run the AI CEO.'
      });
    }
    // -----------------------------------

    // Pass execution to CEOService
    const result = await CEOService.run(req.supabase, workspace_id, objective, req.user.id);
    
    res.json({ ...result, credits: creditCheck.remaining });
  } catch (error: any) {
    console.error('[CEO API Error]', error);
    res.status(500).json({ error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred processing your request.' });
  }
});

export const ceoRouter = router;

