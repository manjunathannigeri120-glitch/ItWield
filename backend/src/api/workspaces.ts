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

// Fetch while-you-were-away activity summary
router.get('/:id/while-away', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.status(400).json({ error: 'DB required' });
    const workspaceId = req.params.id;
    const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: tasks } = await req.supabase
      .from('tasks')
      .select('id, title, status, input, output, created_at, completed_at, error, assigned_agent:agents(name, manager_id)')
      .eq('workspace_id', workspaceId)
      .gte('created_at', timeWindow)
      .order('created_at', { ascending: false });

    const { data: incidents } = await req.supabase
      .from('incidents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('created_at', timeWindow)
      .order('created_at', { ascending: false });

    const { data: events } = await req.supabase
      .from('task_events')
      .select('event_type, details, created_at, task_id')
      .eq('workspace_id', workspaceId)
      .gte('created_at', timeWindow)
      .in('event_type', ['OWNER_APPROVAL_REQUIRED', 'OBSERVATION_BLOCKED'])
      .order('created_at', { ascending: false });

    const activities: any[] = [];

    // 1. Process Incidents (High priority)
    for (const inc of (incidents || [])) {
      activities.push({
        id: `inc_${inc.id}`,
        type: 'incident',
        title: 'Application issue detected',
        description: inc.description || inc.title || 'An operational issue was detected.',
        status: inc.severity === 'critical' ? 'critical' : 'warning',
        timestamp: inc.created_at,
        requiresAttention: inc.status !== 'RESOLVED',
        details: {
           whatWeDid: ['CEO created a technical incident', 'CTO investigation was initiated'],
           ownerAction: 'Production changes require owner approval.'
        }
      });
    }

    // 2. Process Approvals & Blocks
    for (const ev of (events || [])) {
      if (ev.event_type === 'OWNER_APPROVAL_REQUIRED') {
        activities.push({
          id: `ev_${ev.task_id || Math.random()}`,
          type: 'approval_required',
          title: 'Owner Approval Required',
          description: ev.details?.reason || 'A task requires your approval to proceed.',
          status: 'warning',
          timestamp: ev.created_at,
          requiresAttention: true
        });
      } else if (ev.event_type === 'OBSERVATION_BLOCKED') {
        activities.push({
          id: `ev_${Math.random()}`,
          type: 'blocked',
          title: 'Observation Blocked',
          description: ev.details?.reason || 'System is blocked from performing an observation.',
          status: 'info',
          timestamp: ev.created_at,
          requiresAttention: false
        });
      }
    }

    // 3. Process completed/failed tasks (Application Monitoring)
    for (const task of (tasks || [])) {
      if (task.input?.task_type === 'APPLICATION_MONITORING' && task.status === 'COMPLETED') {
        activities.push({
          id: `task_${task.id}`,
          type: 'health_check',
          title: 'Application health',
          description: 'Application Monitor checked the company website.',
          status: 'success',
          timestamp: task.completed_at || task.created_at,
          requiresAttention: false,
          details: {
            healthy: true,
            httpStatus: task.output?.httpStatus,
            durationMs: task.output?.durationMs
          }
        });
      } else if (task.status === 'COMPLETED' && task.input?.task_type !== 'APPLICATION_MONITORING') {
        let agentName = (task as any).assigned_agent?.name;
        activities.push({
          id: `task_${task.id}`,
          type: 'task_completed',
          title: task.title,
          description: agentName ? `Your AI CTO coordinated execution through ${agentName}.` : 'Task completed successfully.',
          status: 'success',
          timestamp: task.completed_at || task.created_at,
          requiresAttention: false
        });
      }
    }

    res.json({
      summary: activities.length > 0 ? "Here is what happened while you were away." : "No autonomous activity yet.",
      items: activities,
      counts: {
        completed: activities.filter(a => a.status === 'success').length,
        issues: activities.filter(a => a.type === 'incident').length,
        approvals: activities.filter(a => a.type === 'approval_required').length
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
