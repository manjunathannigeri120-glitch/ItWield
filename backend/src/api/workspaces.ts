import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
router.use(requireAuth);

const WorkspaceSchema = z.object({
  name: z.string().min(1)
});

let mockWorkspaces: any[] = [];

// List workspaces for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.json(mockWorkspaces);

    const { data, error } = await req.supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create workspace
router.post('/', async (req: AuthRequest, res) => {
  try {
    const validatedData = WorkspaceSchema.parse(req.body);
    
    if (!req.supabase) {
      const mockWorkspace = {
        id: 'mock-ws-' + Date.now(),
        owner_id: req.user?.id,
        name: validatedData.name,
        created_at: new Date().toISOString()
      };
      mockWorkspaces.unshift(mockWorkspace);
      return res.json(mockWorkspace);
    }

    const { data, error } = await req.supabase
      .from('workspaces')
      .insert({
        owner_id: req.user?.id,
        name: validatedData.name
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// V2 Onboarding: Analyze Company
router.post('/:id/analyze-company', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.status(400).json({ error: 'DB required' });
    const workspaceId = req.params.id;
    
    // Save the context
    const { 
      name, website, industry, business_model, short_description,
      target_customer, primary_market,
      goals, secondary_goals, biggest_problems,
      ai_preferences 
    } = req.body;

    // Fetch existing to merge operational_context safely
    const { data: existingWs } = await req.supabase
      .from('workspaces')
      .select('operational_context')
      .eq('id', workspaceId)
      .single();

    let mergedContext: any = {};
    if (existingWs && existingWs.operational_context) {
      try {
        mergedContext = JSON.parse(existingWs.operational_context);
      } catch (e) {
        // Safe fallback for legacy plain-text
        mergedContext = { legacy_context: existingWs.operational_context };
      }
    }

    mergedContext = {
      ...mergedContext,
      short_description: short_description !== undefined ? short_description : mergedContext.short_description,
      website: website !== undefined ? website : mergedContext.website,
      target_customer: target_customer !== undefined ? target_customer : mergedContext.target_customer,
      primary_market: primary_market !== undefined ? primary_market : mergedContext.primary_market,
      secondary_goals: secondary_goals !== undefined ? secondary_goals : mergedContext.secondary_goals,
      biggest_problems: biggest_problems !== undefined ? biggest_problems : mergedContext.biggest_problems,
      ai_preferences: ai_preferences !== undefined ? ai_preferences : mergedContext.ai_preferences
    };

    const { error: updateErr } = await req.supabase
      .from('workspaces')
      .update({
        name: name,
        industry: industry,
        business_model: business_model,
        operational_context: JSON.stringify(mergedContext),
        company_goals: goals
      })
      .eq('id', workspaceId);

    if (updateErr) throw updateErr;

    // Handle competitors
    if (req.body.competitors) {
      const compList = req.body.competitors.split(',').map((c: string) => c.trim()).filter(Boolean);
      for (const comp of compList) {
        await req.supabase!.from('competitors').insert({
          workspace_id: workspaceId,
          name: comp
        });
      }
    }

    // Generate CEO Operating Plan deterministically
    const operatingPlan = [
      "1. Monitor application health",
      "2. Monitor competitors",
      "3. Detect customer/business problems",
      "4. Identify safe product improvements",
      "5. Report important changes to owner"
    ];

    const proposedWorkforce = {
      executives: [
        { role: 'CEO', objective: 'Company-wide orchestration', status: 'Proposed' },
        { role: 'CTO', objective: 'Technical operations', status: 'Proposed' },
        { role: 'CMO', objective: 'Competitive intelligence', status: 'Proposed' },
        { role: 'CFO', objective: 'Financial monitoring', status: 'Proposed' }
      ],
      workers: [
        { role: 'Application Monitor', objective: 'Monitor the health of the application.', manager: 'CTO' },
        { role: 'Builder Analyst', objective: 'Research and build new features.', manager: 'CTO' },
        { role: 'Competitor Analyst', objective: 'Analyze competitor movements.', manager: 'CMO' }
      ]
    };

    res.json({
      plan: operatingPlan,
      workforce: proposedWorkforce
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Activate workspace
router.post('/:id/activate', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.status(400).json({ error: 'DB required' });

    const workspaceId = req.params.id;

    // Verify ownership and current status
    const { data: ws, error: fetchErr } = await req.supabase
      .from('workspaces')
      .select('status, id, name')
      .eq('id', workspaceId)
      .single();

    if (fetchErr) throw fetchErr;

    // Activation must be idempotent
    if (ws.status === 'operating' || ws.status === 'active') {
      return res.json({ message: 'Workspace already active' });
    }

    // 1. Mark as operating
    const { error: updateErr } = await req.supabase
      .from('workspaces')
      .update({ status: 'operating' })
      .eq('id', workspaceId);

    if (updateErr) throw updateErr;

    // 2. Inject V2 Executive Layer + Workers (idempotent via ignoring errors or checking first)
    const { data: existingAgents } = await req.supabase.from('agents').select('name').eq('workspace_id', workspaceId);
    const existingNames = new Set((existingAgents || []).map((a: any) => a.name));

    const insertAgent = async (name: string, system_prompt: string, capabilities: any[] = [], managerId: string | null = null) => {
      if (!req.supabase) return;
      if (existingNames.has(name)) {
        const { data } = await req.supabase.from('agents').select('id').eq('workspace_id', workspaceId).eq('name', name).single();
        return data?.id;
      }
      const { data } = await req.supabase.from('agents').insert({ workspace_id: workspaceId, name, system_prompt, capabilities, status: 'idle', manager_id: managerId }).select('id').single();
      return data?.id;
    };

    const ceoId = await insertAgent('AI CEO', 'Company-wide orchestration', ['delegate', 'report', 'orchestrate']);
    const ctoId = await insertAgent('AI CTO', 'Technical operations', ['monitor_health', 'engineering'], ceoId);
    const cmoId = await insertAgent('AI CMO', 'Competitive intelligence', ['market_signals'], ceoId);
    const cfoId = await insertAgent('AI CFO', 'Financial monitoring', ['financial_alerts'], ceoId);

    // Insert workers and link managers
    const insertWorker = async (name: string, system_prompt: string, managerId: string) => {
      if (existingNames.has(name)) return;
      await req.supabase!.from('agents').insert({ workspace_id: workspaceId, name, system_prompt, manager_id: managerId, status: 'idle' });
    };

    await insertWorker('Application Monitor', 'You monitor the health of the application.', ctoId);
    await insertWorker('Builder Analyst', 'You research and build new features.', ctoId);
    await insertWorker('Competitor Analyst', 'You analyze competitor movements.', cmoId);

    // 3. Inject default baseline workflows (check if exists first)
    const { data: existingWf } = await req.supabase.from('workflows').select('id').eq('workspace_id', workspaceId).eq('name', 'Routine Health Check').single();
    if (!existingWf) {
      await req.supabase.from('workflows').insert([{
        workspace_id: workspaceId,
        name: 'Routine Health Check',
        status: 'active',
        definition: {
          nodes: [{ id: 'trigger_1', type: 'trigger_schedule', config: { cron: '0 * * * *' } }],
          edges: []
        }
      }]);
    }

    // 4. Trigger CEOService
    const { CEOService } = require('../services/CEOService');
    CEOService.run(req.supabase, workspaceId, 'Initial Company Activation').catch((err: any) => {
      console.error('[Workspaces] Initial CEO run failed:', err);
    });

    res.json({ message: 'Workspace activated successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Fetch events for workspace
router.get('/:id/events', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.status(400).json({ error: 'DB required' });
    const { data, error } = await req.supabase
      .from('task_events')
      .select('*')
      .eq('workspace_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
