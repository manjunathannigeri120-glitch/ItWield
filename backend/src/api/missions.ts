import express from 'express';
import { requireAuth } from '../middleware/auth';

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

    const { data: events } = await supabase
      .from('mission_events')
      .select('*')
      .eq('mission_id', missionId)
      .order('created_at', { ascending: false });

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, created_at, updated_at, assigned_agent_id')
      .eq('mission_id', missionId)
      .order('created_at', { ascending: false });

    res.json({ ...mission, events: events || [], tasks: tasks || [] });
  } catch (error: any) {
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

