import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { WorkflowEngine } from '../workflows/engine';

export class CEOService {
  static async run(supabase: any, workspaceId: string, objective: string, userId: string = 'service_role', sourceWorkflowId?: string, actualNextRunAt?: string) {
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
    const systemPrompt = `You are the AI CEO of a company. Your job is to orchestrate the workforce to accomplish the owner's objective.
    
Company Context:	
,Name: ${company.name}
Industry: ${company.industry || 'Unknown'}
Goals: ${company.company_goals || 'Unknown'}
Policies: ${company.policies || 'None'}

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
      if (objective === 'SCHEDULED_OBSERVATION' || !process.env.OPENROUTER_API_KEY) {
        // Deterministic MVP fallback — no OpenRouter key OR explicit scheduled observation
        decisionSource = 'DETERMINISTIC_FALLBACK';

        // Find Application Monitor agent for monitoring tasks
        const appMonitor = agents?.find((a: any) => a.name === 'Application Monitor');
        const cto = agents?.find((a: any) => a.name === 'AI CTO');
        // Prefer CTO as initial assignee (mirrors real hierarchy), fallback to Application Monitor directly
        const assignee = cto || appMonitor || (agents && agents.length > 0 ? agents[0] : null);

        // Extract website from operational_context if available
        let website = 'https://example.com';
        try {
          const ctx = JSON.parse(company.operational_context || '{}');
          if (ctx.website) website = ctx.website;
        } catch (_) { /* ignore parse errors */ }

        ceoDecision = {
          assessment: `Initiating standard operational health check for ${company.name}. Delegating application monitoring task to the technical team.`,
          priority: 'high',
          decision: 'delegate',
          tasks: assignee ? [
            {
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
            }
          ] : [],
          owner_update: `CEO initiated application health check for ${company.name}. Monitoring team has been alerted.`
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

        const taskInsert = {
          workspace_id: workspaceId,
          title: t.title,
          description: t.description,
          workflow_id: t.workflow_id,
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
            console.log(`[CEOService] Idempotency catch: Task for observation workflow ${sourceWorkflowId} is already active. Skipping.`);
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

        // 4. Trigger Workflow or Inline Task if specified
        if (t.workflow_id) {
          // Fire and forget execution
          this.executeTaskWorkflow(supabase, createdTask.id, t.workflow_id, t.input, userId, t.agent_id).catch(err => {
            console.error(`[CEOService] Workflow execution failed for task ${createdTask.id}:`, err);
          });
        } else if (t.input && t.input.task_type === 'APPLICATION_MONITORING') {
          this.executeInlineHealthCheck(supabase, createdTask.id, t.input, userId, t.agent_id).catch(err => {
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
    const { data: company } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();
    if (!company) return;

    let website = null;
    try {
      const ctx = JSON.parse(company.operational_context || '{}');
      website = ctx.website;
    } catch (e) {}

    // Phase 8 - Duplicate Prevention
    const { data: activeTasks } = await supabase.from('tasks')
      .select('id, input')
      .eq('workspace_id', workspaceId)
      .in('status', ['PENDING', 'ASSIGNED', 'RUNNING']);

    const hasMonitoring = activeTasks?.some(t => t.input && t.input.task_type === 'APPLICATION_MONITORING');
    if (hasMonitoring) return;

    if (!website) {
      // Phase 1 - No website configured, do not invent. Prevent duplicate blocks (once per day).
      const { data: recentBlocked } = await supabase.from('task_events')
        .select('id, created_at')
        .eq('workspace_id', workspaceId)
        .eq('event_type', 'OBSERVATION_BLOCKED')
        .order('created_at', { ascending: false })
        .limit(1);
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (recentBlocked && recentBlocked.length > 0 && new Date(recentBlocked[0].created_at) > oneDayAgo) {
        return; // Checked recently
      }

      await supabase.from('task_events').insert({
        workspace_id: workspaceId,
        event_type: 'OBSERVATION_BLOCKED',
        details: { reason: "Application monitoring cannot run because this company has no website/application connection configured." }
      });
      return;
    }

    // Phase 2 - Website exists and has not been checked recently (e.g. 15 mins)
    const { data: recentSuccess } = await supabase.from('tasks')
      .select('id, completed_at, input')
      .eq('workspace_id', workspaceId)
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(20);

    const latestMonitoring = recentSuccess?.find(t => t.input && t.input.task_type === 'APPLICATION_MONITORING');
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    if (latestMonitoring && latestMonitoring.completed_at) {
      if (new Date(latestMonitoring.completed_at) > fifteenMinsAgo) return;
    }

    // Trigger CEO orchestration for monitoring
    await CEOService.run(supabase, workspaceId, "SCHEDULED_OBSERVATION", 'service_role');
  }

  static async executeInlineHealthCheck(supabase: SupabaseClient, taskId: string, inputData: any, userId: string, agentId?: string) {
    const { data: taskData } = await supabase.from('tasks').update({ status: 'RUNNING', started_at: new Date().toISOString() }).eq('id', taskId).select('workspace_id').single();
    const workspaceId = taskData?.workspace_id;

    if (agentId) {
      await supabase.from('agents').update({ status: 'working' }).eq('id', agentId);
    }
    
    await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workspaceId, event_type: 'TASK_STARTED', details: { type: 'inline_health_check' } });

    let executorId = agentId;
    if (inputData.delegate_to && inputData.delegate_to !== agentId) {
      executorId = inputData.delegate_to;
      await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workspaceId, event_type: 'TASK_ASSIGNED', details: { assigned_to: executorId, note: 'Delegated by manager' } });
      await supabase.from('tasks').update({ assigned_agent_id: executorId }).eq('id', taskId);
      if (agentId) await supabase.from('agents').update({ status: 'idle' }).eq('id', agentId);
      if (executorId) await supabase.from('agents').update({ status: 'working' }).eq('id', executorId);
    }

    try {
      // Execute the deterministic HealthCheckAction
      const { HealthCheckAction } = await import('../workflows/actions/HealthCheckAction');
      const action = new HealthCheckAction();
      
      const result = await action.execute({ url: inputData.website || 'https://itwield.vercel.app' }, { supabase, runId: '', userId, workspaceId, attempt: 1 });
      
      const finalState = { error: result.success ? null : result.error || 'Health check failed', output: result };
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

    let agentName = task.assigned_agent?.name || 'Unknown Worker';

    const prompt = `You are the AI CEO evaluating a completed task.
Task: ${task.title}
Worker: ${agentName}
Status: ${task.status}
Error (if any): ${task.error || 'None'}
Worker Output: ${JSON.stringify(task.output, null, 2)}

Evaluate the worker's execution result.
Did the worker successfully complete the objective? Did the application health check pass or fail?
Is there a problem that needs a follow up task?

Output strictly valid JSON exactly matching this schema:
{
  "evaluation": "String describing your evaluation of the worker's result.",
  "conclusion": "HEALTHY" | "PROBLEM" | "FAILURE" | "CRITICAL",
  "follow_up_tasks": [
    {
      "title": "String",
      "description": "String",
      "priority": "low" | "medium" | "high" | "critical",
      "delegate_to_role": "CTO" | "Application Monitor" | "None"
    }
  ],
  "owner_update": "String concisely summarizing the outcome and any next steps for the owner."
}`;

    const openai = new (require('openai').OpenAI)({
      apiKey: process.env.OPENROUTER_API_KEY || 'mock',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'ItWield CEO' }
    });

    let ceoEvaluation;
    try {
      if (process.env.OPENROUTER_API_KEY) {
        const response = await openai.chat.completions.create({
          model: 'openrouter/free',
          messages: [{ role: 'system', content: prompt }],
          response_format: { type: 'json_object' }
        });
        ceoEvaluation = JSON.parse(response.choices[0].message.content || '{}');
      } else {
        ceoEvaluation = {
          evaluation: 'Mock evaluation. Assuming healthy for test.',
          conclusion: 'HEALTHY',
          follow_up_tasks: [],
          owner_update: 'Task evaluated. Result looks fine.'
        };
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