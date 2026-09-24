import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { WorkflowEngine } from '../workflows/engine';
import { AuthorizationRegistry } from './AuthorizationRegistry';
import { CompanyMemoryService } from './CompanyMemoryService';
import { ContinuousImprovementService } from './ContinuousImprovementService';
import { ActionRegistry } from '../workflows/actions/ActionRegistry';


export class CEOService {
  static async run(supabase: any, workspaceId: string, objective: string, userId: string = 'service_role', sourceWorkflowId?: string, actualNextRunAt?: string, missionId?: string) {
    console.log(`[CEOService] Initiating CEO run for workspace: ${workspaceId}`);
    
    // 1. Gather Company Context and Lock Workspace
    const { data: company, error: cErr } = await supabase
      .from('workspaces')
      .update({ status: 'evaluating' })
      .eq('id', workspaceId)
      .neq('status', 'evaluating')
      .select('*')
      .single();
    if (cErr || !company) {
      console.log(`[CEOService] Workspace ${workspaceId} locked or not found.`);
      return;
    }
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, description, status, capabilities')
      .eq('workspace_id', workspaceId);

    const { data: activeTasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority, assigned_agent_id')
      .eq('workspace_id', workspaceId)
      .in('status', ['PENDING', 'ASSIGNED', 'RUNNING', 'BLOCKED', 'ESCALATED']);
      
    const { data: workflows } = await supabase
      .from('workflows')
      .select('id, name, status')
      .eq('workspace_id', workspaceId);

    // 2. Build Prompt
    const relevantMemory = await CompanyMemoryService.getRelevantMemory(workspaceId, 'CEO', 20, supabase);
    const memoryContext = CompanyMemoryService.formatMemoryForContext(relevantMemory);

    // Fetch active improvement proposals for CEO context
    const activeProposals = await ContinuousImprovementService.getActiveProposals(supabase, workspaceId, 5);
    const improvementContext = ContinuousImprovementService.formatProposalsForContext(activeProposals);

    const systemPrompt = `You are the AI CEO of a company. Your job is to orchestrate the workforce to accomplish the owner's objective.
    
Company Context:	
Name: ${company.name}
Industry: ${company.industry || 'Unknown'}
Goals: ${company.company_goals || 'Unknown'}
Policies: ${company.policies || 'None'}
${memoryContext}
${improvementContext}

Available Workforce (Agents):
${JSON.stringify(agents, null, 2)}

Active Tasks:
${JSON.stringify(activeTasks, null, 2)}

Available Executable Workflows:
${JSON.stringify(workflows, null, 2)}

Owner Objective: "${objective}"

Output strictly valid JSON exactly matching this schema:
{
  "assessment": "String describing your understanding of the situation.",
  "priority": "low" | "medium" | "high" | "critical",
  "decision": "continue" | "delegate" | "retry" | "reassign" | "escalate" | "no_action",
  "tasks": [
    {
      "title": "String",
      "description": "String",
      "agent_id": "UUID of chosen agent",
      "priority": "low" | "medium" | "high" | "critical",
      "workflow_id": "Optional UUID of a workflow to execute for this task",
      "input": {} // Optional JSON object for task input
    }
  ],
  "owner_update": "String concisely summarizing your actions for the owner."
}
Only delegate to agents that actually exist in the Available Workforce. Do not invent agent IDs.
Do not output anything outside the JSON structure.`;

    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || 'mock',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        'X-Title': 'ItWield CEO'
      }
    });

    let ceoDecision: any;
    let decisionSource = 'LIVE_LLM';
    try {
      if (objective.startsWith('SCHEDULED_OBSERVATION') || !process.env.OPENROUTER_API_KEY) {
        // Deterministic MVP fallback — no OpenRouter key OR explicit scheduled observation
        decisionSource = 'DETERMINISTIC_FALLBACK';
        const tasksToCreate = objective.includes(':') ? objective.split(':')[1].split(',') : ['APPLICATION_MONITORING'];

        const generatedTasks = [];

        for (const taskType of tasksToCreate) {
          if (taskType === 'APPLICATION_MONITORING') {
            const appMonitor = agents?.find((a: any) => a.name === 'Application Monitor');
            const cto = agents?.find((a: any) => a.name === 'AI CTO');
            const assignee = cto || appMonitor || (agents && agents.length > 0 ? agents[0] : null);

            let website = 'https://example.com';
            try {
              const ctx = JSON.parse(company.operational_context || '{}');
              if (ctx.website) website = ctx.website;
            } catch (_) { /* ignore parse errors */ }

            if (assignee) {
              generatedTasks.push({
                title: 'Application Health Check',
                description: `Check application health for ${company.name}. Verify the website is reachable, record HTTP status, and report results.`,
                agent_id: assignee.id,
                priority: 'high',
                workflow_id: null,
                input: {
                  task_type: 'APPLICATION_MONITORING',
                  website,
                  delegate_to: appMonitor ? appMonitor.id : null
                }
              });
            }
          }

          if (taskType === 'COMPETITIVE_ANALYSIS') {
            const compAnalyst = agents?.find((a: any) => a.name === 'Competitor Analyst');
            const cmo = agents?.find((a: any) => a.name === 'AI CMO');
            const assignee = cmo || compAnalyst || (agents && agents.length > 0 ? agents[0] : null);

            if (assignee) {
              generatedTasks.push({
                title: 'Competitive Analysis',
                description: `Analyze market competitors for ${company.name} based on the stated goal to acquire customers.`,
                agent_id: assignee.id,
                priority: 'medium',
                workflow_id: null,
                input: {
                  task_type: 'COMPETITIVE_ANALYSIS',
                  delegate_to: compAnalyst ? compAnalyst.id : null
                }
              });
            }
          }

          if (taskType === 'LEAD_RESEARCH') {
            const cmo = agents?.find((a: any) => a.name === 'AI CMO');
            const assignee = cmo || (agents && agents.length > 0 ? agents[0] : null);

            if (assignee) {
              generatedTasks.push({
                title: 'Lead Research',
                description: `Identify and research potential leads for ${company.name}.`,
                agent_id: assignee.id,
                priority: 'high',
                workflow_id: null,
                input: {
                  task_type: 'LEAD_RESEARCH',
                  delegate_to: assignee.id
                }
              });
            }
          }
        }

        let assessmentText = `Initiating scheduled observation tasks for ${company.name}.`;
        if (tasksToCreate.includes('COMPETITIVE_ANALYSIS')) {
          assessmentText = `Detected customer acquisition goal. Initiating competitive analysis and operational tasks for ${company.name}.`;
        }

        ceoDecision = {
          assessment: assessmentText,
          priority: 'high',
          decision: 'delegate',
          tasks: generatedTasks,
          owner_update: `CEO initiated operations for ${company.name}.`
        };
      } else {
        const response = await openai.chat.completions.create({
          model: 'openrouter/free',
          messages: [{ role: 'system', content: systemPrompt }],
          response_format: { type: 'json_object' }
        });
        const content = response.choices[0].message.content || '{}';
        ceoDecision = JSON.parse(content);
      }
        } catch (e: any) {
      await supabase.from('workspaces').update({ status: 'operating' }).eq('id', workspaceId);
      const isRateLimit = e.status === 429 || (e.message && e.message.includes('429'));
      if (isRateLimit) {
        console.warn(`[CEOService] Provider rate limit exceeded (429) for workspace ${workspaceId}.`);
        await supabase.from('workspace_events').insert({
          workspace_id: workspaceId,
          event_type: 'PROVIDER_RATE_LIMIT',
          details: { error: e.message, provider: 'openrouter' }
        });
        return; // Exit gracefully
      }
      throw new Error(`AI CEO orchestration failed: ${e.message}`);
    }

    const createdTasks = [];

    // 3. Process Delegation
    if (ceoDecision.tasks && Array.isArray(ceoDecision.tasks)) {
      for (const t of ceoDecision.tasks) {
        // Verify agent exists
        const agentExists = agents?.find((a: any) => a.id === t.agent_id);
        if (!agentExists) {
          console.warn(`[CEOService] Agent ${t.agent_id} does not exist. Skipping task creation.`);
          continue;
        }

        const actionId = t.input?.task_type || (t.workflow_id ? 'WORKFLOW_EXECUTION' : 'UNKNOWN');
        
        let aiPermissions = {};
        try {
          const ctx = JSON.parse(company.operational_context || '{}');
          aiPermissions = ctx.ai_permissions || {};
        } catch (_) {}

        const authResult = AuthorizationRegistry.authorize(actionId, aiPermissions);

        if (!authResult.authorized) {
          console.warn(`[CEOService] Action BLOCKED by registry: ${actionId}. Reason: ${authResult.reason}`);
          
          if (authResult.requiresApproval) {
            await supabase.from('approvals').insert({
              workspace_id: workspaceId,
              action: actionId,
              title: t.title || actionId,
              reason: authResult.reason,
              requested_by_executive: t.agent_id,
              risk_level: authResult.definition?.riskLevel || 'high',
              status: 'PENDING_APPROVAL',
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });

            await supabase.from('task_events').insert({
              task_id: null,
              workspace_id: workspaceId,
              event_type: 'OWNER_APPROVAL_REQUIRED',
              details: {
                action: actionId,
                decision: 'OWNER_APPROVAL_REQUIRED',
                reason: authResult.reason,
                executive: t.agent_id,
                objective: t.title,
                authorization_source: 'AuthorizationRegistry'
              }
            });
          } else {
            await supabase.from('task_events').insert({
              task_id: null,
              workspace_id: workspaceId,
              event_type: 'ACTION_BLOCKED',
              details: {
                action: actionId,
                decision: 'BLOCKED',
                reason: authResult.reason,
                executive: t.agent_id,
                objective: t.title,
                authorization_source: 'AuthorizationRegistry'
              }
            });
          }
          continue;
        }

        // Action Authorized
        await supabase.from('task_events').insert({
          task_id: null,
          workspace_id: workspaceId,
          event_type: 'ACTION_AUTHORIZED',
          details: {
            action: actionId,
            decision: 'AUTHORIZED',
            reason: authResult.reason,
            executive: t.agent_id,
            objective: t.title,
            authorization_source: 'AuthorizationRegistry'
          }
        });

        const taskInsert = {
          workspace_id: workspaceId,
          mission_id: missionId || null,
          title: t.title,
          description: t.description,
          workflow_run_id: t.workflow_id,
          assigned_agent_id: t.agent_id,
          priority: t.priority || 'normal',
          status: 'PENDING',
          input: t.input || {},
          source_workflow_id: sourceWorkflowId || null,
          execution_lease_until: new Date(Date.now() + 15 * 60000).toISOString()
        };

        const { data: createdTask, error: ctErr } = await supabase
          .from('tasks')
          .insert(taskInsert)
          .select()
          .single();

        if (ctErr) {
          if (ctErr.code === '23505') {
            console.log(`[CEOService] Idempotency catch: Task for observation workflow ${sourceWorkflowId} or type ${t.input?.task_type} is already active. Skipping.`);
            continue;
          }
          console.error(`[CEOService] Failed to create task:`, ctErr);
          continue;
        }

        createdTasks.push(createdTask);

        await supabase.from('task_events').insert({
          task_id: createdTask.id,
          workspace_id: workspaceId,
          event_type: 'TASK_CREATED',
          details: { source: 'CEO', decision_source: decisionSource, title: createdTask.title }
        });

        if (t.input?.task_type === 'COMPETITIVE_ANALYSIS') {
          await supabase.from('task_events').insert({
            task_id: createdTask.id,
            workspace_id: workspaceId,
            event_type: 'CEO_GOAL_ACTION_CREATED',
            details: {
              goal: 'Acquire early customers',
              objective: t.title,
              reason: 'Initiated from stated customer-acquisition goal',
              authority: 'Deterministic fallback / System default',
              assignedExecutive: t.agent_id,
              assignedWorker: t.input?.delegate_to
            }
          });
        }

        // 4. Trigger Workflow or Inline Task if specified
        if (t.workflow_id) {
          // Fire and forget execution
          this.executeTaskWorkflow(supabase, createdTask.id, t.workflow_id, t.input, userId, t.agent_id).catch(err => {
            console.error(`[CEOService] Workflow execution failed for task ${createdTask.id}:`, err);
          });
        } else if (t.input && (t.input.task_type === 'APPLICATION_MONITORING' || t.input.task_type === 'COMPETITIVE_ANALYSIS')) {
          this.executeInlineTask(supabase, createdTask.id, t.input, userId, t.agent_id).catch(err => {
            console.error(`[CEOService] Inline execution failed for task ${createdTask.id}:`, err);
          });
        } else {
          // Block task and agent if no executable capability
          await supabase.from('tasks').update({ status: 'BLOCKED', error: 'No executable capability configured.' }).eq('id', createdTask.id);
          await supabase.from('task_events').insert({ task_id: createdTask.id, workspace_id: workspaceId, event_type: 'TASK_BLOCKED', details: { error: 'No executable capability configured.' } });
          if (t.agent_id) {
            await supabase.from('agents').update({ status: 'blocked' }).eq('id', t.agent_id);
          }
        }
      }
    }

    // Unlock workspace
    await supabase.from('workspaces').update({ status: 'operating' }).eq('id', workspaceId);

    if (sourceWorkflowId && actualNextRunAt) {
      await supabase.from('workflows').update({ next_run_at: actualNextRunAt }).eq('id', sourceWorkflowId);
    }

    return {
      runId: Date.now().toString(),
      assessment: ceoDecision.assessment,
      decision: ceoDecision.decision,
      tasksCreated: createdTasks.length,
      tasks: createdTasks,
      ownerUpdate: ceoDecision.owner_update,
      status: 'COMPLETED'
    };
  }

  static async observeWorkspace(supabase: SupabaseClient, workspaceId: string) {
    // Database Enforced Concurrency / Locking
    const { data: lockData } = await supabase.from('workspaces')
      .update({ status: 'ceo_evaluating' })
      .eq('id', workspaceId)
      .eq('status', 'operating')
      .select('id')
      .single();

    if (!lockData) {
      // Workspace is locked or inactive, skip observation
      return;
    }

    let shouldUnlock = true;
    try {
      const { data: company } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();
      if (!company) return;

      let website = null;
      try {
        const ctx = JSON.parse(company.operational_context || '{}');
        website = ctx.website;
      } catch (e) {}

      const { data: activeTasks } = await supabase.from('tasks')
        .select('id, input, mission_id')
        .eq('workspace_id', workspaceId)
        .in('status', ['PENDING', 'ASSIGNED', 'RUNNING']);

        // Phase 1B - Mission Orchestration
    const { data: missions } = await supabase.from('business_missions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['ACTIVE']);
      
    if (missions && missions.length > 0) {
      const { MissionProgressService } = await import('./MissionProgressService');

      for (const mission of missions) {
        try {
          // 1. Authoritative Derived State
          const progress = await MissionProgressService.calculateProgress(supabase, workspaceId, mission.id);
          console.log('[CEOService] Diagnostic - Mission progress:', {
            verified: progress.results.verified,
            target: progress.target.count,
            pending: progress.work.pending,
            running: progress.work.running,
            blocker: progress.blocker,
            completionEligible: progress.completionEligible,
            nextAction: progress.nextAction
          });
          
          // 2. DETERMINISTIC SAFETY GATE
          if (progress.status !== 'ACTIVE') continue;
          
          if (progress.completionEligible) {
             // Stop creating work and invoke lifecycle completion
             await supabase.from('business_missions').update({ status: 'COMPLETED', updated_at: new Date().toISOString() }).eq('id', mission.id);
             await supabase.from('mission_events').insert({ mission_id: mission.id, workspace_id: workspaceId, event_type: 'STATUS_CHANGED', details: { old_status: 'ACTIVE', new_status: 'COMPLETED', reason: 'Success criteria reached' } });
             console.log('[CEOService] Mission ' + mission.id + ' completed successfully.'); try { const { MissionLearningService } = await import('./MissionLearningService'); const learnings = await MissionLearningService.extractMissionLearnings(supabase, workspaceId, mission.id); if (learnings.length > 0) { await MissionLearningService.persistLearnings(supabase, workspaceId, mission.id, learnings); console.log('[CEOService] Mission ' + mission.id + ' extracted ' + learnings.length + ' learnings.'); } } catch (err) { console.error('[CEOService] Failed to extract mission learnings:', err); } continue;
          }

          if (progress.blocker) {
             // E.g., CONNECTION_REQUIRED or OWNER_APPROVAL_REQUIRED.
             // Do not create duplicate work. Surface blocker.
             console.log('[CEOService] Mission ' + mission.id + ' is blocked: ' + progress.blocker.type);
             continue;
          }

          if (progress.work.running > 0 || progress.work.pending > 0) {
             // Do not create duplicate work if useful authorized work is already running or assigned/pending
             console.log('[CEOService] Mission ' + mission.id + ' has active work. Waiting.');
             continue;
          }

          // 3. Adaptive Mission Planning Orchestration
          const { MissionPlanningService } = await import('./MissionPlanningService');
          const planData = await MissionPlanningService.getOrCreateActivePlan(supabase, workspaceId, mission.id, mission.type);
          const { readyStep, isComplete } = await MissionPlanningService.evaluatePlanState(supabase, workspaceId, planData.plan, planData.steps);

          if (isComplete) {
              await MissionPlanningService.completePlan(supabase, planData.plan.id);
              console.log(`[CEOService] Mission plan for ${mission.id} is fully completed.`);
              // For MVP, completing the plan just awaits further planning or mission completion check next tick.
              continue;
          }

          if (readyStep) {
              // Safety auth check
              const authResult = AuthorizationRegistry.authorize(readyStep.authorization_class, {});
              if (!authResult.authorized && !authResult.requiresApproval) {
                 console.log(`[CEOService] Mission plan step blocked by registry (PROHIBITED): ${readyStep.authorization_class}`);
                 await supabase.from('mission_plan_steps').update({ status: 'BLOCKED' }).eq('id', readyStep.id);
                 continue;
              }
              if (authResult.requiresApproval) {
                 console.log(`[CEOService] Mission plan step blocked by registry (APPROVAL_REQUIRED): ${readyStep.authorization_class}`);
                 await supabase.from('mission_plan_steps').update({ status: 'BLOCKED' }).eq('id', readyStep.id);
                 continue;
              }

              shouldUnlock = false;
              await supabase.from('workspaces').update({ status: 'operating' }).eq('id', workspaceId);
              
              // Mark step running
              await MissionPlanningService.markStepRunning(supabase, readyStep.id);
              
              // Spawn ONE bounded task
              await CEOService.run(supabase, workspaceId, 'SCHEDULED_OBSERVATION:' + readyStep.step_type, 'service_role', undefined, undefined, mission.id);
              return; // orchestrate one mission per tick to prevent race conditions easily
          }
        } catch (missionErr) {
          console.error('[CEOService] Mission orchestration error for ' + mission.id + ':', missionErr);
        }
      }
    }

    // Phase 2 - Goals evaluation
    const hasMonitoring = activeTasks?.some(t => t.input && t.input.task_type === 'APPLICATION_MONITORING');
    const goals = company.company_goals?.toLowerCase() || '';
    const wantsCustomers = goals.includes('acquire') || goals.includes('customer') || goals.includes('competitor') || goals.includes('growth');
    const hasCompAnalysis = activeTasks?.some(t => t.input && t.input.task_type === 'COMPETITIVE_ANALYSIS');

    let triggerMonitoring = false;
    let triggerCompetitor = false;

    if (!hasMonitoring) {
      if (!website) {
        // No website configured, do not invent. Prevent duplicate blocks (once per day).
        const { data: recentBlocked } = await supabase.from('task_events')
          .select('id, created_at')
          .eq('workspace_id', workspaceId)
          .eq('event_type', 'OBSERVATION_BLOCKED')
          .order('created_at', { ascending: false })
          .limit(1);
        
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (!recentBlocked || recentBlocked.length === 0 || new Date(recentBlocked[0].created_at) < oneDayAgo) {
          await supabase.from('task_events').insert({
            workspace_id: workspaceId,
            event_type: 'OBSERVATION_BLOCKED',
            details: { reason: "Application monitoring cannot run because this company has no website/application connection configured." }
          });
        }
      } else {
        const { data: recentSuccess } = await supabase.from('tasks')
          .select('id, completed_at, input')
          .eq('workspace_id', workspaceId)
          .eq('status', 'COMPLETED')
          .order('completed_at', { ascending: false })
          .limit(20);
        const latestMonitoring = recentSuccess?.find(t => t.input && t.input.task_type === 'APPLICATION_MONITORING');
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (!latestMonitoring || !latestMonitoring.completed_at || new Date(latestMonitoring.completed_at) < fifteenMinsAgo) {
          triggerMonitoring = true;
        }
      }
    }

    if (wantsCustomers && !hasCompAnalysis) {
      const { data: recentSuccess } = await supabase.from('tasks')
        .select('id, completed_at, input')
        .eq('workspace_id', workspaceId)
        .eq('status', 'COMPLETED')
        .order('completed_at', { ascending: false })
        .limit(20);
      const latestComp = recentSuccess?.find(t => t.input && t.input.task_type === 'COMPETITIVE_ANALYSIS');
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      if (!latestComp || !latestComp.completed_at || new Date(latestComp.completed_at) < twelveHoursAgo) {
        triggerCompetitor = true;
      }
    }

    const triggers = [];
    if (triggerMonitoring) triggers.push('APPLICATION_MONITORING');
    if (triggerCompetitor) triggers.push('COMPETITIVE_ANALYSIS');

    if (triggers.length > 0) {
      await supabase.from('workspaces').update({ status: 'operating' }).eq('id', workspaceId);
      shouldUnlock = false;
      await CEOService.run(supabase, workspaceId, `SCHEDULED_OBSERVATION:${triggers.join(',')}`, 'service_role');
    }

    // Continuous Improvement: Analyze workspace for patterns (fire-and-forget, fail-safe)
    ContinuousImprovementService.analyzeWorkspace(supabase, workspaceId).catch((e: any) => {
      console.error('[CEOService] Continuous improvement analysis failed:', e.message);
    });
    } finally {
      if (shouldUnlock) {
        await supabase.from('workspaces').update({ status: 'operating' }).eq('id', workspaceId);
      }
    }
  }

  static async executeInlineTask(supabase: SupabaseClient, taskId: string, inputData: any, userId: string, agentId?: string) {
    const { data: taskData } = await supabase.from('tasks').update({ status: 'RUNNING', started_at: new Date().toISOString() }).eq('id', taskId).select('workspace_id').single();
    const workspaceId = taskData?.workspace_id;

    if (agentId) {
      await supabase.from('agents').update({ status: 'working' }).eq('id', agentId);
    }
    
    await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workspaceId, event_type: 'TASK_STARTED', details: { type: inputData.task_type || 'inline_task' } });

    let executorId = agentId;
    if (inputData.delegate_to && inputData.delegate_to !== agentId) {
      executorId = inputData.delegate_to;
      await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workspaceId, event_type: 'TASK_ASSIGNED', details: { assigned_to: executorId, note: 'Delegated by manager' } });
      await supabase.from('tasks').update({ assigned_agent_id: executorId }).eq('id', taskId);
      if (agentId) await supabase.from('agents').update({ status: 'idle' }).eq('id', agentId);
      if (executorId) await supabase.from('agents').update({ status: 'working' }).eq('id', executorId);
    }

    try {
      const actionType = inputData.task_type || inputData.action || 'APPLICATION_MONITORING';
      
      // 1. Worker Capability Validation
      if (executorId) {
        const { data: executor } = await supabase.from('agents').select('capabilities').eq('id', executorId).single();
        if (executor) {
          const capabilities = executor.capabilities || [];
          if (!capabilities.includes(actionType)) {
             throw new Error(`Worker missing required capability: ${actionType}`);
          }
        }
      }

      // 2. Connection Validation
      const authResult = AuthorizationRegistry.authorize(actionType);
      const reqConn = authResult.definition?.requiredConnection;
      let decryptedConnection = null;
      if (reqConn) {
        if (reqConn === 'web_search' && !process.env.TAVILY_API_KEY && process.env.NODE_ENV !== 'test') {
           await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workspaceId, event_type: 'CONNECTION_REQUIRED', details: { provider: reqConn, note: `Worker needs a ${reqConn} connection to execute ${actionType}.` } });
           throw new Error(`CONNECTION_REQUIRED: ${reqConn}`);
        } else if (reqConn !== 'web_search') {
           const { data: conn } = await supabase.from('connections').select('*').eq('workspace_id', workspaceId).eq('provider', reqConn).single();
           if (!conn || conn.status === 'disconnected' || conn.status === 'error') {
              await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workspaceId, event_type: 'CONNECTION_REQUIRED', details: { provider: reqConn, note: `Worker needs an active ${reqConn} connection to execute ${actionType}.` } });
              throw new Error(`CONNECTION_REQUIRED: ${reqConn}`);
           }
           const { decryptObject } = await import('../utils/encryption');
           decryptedConnection = decryptObject(conn.credentials);
        }
      }

      const action = ActionRegistry.get(actionType);
      
      if (!action) {
        throw new Error(`Action not registered or not available: ${actionType}`);
      }

      // Merge inputs to config
      const config = { url: inputData.website || 'https://itwield.vercel.app', connection: decryptedConnection, ...inputData };
      
      const result = await action.execute(
        config, 
        { supabase, runId: '', userId, workspaceId, attempt: 1 }
      );

      
      const finalState = { error: result.success ? null : result.error || 'Task failed', output: result };
      const finalStatus = result.success ? 'COMPLETED' : 'FAILED';
      
      await supabase.from('tasks').update({ 
        status: finalStatus, 
        output: finalState.output || {}, 
        error: finalState.error || null,
        completed_at: new Date().toISOString()
      }).eq('id', taskId);

      await supabase.from('task_events').insert({ 
        task_id: taskId, 
        workspace_id: workspaceId, 
        event_type: result.success ? 'TASK_COMPLETED' : 'TASK_FAILED',
        details: { output: finalState.output, error: finalState.error }
      });
      
      if (executorId) {
        await supabase.from('agents').update({ status: 'idle' }).eq('id', executorId);
      }
      
      await CEOService.evaluateTaskResult(supabase, taskId, workspaceId, userId, executorId);
    } catch (e: any) {
      await supabase.from('tasks').update({ status: 'FAILED', error: e.message, completed_at: new Date().toISOString() }).eq('id', taskId);
      await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workspaceId, event_type: 'TASK_FAILED', details: { error: e.message } });
      
      if (agentId) await supabase.from('agents').update({ status: 'idle' }).eq('id', agentId);
      if (executorId && executorId !== agentId) await supabase.from('agents').update({ status: 'idle' }).eq('id', executorId);
      
      await CEOService.evaluateTaskResult(supabase, taskId, workspaceId, userId, executorId);
    }
  }

  static async executeTaskWorkflow(supabase: SupabaseClient, taskId: string, workflowId: string, inputData: any, userId: string, agentId?: string) {
    // Mark task running and agent working
    const { data: taskData } = await supabase.from('tasks').update({ status: 'RUNNING', started_at: new Date().toISOString() }).eq('id', taskId).select('workspace_id').single();
    const workspaceId = taskData?.workspace_id;

    if (agentId) {
      await supabase.from('agents').update({ status: 'working' }).eq('id', agentId);
    }
    
    // Get workflow
    const { data: workflow } = await supabase.from('workflows').select('*').eq('id', workflowId).single();
    if (!workflow) {
      await supabase.from('tasks').update({ status: 'FAILED', error: 'Workflow not found', completed_at: new Date().toISOString() }).eq('id', taskId);
      await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workspaceId, event_type: 'TASK_FAILED' });
      return;
    }

    // Create workflow run
    const { data: run } = await supabase.from('workflow_runs').insert({
      workflow_id: workflowId,
      user_id: userId,
      status: 'running',
      trigger_data: inputData || {}
    }).select().single();

    if (!run) return;

    // Link run to task
    await supabase.from('tasks').update({ workflow_run_id: run.id }).eq('id', taskId);
    await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workflow.workspace_id, event_type: 'TASK_STARTED', details: { run_id: run.id } });

    try {
      // Execute
      const finalState = await WorkflowEngine.run(supabase, workflow, run.id, inputData || {}, userId);
      
      const success = !finalState.error;

      // Handle Retries
      const { data: taskInfo } = await supabase.from('tasks').select('retry_count, max_retries').eq('id', taskId).single();
      
      if (!success && taskInfo && taskInfo.retry_count < taskInfo.max_retries) {
        console.log(`[CEOService] Retrying task ${taskId} (${taskInfo.retry_count + 1}/${taskInfo.max_retries})`);
        
        await supabase.from('tasks').update({ 
          status: 'PENDING', 
          retry_count: taskInfo.retry_count + 1,
          error: finalState.error || 'Retry triggered'
        }).eq('id', taskId);

        await supabase.from('task_events').insert({ 
          task_id: taskId, 
          workspace_id: workflow.workspace_id, 
          event_type: 'RETRY',
          details: { error: finalState.error, retry_count: taskInfo.retry_count + 1 }
        });
        
        if (agentId) {
          await supabase.from('agents').update({ status: 'idle' }).eq('id', agentId);
        }
        
        // Execute retry after delay
        setTimeout(() => {
          this.executeTaskWorkflow(supabase, taskId, workflowId, inputData, userId, agentId).catch(console.error);
        }, 5000);
        return;
      }

      // No retry -> finalize
      const finalStatus = success ? 'COMPLETED' : 'FAILED';
      
      await supabase.from('tasks').update({ 
        status: finalStatus, 
        output: finalState.output || {}, 
        error: finalState.error || null,
        completed_at: new Date().toISOString()
      }).eq('id', taskId);

      await supabase.from('task_events').insert({ 
        task_id: taskId, 
        workspace_id: workflow.workspace_id, 
        event_type: success ? 'TASK_COMPLETED' : 'TASK_FAILED',
        details: { output: finalState.output, error: finalState.error }
      });
      
      if (agentId) {
        await supabase.from('agents').update({ status: 'idle' }).eq('id', agentId);
      }
      
      // TRIGGER CEO FEEDBACK LOOP
      await CEOService.evaluateTaskResult(supabase, taskId, workflow.workspace_id, userId, agentId);

    } catch (e: any) {
      // Handle Retries on Catch
      const { data: taskInfo } = await supabase.from('tasks').select('retry_count, max_retries').eq('id', taskId).single();
      
      if (taskInfo && taskInfo.retry_count < taskInfo.max_retries) {
        console.log(`[CEOService] Catch block - Retrying task ${taskId} (${taskInfo.retry_count + 1}/${taskInfo.max_retries})`);
        
        await supabase.from('tasks').update({ 
          status: 'PENDING', 
          retry_count: taskInfo.retry_count + 1, 
          error: e.message 
        }).eq('id', taskId);

        await supabase.from('task_events').insert({ 
          task_id: taskId, 
          workspace_id: workflow.workspace_id, 
          event_type: 'RETRY', 
          details: { error: e.message, retry_count: taskInfo.retry_count + 1 } 
        });

        if (agentId) {
           await supabase.from('agents').update({ status: 'idle' }).eq('id', agentId);
        }
        
        setTimeout(() => {
          this.executeTaskWorkflow(supabase, taskId, workflowId, inputData, userId, agentId).catch(console.error);
        }, 5000);
        return;
      }

      await supabase.from('tasks').update({ 
        status: 'FAILED', 
        error: e.message,
        completed_at: new Date().toISOString()
      }).eq('id', taskId);

      await supabase.from('task_events').insert({ 
        task_id: taskId, 
        workspace_id: workflow.workspace_id, 
        event_type: 'TASK_FAILED',
        details: { error: e.message }
      });
      
      if (agentId) {
        await supabase.from('agents').update({ status: 'idle' }).eq('id', agentId);
      }
      
      // TRIGGER CEO FEEDBACK LOOP
      await CEOService.evaluateTaskResult(supabase, taskId, workflow.workspace_id, userId, agentId);
    }
  }

  static async evaluateTaskResult(supabase: any, taskId: string, workspaceId: string, userId: string, agentId?: string) {
    console.log('[CEOService] Evaluating result for task ' + taskId);
    
    // Get task with agent and workflow run details
    const { data: task } = await supabase.from('tasks').select('*, assigned_agent:agents(id, name, capabilities)').eq('id', taskId).single();
    if (!task) return;

    // --- PHASE 4: GET_CUSTOMERS VERIFICATION INTEGRATION ---
    if (task.status === 'COMPLETED' && task.mission_id) {
      try {
         const { MissionResultPipelineService } = await import('./MissionResultPipelineService');
         const { MissionPlanningService } = await import('./MissionPlanningService');
         const { data: mission } = await supabase.from('business_missions').select('*').eq('id', task.mission_id).single();
         
         if (mission) {
            const results = MissionResultPipelineService.extractResults(task, mission);
            if (results.length > 0) {
              await MissionResultPipelineService.persistResults(supabase, results);
              console.log('[CEOService] MissionResultPipeline extracted ' + results.length + ' results.');
            }
         }

         // Complete the running plan step for this mission
         const { data: runningSteps } = await supabase.from('mission_plan_steps')
            .select('id')
            .eq('mission_id', task.mission_id)
            .eq('status', 'RUNNING');
         
         if (runningSteps && runningSteps.length > 0) {
            for (const s of runningSteps) {
                await MissionPlanningService.completeStep(supabase, s.id);
            }
         }
      } catch (pipelineErr) {
         console.error('[CEOService] Mission Result Pipeline / Planning Error:', pipelineErr);
      }
    }
    if (task.status === 'FAILED' && task.mission_id) {
        try {
            const { data: runningSteps } = await supabase.from('mission_plan_steps')
                .select('id')
                .eq('mission_id', task.mission_id)
                .eq('status', 'RUNNING');
             if (runningSteps && runningSteps.length > 0) {
                for (const s of runningSteps) {
                    await supabase.from('mission_plan_steps').update({ status: 'FAILED', updated_at: new Date().toISOString() }).eq('id', s.id);
                }
             }
        } catch (err) {}
    }
    // --- END PHASE 4 ---

    let agentName = task.assigned_agent?.name || 'Unknown Worker';
    const isCompetitive = task.input?.task_type === 'COMPETITIVE_ANALYSIS';

    const prompt = `You are the AI CEO evaluating a completed task.
Task: ${task.title}
Worker: ${agentName}
Status: ${task.status}
Error (if any): ${task.error || 'None'}
Worker Output: ${JSON.stringify(task.output, null, 2)}

Evaluate the worker's execution result.
Did the worker successfully complete the objective? 
If this is a competitive analysis, the AI CMO has provided findings. Distinguish between FACT (verified data), RECOMMENDATION (what to do), OWNER_APPROVAL_REQUIRED (major changes), and INSUFFICIENT_DATA.
Do not present recommendations as facts.

Output strictly valid JSON exactly matching this schema:
{
  "evaluation": "String describing your evaluation of the worker's result.",
  "conclusion": "HEALTHY" | "PROBLEM" | "FAILURE" | "CRITICAL" | "RECOMMENDATION_MADE" | "INSUFFICIENT_DATA",
  "follow_up_tasks": [
    {
      "title": "String",
      "description": "String",
      "priority": "low" | "medium" | "high" | "critical",
      "delegate_to_role": "CTO" | "Application Monitor" | "None"
    }
  ],
  "owner_update": "String concisely summarizing the outcome and any next steps for the owner.",
  "facts": ["String (Verified fact only)"],
  "recommendation_requires_approval": boolean
}`;

    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || 'mock',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'ItWield CEO' }
    });

    let ceoEvaluation;
    try {
      if (process.env.OPENROUTER_API_KEY && process.env.NODE_ENV !== 'test') {
        const response = await openai.chat.completions.create({
          model: 'openrouter/free',
          messages: [{ role: 'system', content: prompt }],
          response_format: { type: 'json_object' }
        });
        ceoEvaluation = JSON.parse(response.choices[0].message.content || '{}');
      } else {
        if (isCompetitive) {
           const hasInsufficient = task.output?.findings?.includes('INSUFFICIENT_DATA');
           ceoEvaluation = {
             evaluation: hasInsufficient ? 'Not enough data to form a strategic recommendation.' : 'AI CMO reviewed the competitive data. I agree we should evaluate addressing these customer needs.',
             conclusion: hasInsufficient ? 'INSUFFICIENT_DATA' : 'RECOMMENDATION_MADE',
             follow_up_tasks: [],
             owner_update: hasInsufficient ? 'Competitor Analyst found insufficient data.' : 'AI CMO completed competitive analysis. I recommend we evaluate a product improvement.',
             facts: task.output?.findings || [],
             recommendation_requires_approval: !hasInsufficient
           };
        } else {
          ceoEvaluation = {
            evaluation: 'Mock evaluation. Assuming healthy for test.',
            conclusion: 'HEALTHY',
            follow_up_tasks: [{ title: 'Follow up', description: 'desc', priority: 'medium', delegate_to_role: 'CTO' }],
            owner_update: 'Task evaluated. Result looks fine.',
            facts: [],
            recommendation_requires_approval: false
          };
        }
      }
    } catch (e: any) {
      console.error('[CEOService] Feedback loop failed:', e);
      return;
    }

    // Save evaluation to task events
    await supabase.from('task_events').insert({
      task_id: taskId,
      workspace_id: workspaceId,
      event_type: 'CEO_EVALUATION',
      details: ceoEvaluation
    });

    // Handle Competitive Analysis specific workflow
    if (isCompetitive) {
      // 1. Record Facts to Company Memory
      if (ceoEvaluation.facts && ceoEvaluation.facts.length > 0) {
        for (const fact of ceoEvaluation.facts) {
          if (fact.includes('INSUFFICIENT_DATA')) continue;
          await CompanyMemoryService.createMemory({
            workspaceId,
            memoryType: 'FACT',
            title: 'Competitive Observation',
            content: fact,
            sourceType: 'TASK',
            sourceId: taskId,
            importance: 'medium',
            createdBy: 'SYSTEM'
          });
        }
      }

      // 2. Continuous Improvement Proposal if recommendation made
      if (ceoEvaluation.conclusion === 'RECOMMENDATION_MADE' && !ceoEvaluation.facts?.includes('INSUFFICIENT_DATA')) {
        const proposalId = await ContinuousImprovementService.createProposal(supabase, {
          workspaceId,
          title: 'Proposed Product Improvement from Competitive Analysis',
          category: 'COMPETITIVE',
          pattern: 'Competitor feature gap detected',
          problem: 'Competitors have detailed strengths/weaknesses that we may need to address.',
          proposedSolution: ceoEvaluation.evaluation || 'Evaluate strategic response to competitor features.',
          evidence: { 
            facts: ceoEvaluation.facts,
            interpretation: 'Competitor data analyzed by AI CMO',
            recommendation: ceoEvaluation.evaluation,
            sourceIds: [taskId],
            windowDays: 30,
            counts: { observationCount: ceoEvaluation.facts.length }
          },
          confidence: 'medium',
          sourceType: 'COMPETITOR_PATTERN',
          sourceIds: [taskId],
          riskLevel: ceoEvaluation.recommendation_requires_approval ? 'HIGH' : 'LOW',
          routedToExecutive: 'AI CEO',
          fingerprint: `comp_analysis_${taskId}`
        });

        if (proposalId && ceoEvaluation.recommendation_requires_approval) {
           await supabase.from('task_events').insert({
             task_id: taskId,
             workspace_id: workspaceId,
             event_type: 'OWNER_APPROVAL_REQUIRED',
             details: { reason: 'Major product change suggested based on verified competitive evidence.', proposalId }
           });
        }
      }
    }

    if (ceoEvaluation.conclusion === 'HEALTHY' || ceoEvaluation.conclusion === 'SUCCESS') {
      await CompanyMemoryService.recordOutcome(workspaceId, `Successful outcome: ${task.title}`, ceoEvaluation.owner_update || ceoEvaluation.evaluation, taskId, 'SYSTEM', supabase);
    }

    // Phase 6 - Create Incident for PROBLEM/FAILURE/CRITICAL
    if (ceoEvaluation.conclusion === 'PROBLEM' || ceoEvaluation.conclusion === 'FAILURE' || ceoEvaluation.conclusion === 'CRITICAL') {
      const severity = ceoEvaluation.conclusion === 'CRITICAL' ? 'critical' : 'high';
      await supabase.from('incidents').insert({
        workspace_id: workspaceId,
        type: 'application_health',
        severity: severity,
        status: 'DETECTED',
        title: `Operational Issue Detected: ${task.title}`,
        description: ceoEvaluation.evaluation,
        source: 'CEO_EVALUATION'
      });
      
      await supabase.from('task_events').insert({
        task_id: taskId,
        workspace_id: workspaceId,
        event_type: 'INCIDENT_CREATED',
        details: { title: `Operational Issue Detected: ${task.title}`, severity }
      });

      await CompanyMemoryService.recordLesson(workspaceId, `Incident Detected: ${task.title}`, ceoEvaluation.owner_update || ceoEvaluation.evaluation, taskId, 'SYSTEM', supabase);
    }

    const currentDepth = task.input?.chain_depth || 0;
    if (currentDepth >= 3) {
      console.log('[CEOService] Autonomous chain limit reached for task', taskId);
      await supabase.from('task_events').insert({
        task_id: taskId,
        workspace_id: workspaceId,
        event_type: 'ESCALATED',
        details: { reason: 'Autonomous chain limit reached.' }
      });
      await supabase.from('tasks').update({ status: 'ESCALATED' }).eq('id', taskId);
      
      // Notify owner approval required
      await supabase.from('task_events').insert({
        task_id: taskId,
        workspace_id: workspaceId,
        event_type: 'OWNER_APPROVAL_REQUIRED',
        details: { reason: 'Autonomous chain limit reached. Human review required for further execution.' }
      });
      return;
    }

    // Create follow up tasks if the CEO requested them
    if (ceoEvaluation.follow_up_tasks && ceoEvaluation.follow_up_tasks.length > 0) {
      // Find CTO for technical investigations
      const { data: agents } = await supabase.from('agents').select('id, name').eq('workspace_id', workspaceId);
      const cto = agents?.find((a: any) => a.name === 'AI CTO');
      const fallbackAssignee = cto || agents?.[0];

      for (const ft of ceoEvaluation.follow_up_tasks) {
        const { data: newT } = await supabase.from('tasks').insert({
          workspace_id: workspaceId,
          parent_task_id: taskId,
          assigned_agent_id: ft.delegate_to_role === 'CTO' ? cto?.id : fallbackAssignee?.id,
          title: ft.title,
          description: ft.description,
          priority: ft.priority,
          status: 'PENDING',
          input: { chain_depth: currentDepth + 1 }
        }).select().single();
        if (newT) {
           await supabase.from('task_events').insert({
             task_id: newT.id, workspace_id: workspaceId, event_type: 'TASK_CREATED', details: { source: 'CEO_FEEDBACK', title: ft.title }
           });
        }
      }
    }
  }

}






