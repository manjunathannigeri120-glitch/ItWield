const fs = require('fs');

let content = fs.readFileSync('src/services/CEOService.ts', 'utf8');

const evaluateMethod = `
  static async evaluateTaskResult(supabase: any, taskId: string, workspaceId: string, userId: string, agentId?: string) {
    console.log('[CEOService] Evaluating result for task ' + taskId);
    
    // Get task with agent and workflow run details
    const { data: task } = await supabase.from('tasks').select('*, assigned_agent:agents(id, name, capabilities)').eq('id', taskId).single();
    if (!task) return;

    let agentName = task.assigned_agent?.name || 'Unknown Worker';

    const prompt = \`You are the AI CEO evaluating a completed task.
Task: \${task.title}
Worker: \${agentName}
Status: \${task.status}
Error (if any): \${task.error || 'None'}
Worker Output: \${JSON.stringify(task.output, null, 2)}

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
      "priority": "low" | "medium" | "high" | "critical"
    }
  ],
  "owner_update": "String concisely summarizing the outcome and any next steps for the owner."
}\`;

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

    // Create follow up tasks if the CEO requested them
    if (ceoEvaluation.follow_up_tasks && ceoEvaluation.follow_up_tasks.length > 0) {
      for (const ft of ceoEvaluation.follow_up_tasks) {
        const { data: newT } = await supabase.from('tasks').insert({
          workspace_id: workspaceId,
          parent_task_id: taskId,
          title: ft.title,
          description: ft.description,
          priority: ft.priority,
          status: 'PENDING'
        }).select().single();
        if (newT) {
           await supabase.from('task_events').insert({
             task_id: newT.id, workspace_id: workspaceId, event_type: 'TASK_CREATED', details: { source: 'CEO_FEEDBACK', title: ft.title }
           });
        }
      }
    }
  }
`;

content = content.replace(/}\s*$/, evaluateMethod + '\n}');

// Insert after FIRST agent status update (Success)
content = content.replace(
  /if \(agentId\) \{\s*await supabase\.from\('agents'\)\.update\(\{ status: 'idle' \}\)\.eq\('id', agentId\);\s*\}/,
  `if (agentId) {
        await supabase.from('agents').update({ status: 'idle' }).eq('id', agentId);
      }
      
      // TRIGGER CEO FEEDBACK LOOP
      await CEOService.evaluateTaskResult(supabase, taskId, workflow.workspace_id, userId, agentId);`
);

// Insert after SECOND agent status update (Failure)
// Note: It will only replace the first occurrence each time we call replace if it's not global,
// so let's use a trick or just replace both.
content = content.replace(
  /if \(agentId\) \{\s*await supabase\.from\('agents'\)\.update\(\{ status: 'idle' \}\)\.eq\('id', agentId\);\s*\}/g,
  `if (agentId) {
        await supabase.from('agents').update({ status: 'idle' }).eq('id', agentId);
      }
      
      // TRIGGER CEO FEEDBACK LOOP
      await CEOService.evaluateTaskResult(supabase, taskId, workflow.workspace_id, userId, agentId);`
);


fs.writeFileSync('src/services/CEOService.ts', content);
console.log('CEO Feedback Loop added!');
