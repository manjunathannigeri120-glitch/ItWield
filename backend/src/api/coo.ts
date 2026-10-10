import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { AICOOService } from '../services/AICOOService';
import { CreditService } from '../services/CreditService';

const router = Router({ mergeParams: true });

router.use(requireAuth);

/**
 * GET /workspaces/:workspaceId/company/operating-state
 */
router.get('/company/operating-state', async (req: any, res: any) => {
  const { workspaceId } = req.params;
  const supabase = req.supabase;

  try {
    const { data: ws } = await supabase.from('workspaces').select('status, id').eq('id', workspaceId).single();
    if (!ws) return res.status(404).json({ error: 'Workspace not found' });
    
    res.json({
      operating_state: ws.status === 'operating' ? 'OPERATING' : 'READY',
      workspace_id: workspaceId
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /workspaces/:workspaceId/company/next-action
 */
router.get('/company/next-action', async (req: any, res: any) => {
  const { workspaceId } = req.params;
  const supabase = req.supabase;
  try {
    const nextAction = await AICOOService.getNextAction(supabase, workspaceId);
    res.json(nextAction);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /workspaces/:workspaceId/company/operate
 */
router.post('/company/operate', async (req: any, res: any) => {
  const { workspaceId } = req.params;
  const supabase = req.supabase;
  try {
    // --- CREDIT ENFORCEMENT BOUNDARY ---
    // Atomically deduct 2 AI credits for company operating commands
    const creditCheck = await CreditService.deductCredits(supabase, workspaceId, 2);
    if (!creditCheck.allowed) {
      return res.status(402).json({
        error: 'INSUFFICIENT_CREDITS',
        message: 'Insufficient AI credits. Please upgrade your plan to operate the company.'
      });
    }
    // -----------------------------------

    const result = await AICOOService.operateCompany(supabase, workspaceId);
    res.json({ ...result, credits: creditCheck.remaining });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
