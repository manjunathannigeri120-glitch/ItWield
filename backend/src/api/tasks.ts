import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// Get all tasks for a workspace
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
    const workspaceId = req.query.workspaceId || req.query.workspace_id;
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' });

    // Verify workspace access
    const { data: workspace, error: wErr } = await req.supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .single();

    if (wErr || !workspace) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    const { data, error } = await req.supabase
      .from('tasks')
      .select('*, assigned_agent:agents(id, name, role)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get task by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
    const { data, error } = await req.supabase
      .from('tasks')
      .select('*, assigned_agent:agents(id, name, role)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new task
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
    const { workspace_id, title, description, assigned_agent_id, priority, input } = req.body;
    
    // Strict server-side verification of workspace access
    const { data: workspace, error: wErr } = await req.supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspace_id)
      .single();

    if (wErr || !workspace) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    const { data, error } = await req.supabase
      .from('tasks')
      .insert({
        workspace_id,
        title,
        description,
        assigned_agent_id,
        priority: priority || 'normal',
        status: 'PENDING',
        input: input || {}
      })
      .select()
      .single();

    if (error) throw error;

    // Log event (append only)
    await req.supabase.from('task_events').insert({
      task_id: data.id,
      workspace_id,
      event_type: 'TASK_CREATED',
      details: { title, assigned_agent_id }
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update task status
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
    const { status, output, error: taskError, assigned_agent_id } = req.body;
    
    const validStatuses = ['PENDING', 'ASSIGNED', 'RUNNING', 'BLOCKED', 'COMPLETED', 'FAILED', 'ESCALATED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid task status' });
    }

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (status !== undefined) updatePayload.status = status;
    if (output !== undefined) updatePayload.output = output;
    if (taskError !== undefined) updatePayload.error = taskError;
    if (assigned_agent_id !== undefined) updatePayload.assigned_agent_id = assigned_agent_id;
    if (status === 'COMPLETED' || status === 'FAILED') updatePayload.completed_at = new Date().toISOString();
    if (status === 'RUNNING') updatePayload.started_at = new Date().toISOString();

    const { data, error } = await req.supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    let eventType = 'TASK_UPDATED';
    if (status === 'COMPLETED') eventType = 'TASK_COMPLETED';
    else if (status === 'FAILED') eventType = 'TASK_FAILED';
    else if (status === 'RUNNING') eventType = 'TASK_STARTED';
    else if (status === 'ASSIGNED') eventType = 'TASK_ASSIGNED';

    await req.supabase.from('task_events').insert({
      task_id: data.id,
      workspace_id: data.workspace_id,
      event_type: eventType,
      details: { status, assigned_agent_id }
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get task events
router.get('/:id/events', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
    const { data, error } = await req.supabase
      .from('task_events')
      .select('*')
      .eq('task_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const tasksRouter = router;
