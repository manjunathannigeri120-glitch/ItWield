const fs = require('fs');

let content = fs.readFileSync('src/services/CEOService.ts', 'utf8');

// 1. Where executeTaskWorkflow is called
content = content.replace(
  /if \(t\.workflow_id\) \{\s*\/\/ Fire and forget execution\s*this\.executeTaskWorkflow\(supabase, createdTask\.id, t\.workflow_id, t\.input, userId\)\.catch\(err => \{\s*console\.error\(\\[CEOService\] Workflow execution failed for task \$\{createdTask\.id\}:\, err\);\s*\}\);\s*\}/,
  \if (t.workflow_id) {
          // Fire and forget execution
          this.executeTaskWorkflow(supabase, createdTask.id, t.workflow_id, t.input, userId, t.agent_id).catch(err => {
            console.error(\\\[CEOService] Workflow execution failed for task \\\:\\\, err);
          });
        } else {
          // Block task and agent if no executable capability
          await supabase.from('tasks').update({ status: 'BLOCKED', error: 'No executable capability configured.' }).eq('id', createdTask.id);
          await supabase.from('task_events').insert({ task_id: createdTask.id, workspace_id: workspaceId, event_type: 'TASK_BLOCKED', details: { error: 'No executable capability configured.' } });
          if (t.agent_id) {
            await supabase.from('agents').update({ status: 'blocked' }).eq('id', t.agent_id);
          }
        }\
);

// 2. executeTaskWorkflow signature and agent status
content = content.replace(
  /static async executeTaskWorkflow\(supabase: SupabaseClient, taskId: string, workflowId: string, inputData: any, userId: string\) \{/,
  \static async executeTaskWorkflow(supabase: SupabaseClient, taskId: string, workflowId: string, inputData: any, userId: string, agentId?: string) {\
);

// 3. Mark task running AND agent working
content = content.replace(
  /\/\/ Mark task running\s*await supabase\.from\('tasks'\)\.update\(\{ status: 'RUNNING', started_at: new Date\(\)\.toISOString\(\) \}\)\.eq\('id', taskId\);/,
  \// Mark task running and agent working
    await supabase.from('tasks').update({ status: 'RUNNING', started_at: new Date().toISOString() }).eq('id', taskId);
    if (agentId) {
      await supabase.from('agents').update({ status: 'working' }).eq('id', agentId);
    }\
);

// 4. On task completion/failure (end of executeTaskWorkflow)
content = content.replace(
  /await supabase\.from\('task_events'\)\.insert\(\{ \s*task_id: taskId, \s*workspace_id: workflow\.workspace_id, \s*event_type: success \? 'TASK_COMPLETED' : 'TASK_FAILED',\s*details: \{ output: finalState\.output \}\s*\}\);\s*\} catch \(e: any\) \{/,
  \wait supabase.from('task_events').insert({ 
        task_id: taskId, 
        workspace_id: workflow.workspace_id, 
        event_type: success ? 'TASK_COMPLETED' : 'TASK_FAILED',
        details: { output: finalState.output }
      });
      if (agentId) {
        await supabase.from('agents').update({ status: 'idle' }).eq('id', agentId);
      }
    } catch (e: any) {\
);

content = content.replace(
  /await supabase\.from\('task_events'\)\.insert\(\{ \s*task_id: taskId, \s*workspace_id: workflow\.workspace_id, \s*event_type: 'TASK_FAILED',\s*details: \{ error: e\.message \}\s*\}\);\s*\}/,
  \wait supabase.from('task_events').insert({ 
        task_id: taskId, 
        workspace_id: workflow.workspace_id, 
        event_type: 'TASK_FAILED',
        details: { error: e.message }
      });
      if (agentId) {
        await supabase.from('agents').update({ status: 'idle' }).eq('id', agentId);
      }
    }\
);

// 5. Update prompt to use capabilities
content = content.replace(
  /const agentsContext = agents\s*\.map\(a => \ID: \$\{a\.id\}\\nName: \$\{a\.name\}\\nCapabilities: \$\{JSON\.stringify\(a\.capabilities\)\}\\nStatus: \$\{a\.status\}\\)\s*\.join\('\\n---\\n'\);/,
  \const agentsContext = agents
      .map(a => {
        let caps = { role: 'Unassigned', features: [], permissions: [], tools: [] };
        if (a.capabilities && typeof a.capabilities === 'object' && !Array.isArray(a.capabilities)) {
          caps = { ...caps, ...a.capabilities };
        } else if (Array.isArray(a.capabilities)) {
          caps.features = a.capabilities;
        }
        return \\\ID: \\\\\nName: \\\\\nRole: \\\\\nObjective: \\\\\nCapabilities: \\\\\nPermissions: \\\\\nTools: \\\\\nStatus: \\\\\\;
      })
      .join('\\n---\\n');\
);


fs.writeFileSync('src/services/CEOService.ts', content);
console.log('CEOService Patched');
