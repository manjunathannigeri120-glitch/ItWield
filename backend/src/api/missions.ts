import express from 'express';
import { requireAuth } from '../middleware/auth';

const router = express.Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', async (req: any, res) => {
  const { workspaceId } = req.params;
  const supabase = req.supabase;

  try {
    const { data, error } = await supabase
      .from('business_missions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: any, res) => {
  const { workspaceId } = req.params;
  const { type, title, description, objective, success_criteria, priority } = req.body;
  const supabase = req.supabase;
  const userId = req.user.id;

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

    if (error) throw error;

    await supabase.from('mission_events').insert({
      mission_id: data.id,
      workspace_id: workspaceId,
      event_type: 'MISSION_CREATED',
      details: { created_by: userId }
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

    if (error) throw error;

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

    if (error) throw error;

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

