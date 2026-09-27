import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { AICOOService } from '../services/AICOOService';

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
    const result = await AICOOService.operateCompany(supabase, workspaceId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
