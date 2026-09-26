import express from 'express';
import { requireAuth } from '../middleware/auth';
import { CompanyMemoryService } from '../services/CompanyMemoryService';

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', async (req: any, res) => {
  const { workspaceId } = req.params;
  const supabase = req.supabase;
  const limit = parseInt(req.query.limit || '50');

  try {
    // 1. Basic Workspace Check
    const { data: ws, error: wsError } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();
    if (wsError || !ws) return res.status(404).json({ error: 'Workspace not found' });

    // 2. Fetch Aggregated Data in Parallel
    const [
      agentsRes, tasksRes, missionsRes, approvalsRes, memoryRes, eventsRes, opportunitiesRes, managementRes
    ] = await Promise.all([
      supabase.from('agents').select('*').eq('workspace_id', workspaceId),
      supabase.from('tasks').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(20),
      supabase.from('business_missions').select('*, mission_plans(*, mission_plan_steps(*)), mission_progress(*)').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
      supabase.from('approvals').select('*').eq('workspace_id', workspaceId).eq('status', 'PENDING').order('created_at', { ascending: false }),
      supabase.from('company_memory').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(100),
      supabase.from('mission_events').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(20),
      supabase.from('opportunities').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(10), supabase.from('management_items').select('*, ceo_decisions(*)').eq('workspace_id', workspaceId).order('priority', { ascending: true }).limit(50)
    ]);

    const agents = agentsRes.data || [];
    const tasks = tasksRes.data || [];
    const missions = missionsRes.data || [];
    const pendingApprovals = approvalsRes.data || [];
    const memories = memoryRes.data || [];
    const events = eventsRes.data || [];
    const opportunities = opportunitiesRes.data || [];

    // --- AGGREGATION LOGIC ---

    // A. Company Status
    const incidents = tasks.filter((t: any) => t.status === 'FAILED');
    const blockedMissions = missions.filter((m: any) => m.status === 'PAUSED');
    let companyState = 'Operating normally';
    let companyReason = 'All systems healthy';
    if (incidents.length > 0) {
      companyState = 'Needs attention';
      companyReason = `${incidents.length} task(s) failed recently`;
    } else if (blockedMissions.length > 0) {
      companyState = 'Blocked';
      companyReason = 'One or more missions are paused or blocked';
    } else if (pendingApprovals.length > 0) {
      companyState = 'Action required';
      companyReason = `${pendingApprovals.length} approval(s) waiting`;
    }

    // B. AI CEO Status
    const ceo = agents.find((a: any) => a.name === 'AI CEO' || a.role === 'CEO');
    const ceoTasks = tasks.filter((t: any) => t.assigned_agent_id === ceo?.id);
    const activeCeoTask = ceoTasks.find((t: any) => ['PENDING', 'RUNNING'].includes(t.status));
    
    // Find active mission for CEO focus
    const activeMission = missions.find((m: any) => m.status === 'ACTIVE') || missions[0];
    
    const aiCeoStatus = {
      currentFocus: activeMission ? activeMission.title : 'General operations',
      currentDecision: activeCeoTask ? activeCeoTask.description : 'Monitoring company state',
      lastActivity: ceoTasks[0] ? ceoTasks[0].created_at : ceo?.updated_at || new Date().toISOString(),
      nextExpectedAction: activeMission ? 'Continue mission execution' : 'Await owner directives',
      status: ceo?.status || 'idle'
    };

    // C. Workforce
    const workforce = agents.map((a: any) => {
      const activeTask = tasks.find((t: any) => t.assigned_agent_id === a.id && ['PENDING', 'RUNNING'].includes(t.status));
      return {
        id: a.id,
        name: a.name,
        role: a.role,
        status: activeTask ? 'Working' : (a.status === 'idle' ? 'Active' : a.status),
        currentTask: activeTask ? activeTask.title : null,
        lastActivity: a.updated_at
      };
    });

    // D. Active Missions
    const activeMissions = missions.filter((m: any) => m.status === 'ACTIVE' || m.status === 'DRAFT' || m.status === 'PAUSED').map((m: any) => {
      const progress = m.mission_progress?.[0] || {};
      const activePlan = m.mission_plans?.find((p: any) => p.status === 'ACTIVE');
      const steps = activePlan?.mission_plan_steps || [];
      const currentStep = steps.find((s: any) => s.status === 'IN_PROGRESS' || s.status === 'PENDING') || steps[0];
      const nextStepIndex = steps.findIndex((s: any) => s.id === currentStep?.id) + 1;
      const nextStep = steps[nextStepIndex];

      return {
        id: m.id,
        title: m.title,
        type: m.type,
        target: m.objective,
        progress: progress.quantifiable_target && progress.quantifiable_target > 0 
          ? `${progress.current_value || 0} / ${progress.quantifiable_target} completed`
          : 'Progress not yet measurable',
        currentStep: currentStep?.step_type || 'Initializing',
        nextStep: nextStep?.step_type || 'None',
        status: m.status
      };
    });

    // E. Attention Required
    const attentionRequired: any[] = [];
    pendingApprovals.forEach((a: any) => {
      attentionRequired.push({
        id: a.id,
        type: 'APPROVAL',
        title: a.title,
        description: a.reason,
        actionUrl: `/dashboard`
      });
    });
    incidents.forEach((t: any) => {
      attentionRequired.push({
        id: t.id,
        type: 'INCIDENT',
        title: `Task Failed: ${t.title}`,
        description: t.error_message || 'An AI task encountered a critical failure.',
        actionUrl: `/workflows`
      });
    });

    // F. Recent Outcomes
    const recentOutcomes = [
      ...opportunities.map((o: any) => ({
        id: o.id,
        title: o.title || `Opportunity: ${o.company_name}`,
        mission: 'CRM',
        timestamp: o.created_at,
        url: `/crm`
      })),
      ...memories.filter((m: any) => m.memory_type === 'OUTCOME').map((m: any) => ({
        id: m.id,
        title: m.title,
        mission: m.source_mission_id ? 'Mission Execution' : 'General',
        timestamp: m.created_at,
        url: `/memory`
      }))
    ].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

    // G. While You Were Away
    const whileYouWereAway = {
      count: tasks.filter((t: any) => t.status === 'COMPLETED').length,
      summary: `${opportunities.length} new opportunities found. ${memories.filter((m: any) => m.source_type !== 'OWNER').length} new learnings recorded.`,
      lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Mock 24h for now since we don't track logins
    };

    // H. Company Steering
    const ownerMemories = memories.filter((m: any) => m.source_type === 'OWNER');
    const recentDirective = ownerMemories[0];
    const companySteering = {
      rulesCount: ownerMemories.filter((m: any) => m.memory_type === 'RULE').length,
      factsCount: ownerMemories.filter((m: any) => m.memory_type === 'FACT').length,
      prefsCount: ownerMemories.filter((m: any) => m.memory_type === 'PREFERENCE').length,
      decisionsCount: ownerMemories.filter((m: any) => m.memory_type === 'DECISION').length,
      recentDirective: recentDirective ? `"${recentDirective.content}"` : null
    };

    // I. Activity Stream
    const activityStream = [
      ...tasks.map((t: any) => ({
        id: t.id,
        timestamp: t.created_at,
        description: `Task ${t.status}: ${t.title} (${t.assigned_agent_id === ceo?.id ? 'AI CEO' : 'Worker'})`
      })),
      ...events.map((e: any) => ({
        id: e.id,
        timestamp: e.created_at,
        description: `Mission Event: ${e.event_type}`
      }))
    ].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    // Customer Growth Metrics
    const customerGrowth = {
      qualified: opportunities.filter((o: any) => ['QUALIFIED', 'PRIORITIZED', 'OUTREACH_DRAFTED', 'AWAITING_APPROVAL'].includes(o.stage)).length,
      contacted: opportunities.filter((o: any) => o.stage === 'CONTACTED').length,
      responses: opportunities.filter((o: any) => o.stage === 'RESPONDED').length,
      salesQualified: opportunities.filter((o: any) => o.stage === 'SALES_QUALIFIED' || o.stage === 'PROPOSAL').length,
      won: opportunities.filter((o: any) => o.stage === 'WON' || o.stage === 'CONVERTED').length,
      pendingApprovals: pendingApprovals.filter((a: any) => a.action_type === 'EXTERNAL_COMMUNICATION').length
    };

    opportunities.filter((o: any) => o.stage === 'RESPONDED' && o.response_status === 'RECEIVED').forEach((o: any) => {
      attentionRequired.push({
        id: o.id,
        type: 'CRM_RESPONSE',
        title: `Customer Response: ${o.company_name}`,
        description: `AI assessment: ${o.ai_classification || 'Review required'}`,
        actionUrl: `/crm`
      });
    });

    const payload = {
      companyStatus: { state: companyState, reason: companyReason },
      aiCeoStatus,
      workforce,
      activeMissions,
      attentionRequired,
      approvals: pendingApprovals,
      recentOutcomes,
      whileYouWereAway,
      companySteering,
      customerGrowth,
      activityStream
    };

    res.json(payload);
  } catch (error: any) {
    console.error('Command Center Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
