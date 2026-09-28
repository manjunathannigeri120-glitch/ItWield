import express from 'express';
import { requireAuth } from '../middleware/auth';

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', async (req: any, res) => {
  const { workspaceId } = req.params;
  const db = req.supabase;
  
  try {
    const { data: workers } = await db.from('agents').select('*').eq('workspace_id', workspaceId);
    
    let operating = 0;
    let available = 0;
    let busy = 0;
    let blocked = 0;
    let waitingApproval = 0;
    let failed = 0;

    (workers || []).forEach((w: any) => {
      operating++;
      if (w.status === 'AVAILABLE') available++;
      if (w.status === 'BUSY') busy++;
      if (w.status === 'BLOCKED') blocked++;
      if (w.status === 'WAITING_FOR_APPROVAL') waitingApproval++;
      if (w.status === 'FAILED') failed++;
    });

    // Recent activity (Tasks)
    const { data: tasks } = await db.from('tasks')
      .select('*, agents(name, role)')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(10);

    res.json({
      metrics: { operating, available, busy, blocked, waitingApproval, failed },
      recent_activity: tasks || []
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/workers', async (req: any, res) => {
  const { workspaceId } = req.params;
  const { data, error } = await req.supabase.from('agents').select('*').eq('workspace_id', workspaceId).order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/workers/:workerId', async (req: any, res) => {
  const { workspaceId, workerId } = req.params;
  const { data, error } = await req.supabase.from('agents').select('*').eq('workspace_id', workspaceId).eq('id', workerId).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/tasks', async (req: any, res) => {
  const { workspaceId } = req.params;
  const { data, error } = await req.supabase.from('tasks').select('*, agents(name)').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/tasks/:taskId/reassign', async (req: any, res) => {
  const { workspaceId, taskId } = req.params;
  const { WorkerExecutionService } = require('../services/WorkerExecutionService');
  try {
    const result = await WorkerExecutionService.reassignTask(taskId, req.supabase);
    res.json(result);
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/tasks/:taskId/cancel', async (req: any, res) => {
  const { workspaceId, taskId } = req.params;
  try {
    const { data } = await req.supabase.from('tasks').update({ status: 'CANCELLED' }).eq('workspace_id', workspaceId).eq('id', taskId).select().single();
    res.json({ success: true, task: data });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
