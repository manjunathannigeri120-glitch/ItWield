import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { CompanyCoordinationService } from '../services/CompanyCoordinationService';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/state', async (req: any, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'DB required' });
    const workspaceId = req.params.workspaceId as string;

    const nextAction = await CompanyCoordinationService.determineCompanyNextAction(req.supabase, workspaceId);

    // Also get executive states
    const { data: activeGoals } = await req.supabase.from('business_goals').select('*').eq('workspace_id', workspaceId).eq('status', 'ACTIVE');
    const { data: dependencies } = await req.supabase.from('objective_dependencies').select('*').eq('workspace_id', workspaceId).eq('status', 'OPEN');
    
    res.json({
        nextAction,
        activeGoals: activeGoals || [],
        dependencies: dependencies || []
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/next-action', async (req: any, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'DB required' });
    const workspaceId = req.params.workspaceId as string;

    const nextAction = await CompanyCoordinationService.determineCompanyNextAction(req.supabase, workspaceId);

    if (nextAction.authority === 'AUTONOMOUS') {
       if (nextAction.responsibleExecutive !== 'CEO' && nextAction.responsibleExecutive !== 'COO') {
           // We can create an objective for them
           await req.supabase.from('business_goals').insert({
               workspace_id: workspaceId,
               objective: nextAction.currentPriority,
               status: 'ACTIVE',
               operating_status: 'ACTIVE'
           });
       }
    } else if (nextAction.authority === 'APPROVAL_REQUIRED') {
       await req.supabase.from('approvals').insert({
           workspace_id: workspaceId,
           action: nextAction.currentPriority,
           reason: nextAction.reason,
           status: 'PENDING_APPROVAL'
       });
    }

    res.json({ nextAction });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
