const fs = require('fs');
let code = fs.readFileSync('backend/src/api/missions.ts', 'utf8');

if (!code.includes('MissionProgressService')) {
    code = code.replace("import { requireAuth } from '../middleware/auth';", "import { requireAuth } from '../middleware/auth';\nimport { MissionProgressService } from '../services/MissionProgressService';");
}

const targetGetRoute = \outer.get('/:missionId', async (req: any, res) => {
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
});\;

const replacementGetRoute = \outer.get('/:missionId', async (req: any, res) => {
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

    const { data: recentResults } = await supabase
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
    let approvals = [];
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
      results: {
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
});\;

code = code.replace(targetGetRoute, replacementGetRoute);
fs.writeFileSync('backend/src/api/missions.ts', code, 'utf8');
