import express from 'express';
import { requireAuth } from '../middleware/auth';
import { MissionProgressService } from '../services/MissionProgressService';

const router = express.Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', async (req: any, res) => {
  const { workspaceId } = req.params;
  const supabase = req.supabase;

  if (!supabase) {
    console.error('[Missions API] req.supabase is missing');
    return res.status(500).json({ error: 'Database connection missing' });
  }

  if (!workspaceId) {
    console.error('[Missions API] workspaceId is missing');
    return res.status(400).json({ error: 'Workspace ID required' });
  }

  try {
    const { data, error } = await supabase
      .from('business_missions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Missions API] Supabase query error:', error);
      throw error;
    }
    
    res.json(data || []);
  } catch (error: any) {
    console.error('[Missions API] Exception in GET /:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error fetching missions',
      details: error.details || undefined,
      code: error.code || undefined
    });
  }
});

router.post('/', async (req: any, res) => {
  const { workspaceId } = req.params;
  const { type, title, description, objective, success_criteria, priority } = req.body;
  const supabase = req.supabase;
  const userId = req.user.id;

  if (!supabase) {
    console.error('[Missions API POST] req.supabase is missing');
    return res.status(500).json({ error: 'Database connection missing' });
  }

  // Validation
  const validTypes = ['GET_CUSTOMERS', 'UNDERSTAND_COMPETITORS', 'IMPROVE_PRODUCT', 'MONITOR_BUSINESS', 'REDUCE_MANUAL_WORK'];
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ error: `Invalid or missing mission type. Expected one of: ${validTypes.join(', ')}` });
  }
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Mission title is required' });
  }
  if (!objective || typeof objective !== 'string' || objective.trim() === '') {
    return res.status(400).json({ error: 'Mission objective is required' });
  }

  try {
    const { data, error } = await supabase
      .from('business_missions')
      .insert({
        workspace_id: workspaceId,
        type,
        title,
        description,
        objective,
        success_criteria,
        priority: priority || 'NORMAL',
        status: 'DRAFT',
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error('[Missions API POST] Insert error:', { error, workspaceId, userId, type });
      // Detect RLS violation
      if (error.message && error.message.includes('row-level security policy')) {
        return res.status(403).json({ error: 'Unauthorized to create missions in this workspace' });
      }
      throw error;
    }

    const { error: eventError } = await supabase.from('mission_events').insert({
      mission_id: data.id,
      workspace_id: workspaceId,
      event_type: 'MISSION_CREATED',
      details: { created_by: userId }
    });
    
    if (eventError) {
      console.error('[Missions API POST] Failed to insert mission_event:', eventError);
      // We don't fail the whole request just because event log failed, but we log it.
    }

    res.status(201).json(data);
  } catch (error: any) {
    console.error('[Missions API POST] Exception:', error);
    res.status(500).json({ error: 'Internal server error creating mission' });
  }
});

router.get('/:missionId', async (req: any, res) => {
  const { workspaceId, missionId } = req.params;
  const supabase = req.supabase;

  try {
    const { data: mission, error } = await supabase
      .from('business_missions')
      .select('*')
      .eq('id', missionId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Mission not found' });
      }
      console.error('[Missions API] Supabase query error (GET /:id):', error);
      throw error;
    }

    const progress = await MissionProgressService.calculateProgress(supabase, workspaceId, missionId);
    
    const { MissionPlanningService } = await import('../services/MissionPlanningService');
    const planData = await MissionPlanningService.getOrCreateActivePlan(supabase, workspaceId, missionId, mission.type);

    const { data: learnings } = await supabase.from('company_memory').select('*').eq('source_mission_id', missionId).eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50); const { data: recentResults } = await supabase
      .from('mission_results')
      .select('*')
      .eq('mission_id', missionId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: events } = await supabase
      .from('mission_events')
      .select('*')
      .eq('mission_id', missionId)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, created_at, updated_at, assigned_agent_id')
      .eq('mission_id', missionId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch Approvals for tasks
    const taskIds = tasks ? tasks.map((t: any) => t.id) : [];
    let approvals: any[] = [];
    if (taskIds.length > 0) {
      const { data: appData } = await supabase
        .from('approvals')
        .select('*')
        .in('task_id', taskIds)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (appData) approvals = appData;
    }

    const authority = {
      allowed: [
        'Web research',
        'Competitor research',
        'Lead research',
        'Data transformation',
        'Store business data',
        'Generate reports'
      ],
      requires_approval: [
        'Contact prospects',
        'Send external communications',
        'Deploy changes',
        'Major product changes',
        'Publishing / irreversible actions',
        'Financial actions'
      ],
      prohibited: [
        'Change product pricing',
        'Change subscription prices',
        'Change discounts',
        'Change billing amounts',
        'Change credits',
        'Change payment terms'
      ]
    };

    res.json({
      mission,
      progress,
      plan: {
        id: planData.plan.id,
        version: planData.plan.version,
        status: planData.plan.status,
        objective: planData.plan.objective,
        steps: planData.steps.map((s: any) => ({
          id: s.id,
          order: s.step_order,
          title: s.title,
          description: s.description,
          status: s.status,
          worker_role: s.worker_role,
          authorization_class: s.authorization_class,
          success_criteria: s.success_criteria,
          depends_on_step_id: s.depends_on_step_id,
          created_at: s.created_at,
          updated_at: s.updated_at,
          completed_at: s.completed_at
        }))
      },
      learnings: learnings || [], results: {
        recent: recentResults || [],
        verified: progress.results.verified,
        unverified: progress.results.unverified,
        rejected: progress.results.rejected
      },
      tasks: {
        recent: tasks || [],
        planned: progress.work.planned,
        pending: progress.work.pending,
        running: progress.work.running,
        completed: progress.work.completed,
        failed: progress.work.failed,
        blocked: progress.work.blocked
      },
      activity: events || [],
      approvals,
      authority
    });
  } catch (error: any) {
    if (error.message && error.message.includes('not found in workspace')) {
        return res.status(404).json({ error: 'Mission not found' });
    }
    console.error('[Missions API GET /:id] Exception:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:missionId/:action', async (req: any, res) => {
  const { workspaceId, missionId, action } = req.params;
  const supabase = req.supabase;
  const userId = req.user.id;

  try {
    const validActions: Record<string, string> = {
      activate: 'ACTIVE',
      pause: 'PAUSED',
      resume: 'ACTIVE',
      cancel: 'CANCELLED'
    };

    if (!validActions[action]) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const newStatus = validActions[action];

    const updates: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (action === 'activate' || action === 'resume') {
      updates.started_at = updates.started_at || new Date().toISOString();
    } else if (action === 'cancel') {
      updates.completed_at = new Date().toISOString();
    }

    const { data: mission, error } = await supabase
      .from('business_missions')
      .update(updates)
      .eq('id', missionId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Mission not found' });
      }
      console.error('[Missions API] Supabase query error (POST action):', error);
      throw error;
    }

    await supabase.from('mission_events').insert({
      mission_id: missionId,
      workspace_id: workspaceId,
      event_type: `MISSION_${action.toUpperCase()}`,
      details: { updated_by: userId }
    });

    res.json(mission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


