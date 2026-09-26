import { Router, Request, Response } from 'express';

import { BusinessGoalInterpreter } from '../services/BusinessGoalInterpreter';
import { OutcomePlannerService } from '../services/OutcomePlannerService';
import { COOService } from '../services/COOService';
import { BusinessDataRegistry } from '../services/BusinessDataRegistry';
import { OutcomeVerificationService } from '../services/OutcomeVerificationService';
import { BusinessBottleneckService } from '../services/BusinessBottleneckService';

const router = Router({ mergeParams: true });

router.post('/', async (req: any, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'DB required' });
    const { input } = req.body;
    const workspaceId = req.params.workspaceId as string;

    const goal = await BusinessGoalInterpreter.createGoal(req.supabase, workspaceId, input);
    
    // Auto-plan if not missing data
    const planResult = await OutcomePlannerService.planOutcome(req.supabase, workspaceId, goal.id);

    res.json({ goal, plan: planResult });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req: any, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'DB required' });
    const workspaceId = req.params.workspaceId as string;

    const { data: goals, error } = await req.supabase
      .from('business_goals')
      .select(`
        *,
        missions:business_missions(id, type, status, objective)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Auto-verify on fetch for now
    for (const g of goals || []) {
      await OutcomeVerificationService.verifyGoalProgress(req.supabase, workspaceId, g.id);
    }

    // refetch to get updated status/metrics
    const { data: updatedGoals } = await req.supabase
      .from('business_goals')
      .select(`
        *,
        missions:business_missions(id, type, status, objective)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    res.json(updatedGoals);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/what-next', async (req: any, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'DB required' });
    const workspaceId = req.params.workspaceId as string;
    
    const cooReview = await COOService.executeOperationalReview(req.supabase, workspaceId);
    res.json(cooReview);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/business-data', async (req: any, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'DB required' });
    const workspaceId = req.params.workspaceId as string;
    
    await BusinessDataRegistry.syncRegistry(req.supabase, workspaceId);
    
    const { data: registry } = await req.supabase
      .from('business_data_registry')
      .select('*')
      .eq('workspace_id', workspaceId);

    res.json(registry);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
