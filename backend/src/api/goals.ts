import { Router, Request, Response } from 'express';

import { BusinessGoalInterpreter } from '../services/BusinessGoalInterpreter';
import { OutcomePlannerService } from '../services/OutcomePlannerService';
import { COOService } from '../services/COOService';
import { BusinessDataRegistry } from '../services/BusinessDataRegistry';
import { OutcomeVerificationService } from '../services/OutcomeVerificationService';
import { BusinessBottleneckService } from '../services/BusinessBottleneckService';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.post('/', async (req: any, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'DB required' });
    const { input, website } = req.body;
    const workspaceId = req.params.workspaceId as string;

    // Check if company website is already known
    const { data: mems } = await req.supabase
      .from('company_memory')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('category', 'STRATEGIC_CONTEXT')
      .eq('title', 'Company Website')
      .limit(1);

    const hasWebsite = mems && mems.length > 0;

    if (!hasWebsite && !website) {
      // Need context before proceeding
      return res.status(200).json({
        requires_context: true,
        missing_fields: ['website'],
        message: 'Before I can operate this goal, I need to understand your business.'
      });
    }

    if (website && !hasWebsite) {
      // Store the website as strategic context
      await req.supabase.from('company_memory').insert({
        workspace_id: workspaceId,
        category: 'STRATEGIC_CONTEXT',
        memory_type: 'FACT',
        title: 'Company Website',
        content: website,
        source_type: 'OWNER',
        importance: 'high',
        confidence: 'verified'
      });
    }

    const goal = await BusinessGoalInterpreter.createGoal(req.supabase, workspaceId, input);
    
    // Auto-plan if not missing data
    const planResult = await OutcomePlannerService.planOutcome(req.supabase, workspaceId, goal.id);

    res.json({ goal, plan: planResult, requires_context: false });
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
