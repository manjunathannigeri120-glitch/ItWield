import { ensureAIProvider } from '../utils/aiConfig';
import { Router, Request, Response } from 'express';
import { BusinessGoalInterpreter } from '../services/BusinessGoalInterpreter';
import { OutcomePlannerService } from '../services/OutcomePlannerService';
import { COOService } from '../services/COOService';
import { BusinessDataRegistry } from '../services/BusinessDataRegistry';
import { OutcomeVerificationService } from '../services/OutcomeVerificationService';
import { requireAuth, AuthRequest } from '../middleware/auth';
import OpenAI from 'openai';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.post('/', async (req: any, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'DB required' });
    const { input, context_answers } = req.body;
    const workspaceId = req.params.workspaceId as string;

    // Fetch existing company memory
    const { data: mems } = await req.supabase
      .from('company_memory')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('category', ['STRATEGIC_CONTEXT', 'FACT']);

    const memorySummary: any = {};
    (mems || []).forEach((m: any) => {
      memorySummary[m.title.toLowerCase().replace(/ /g, '_')] = m.content;
    });

    // If the user provided answers to missing context, save them first
    if (context_answers) {
      for (const [key, value] of Object.entries(context_answers)) {
        if (value && typeof value === 'string' && value.trim().length > 0) {
          const contentStr = value.trim();
          await req.supabase.from('company_memory').insert({
            workspace_id: workspaceId,
            category: 'STRATEGIC_CONTEXT',
            memory_type: 'FACT',
            title: key,
            content: contentStr.includes('://') && key === 'website' ? contentStr : (key === 'website' ? 'https://' + contentStr : contentStr),
            source_type: 'OWNER',
            importance: 'high',
            confidence: 'verified'
          });
          memorySummary[key.toLowerCase()] = contentStr;
        }
      }
    }

    const interpretation = await BusinessGoalInterpreter.interpretGoal(req.supabase, workspaceId, input, memorySummary);

    // ----------------------------------------------------
    // V3.12: Natural Language Control & Status Queries
    // ----------------------------------------------------
    if (interpretation.intent_type === 'CONTROL' && interpretation.control_action) {
       let updatedStatus = 'ACTIVE';
       let successMsg = 'Objective updated.';
       if (interpretation.control_action === 'PAUSE') {
           updatedStatus = 'PAUSED';
           successMsg = 'Customer acquisition has been paused. Autonomous operations will stop until resumed.';
       } else if (interpretation.control_action === 'RESUME') {
           updatedStatus = 'ACTIVE';
           successMsg = 'Customer acquisition resumed. The AI COO will evaluate the current state and continue.';
       } else if (interpretation.control_action === 'STOP') {
           updatedStatus = 'ARCHIVED';
           successMsg = 'Autonomous operations stopped and objective archived.';
       }
       
       await req.supabase.from('business_goals').update({ operating_status: updatedStatus })
            .eq('workspace_id', workspaceId).eq('status', 'ACTIVE');
            
       return res.status(200).json({
           requires_context: false,
           is_direct_response: true,
           answer: successMsg,
           interpretation
       });
    }

    if (interpretation.intent_type === 'STATUS_QUERY') {
       // Query current active goal stats
       const { data: currentGoals } = await req.supabase.from('business_goals').select('*').eq('workspace_id', workspaceId).eq('status', 'ACTIVE');
       if (!currentGoals || currentGoals.length === 0) {
           return res.status(200).json({
               requires_context: false,
               is_direct_response: true,
               answer: "There are no active business objectives right now.",
               interpretation
           });
       }
       const g = currentGoals[0];
       let ans = `Your objective "${g.objective}" is currently ${g.operating_status}. You have ${g.current_metric || 0} / ${g.target} verified results.`;
       
       return res.status(200).json({
           requires_context: false,
           is_direct_response: true,
           answer: ans,
           interpretation
       });
    }
    // ----------------------------------------------------

    // Filter out fields that are already in memory, just to be safe from LLM hallucinations
    const genuinelyMissing = (interpretation.missing_company_context || []).filter(f => !memorySummary[f.toLowerCase()]);
    if (interpretation.website_required && !memorySummary['website']) {
      if (!genuinelyMissing.includes('website')) genuinelyMissing.push('website');
    }

    if (genuinelyMissing.length > 0) {
      return res.status(200).json({
        requires_context: true,
        missing_fields: genuinelyMissing,
        message: `To do this accurately, I need a bit more context. Could you provide: ${genuinelyMissing.join(', ')}?`
      });
    }

    // Direct Response for General Scope
    if (interpretation.scope === 'GENERAL') {
       // Answer it inline via OpenAI or just create a goal and resolve immediately.
       // The prompt says: "if request is general... DIRECT RESPONSE".
       // We can just hit OpenAI quickly to answer if it's a QUESTION/RESEARCH.
       if (interpretation.request_type === 'QUESTION' || interpretation.request_type === 'RESEARCH') {

    ensureAIProvider();
         const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY || 'mock', baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173' } });
         let directAnswer = "I'm researching that now...";
         try {
           const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
           const chatRes = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: input }] });
           directAnswer = chatRes.choices[0].message.content || directAnswer;
         } catch(e) {}
         
         return res.status(200).json({
           requires_context: false,
           is_direct_response: true,
           answer: directAnswer,
           interpretation
         });
       }
    }

    const goal = await BusinessGoalInterpreter.createGoal(req.supabase, workspaceId, input, interpretation);
    const planResult = await OutcomePlannerService.planOutcome(req.supabase, workspaceId, goal.id);

    res.json({ goal, plan: planResult, requires_context: false });
  } catch (error: any) {
    res.status(400).json({ error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred processing your request.' });
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
    
    for (const g of goals || []) {
      await OutcomeVerificationService.verifyGoalProgress(req.supabase, workspaceId, g.id);
    }

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
    res.status(400).json({ error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred processing your request.' });
  }
});

router.get('/what-next', async (req: any, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'DB required' });
    const workspaceId = req.params.workspaceId as string;
    
    const cooReview = await COOService.executeOperationalReview(req.supabase, workspaceId);
    res.json(cooReview);
  } catch (error: any) {
    res.status(400).json({ error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred processing your request.' });
  }
});

router.delete('/:goalId', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'DB required' });
    const { workspaceId, goalId } = req.params;

    const { error } = await req.supabase
      .from('business_goals')
      .delete()
      .eq('id', goalId)
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred processing your request.' });
  }
});

export default router;



