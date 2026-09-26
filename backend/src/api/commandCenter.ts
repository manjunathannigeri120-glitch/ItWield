import { COOService } from '../services/COOService';
import express from 'express';
import { requireAuth } from '../middleware/auth';
import { WorkforceIntegrityService } from '../services/WorkforceIntegrityService';

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', async (req: any, res) => {
  const { workspaceId } = req.params;
  const supabase = req.supabase;

  try {
    const { data: ws, error: wsError } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();
    if (wsError || !ws) return res.status(404).json({ error: 'Workspace not found' });

    const [
      agentsRes, tasksRes, missionsRes, approvalsRes, memoryRes, eventsRes, opportunitiesRes, managementRes, ceoDecisionsRes
    ] = await Promise.all([
      supabase.from('agents').select('*').eq('workspace_id', workspaceId),
      supabase.from('tasks').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50),
      supabase.from('business_missions').select('*, mission_plans(*, mission_plan_steps(*)), mission_progress(*)').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
      supabase.from('approvals').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
      supabase.from('company_memory').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50),
      supabase.from('mission_events').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50),
      supabase.from('opportunities').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(100),
      supabase.from('management_items').select('*').eq('workspace_id', workspaceId).order('priority', { ascending: true }),
      supabase.from('ceo_decisions').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(20)
    ]);

    const agents = agentsRes.data || [];
    const tasks = tasksRes.data || [];
    const missions = missionsRes.data || [];
    const approvals = approvalsRes.data || [];
    const pendingApprovals = approvals.filter((a: any) => a.status === 'PENDING');
    const memories = memoryRes.data || [];
    const events = eventsRes.data || [];
    const opportunities = opportunitiesRes.data || [];
    const managementItems = managementRes.data || [];
    const ceoDecisions = ceoDecisionsRes.data || [];

    // --- 1. COMPANY HEALTH MODEL ---
    let opsHealth = 'HEALTHY';
    let techHealth = 'HEALTHY';
    let bizHealth = 'HEALTHY';
    let missionHealth = 'HEALTHY';
    
    if (managementItems.some((i: any) => i.type === 'OPERATIONS' && i.priority === 'CRITICAL')) opsHealth = 'DEGRADED';
    else if (managementItems.some((i: any) => i.type === 'OPERATIONS') || pendingApprovals.length > 0 || tasks.some((t: any) => t.status === 'FAILED')) opsHealth = 'ATTENTION';

    if (managementItems.some((i: any) => i.type === 'TECHNOLOGY' && i.priority === 'CRITICAL')) techHealth = 'DEGRADED';
    else if (managementItems.some((i: any) => i.type === 'TECHNOLOGY')) techHealth = 'ATTENTION';

    const blockedMissions = missions.filter((m: any) => m.status === 'PAUSED' || m.status === 'BLOCKED');
    if (blockedMissions.length > 0) missionHealth = 'BLOCKED';
    else if (missions.filter((m: any) => m.status === 'ACTIVE').length > 0) missionHealth = 'HEALTHY';
    else missionHealth = 'NO_DATA';

    if (!ws.company_goals) bizHealth = 'NO_DATA';
    else if (managementItems.some((i: any) => i.type === 'BUSINESS')) bizHealth = 'ATTENTION';

    const custHealth = opportunities.length > 0 ? 'HEALTHY' : 'NO_DATA';
    const workforceHealth = 'HEALTHY';

    const companyStatus = {
      state: opsHealth === 'DEGRADED' || techHealth === 'DEGRADED' ? 'Needs attention' : 'Operating normally',
        reason: 'See health metrics',
        health: {
        business: bizHealth,
        customerGrowth: custHealth,
        missions: missionHealth,
        operations: opsHealth,
        technology: techHealth,
        workforce: workforceHealth
      }
    };

    // --- 2. COMPANY GOALS ---
    const goals = [];
    if (ws.company_goals) {
      goals.push({
        id: 'primary',
        description: ws.company_goals,
        status: 'ACTIVE',
        created_at: ws.created_at,
        metrics: {
          qualified: opportunities.filter((o: any) => o.stage === 'QUALIFIED').length,
          contacted: opportunities.filter((o: any) => o.stage === 'CONTACTED').length,
          responses: opportunities.filter((o: any) => o.stage === 'RESPONDED').length,
          salesQualified: opportunities.filter((o: any) => o.stage === 'SALES_QUALIFIED' || o.stage === 'PROPOSAL').length,
          won: opportunities.filter((o: any) => o.stage === 'WON' || o.stage === 'CONVERTED').length
        }
      });
    }

    // --- 3. EXECUTIVE STATE ---
    const getExec = (name: string) => agents.find((a: any) => a.name === name || a.role?.includes(name));
    const aiCeo = getExec('AI CEO');
    const aiCto = getExec('AI CTO') || getExec('CTO');
    const aiCmo = getExec('AI CMO') || getExec('CMO');
    
    const executives = [
      {
        role: 'CEO',
        name: aiCeo?.name || 'AI CEO',
        focus: ceoDecisions[0]?.assessment || 'Monitoring operations',
        blockers: pendingApprovals.length > 0 ? `${pendingApprovals.length} approvals pending` : 'None',
        latestDecision: ceoDecisions[0]?.decision || 'None'
      },
      {
        role: 'CTO',
        name: aiCto?.name || 'AI CTO',
        focus: techHealth !== 'HEALTHY' ? 'Resolving technology incidents' : 'Maintaining system reliability',
        blockers: techHealth === 'DEGRADED' ? 'Provider availability issues' : 'None',
        latestDecision: 'System optimization'
      },
      {
        role: 'CMO',
        name: aiCmo?.name || 'AI CMO',
        focus: 'Customer Acquisition and Growth',
        blockers: 'None',
        latestDecision: opportunities.length > 0 ? 'Evaluating market responses' : 'Prospecting'
      },
      {
        role: 'CFO',
        name: 'AI CFO',
        focus: 'Financial data not connected.',
        blockers: 'Disconnected',
        latestDecision: 'N/A'
      }
    ];

    // --- 4. OWNER ATTENTION ---
    const ownerAttention: any[] = [];
    
    // Safety / Approvals (High Priority)
    pendingApprovals.forEach((a: any) => {
      ownerAttention.push({
        id: a.id,
        category: 'SECURITY',
        title: `Approval Required: ${a.title}`,
        why: a.reason || 'AI action requires explicit owner authorization.',
        impact: 'Action is blocked until authorized.',
        action: 'Review and approve/reject.',
        url: '/dashboard'
      });
    });

    // Technology Issues
    managementItems.filter((i: any) => i.type === 'TECHNOLOGY').forEach((i: any) => {
      ownerAttention.push({
        id: i.id,
        category: 'TECHNOLOGY',
        title: i.title,
        why: i.description,
        impact: i.priority_reason,
        action: 'Review provider status.',
        url: '/dashboard'
      });
    });

    // Operations Issues
    managementItems.filter((i: any) => i.type === 'OPERATIONS').forEach((i: any) => {
      ownerAttention.push({
        id: i.id,
        category: 'OPERATIONS',
        title: i.title,
        why: i.description,
        impact: i.priority_reason,
        action: 'Review mission configuration.',
        url: '/dashboard'
      });
    });

    // --- 5. BUSINESS OUTCOMES ---
    const businessOutcomes: any[] = [];
    opportunities.filter((o: any) => o.stage === 'RESPONDED' || o.stage === 'WON').forEach((o: any) => {
      businessOutcomes.push({
        id: o.id,
        type: 'CUSTOMER_GROWTH',
        title: `Customer ${o.stage === 'WON' ? 'Acquired' : 'Responded'}: ${o.company_name}`,
        description: `Lead converted to ${o.stage} status.`,
        timestamp: o.updated_at
      });
    });
    
    memories.filter((m: any) => m.memory_type === 'OUTCOME').forEach((m: any) => {
      businessOutcomes.push({
        id: m.id,
        type: 'COMPANY_MEMORY',
        title: m.title,
        description: m.content,
        timestamp: m.created_at
      });
    });
    businessOutcomes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // --- 6. DECISION TIMELINE ---
    const decisionTimeline: any[] = [];
    ceoDecisions.forEach((d: any) => decisionTimeline.push({
      id: d.id,
      timestamp: d.created_at,
      actor: 'AI CEO',
      role: 'CEO',
      action: d.decision,
      reason: d.assessment,
      outcome: d.owner_update || 'Delegated'
    }));
    approvals.filter((a: any) => a.status !== 'PENDING').forEach((a: any) => decisionTimeline.push({
      id: a.id,
      timestamp: a.updated_at,
      actor: 'OWNER',
      role: 'Owner',
      action: a.status === 'APPROVED' ? 'Approved Action' : 'Rejected Action',
      reason: a.title,
      outcome: a.status
    }));
    events.filter((e: any) => e.event_type === 'STATUS_CHANGED').forEach((e: any) => decisionTimeline.push({
      id: e.id,
      timestamp: e.created_at,
      actor: 'SYSTEM',
      role: 'System',
      action: `Mission ${e.details?.new_status || 'updated'}`,
      reason: e.details?.reason || 'Execution pipeline',
      outcome: e.details?.new_status
    }));
    decisionTimeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30);

    // --- 7. WHILE YOU WERE AWAY ---
    const whileYouWereAway = {
      BUSINESS: opportunities.length > 0 ? `${opportunities.length} opportunities tracked.` : null,
      OPERATIONS: events.length > 0 ? `${events.length} mission lifecycle events occurred.` : null,
      TECHNOLOGY: managementItems.some((i: any) => i.type === 'TECHNOLOGY') ? 'Technology warnings detected.' : 'No major technology incidents.',
      AI_DECISIONS: ceoDecisions.length > 0 ? `AI CEO made ${ceoDecisions.length} operational decisions.` : null,
      CUSTOMER_GROWTH: opportunities.filter((o: any) => o.stage === 'QUALIFIED').length > 0 ? 'New leads qualified for outreach.' : null
    };

    // --- 8. ACTIVE MISSIONS ---
    const activeMissions = missions.filter((m: any) => ['ACTIVE', 'PAUSED'].includes(m.status)).map((m: any) => {
      const progress = m.mission_progress?.[0] || {};
      const activePlan = m.mission_plans?.find((p: any) => p.status === 'ACTIVE');
      const steps = activePlan?.mission_plan_steps || [];
      const currentStep = steps.find((s: any) => s.status === 'IN_PROGRESS' || s.status === 'PENDING' || s.status === 'RUNNING') || steps[0];
      
      return {
        id: m.id,
        title: m.title,
        status: m.status,
        objective: m.objective,
        progress: progress.quantifiable_target ? `${progress.current_value || 0} / ${progress.quantifiable_target} verified` : 'In progress',
        currentStep: currentStep ? currentStep.title : 'Initializing'
      };
    });

    // --- 9. COMPANY STEERING ---
    const ownerMemories = memories.filter((m: any) => m.source_type === 'OWNER');
    const companySteering = {
      rules: ownerMemories.filter((m: any) => m.memory_type === 'RULE').length,
      facts: ownerMemories.filter((m: any) => m.memory_type === 'FACT').length,
      preferences: ownerMemories.filter((m: any) => m.memory_type === 'PREFERENCE').length
    };

    // --- 10. WORKFORCE ---
    const workforce = await WorkforceIntegrityService.evaluateWorkforceReadiness(supabase, workspaceId);


    const { data: businessGoals } = await supabase.from('business_goals').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    let cooReview;
    try {
      cooReview = await COOService.executeOperationalReview(supabase, workspaceId);
    } catch (e) {
      cooReview = { whatNext: { priority: 'Unknown', action: 'None' }, cooSummary: 'COO Review failed' };
    }

    const payload = {
      companyStatus,
      goals: businessGoals || [],
      cooReview,
      executives,
      ownerAttention,
      activeMissions,
      businessOutcomes,
      decisionTimeline,
      whileYouWereAway,
      companySteering,
      managementItems,
      workforce, approvals
    };

    res.json(payload);
  } catch (error: any) {
    console.error('Command Center Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
