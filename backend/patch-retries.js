const fs = require('fs');

let content = fs.readFileSync('src/services/CEOService.ts', 'utf8');

// Fix duplicate evaluateTaskResult
content = content.replace(/\/\/ TRIGGER CEO FEEDBACK LOOP\\s+await CEOService\\.evaluateTaskResult\\(supabase, taskId, workflow\\.workspace_id, userId, agentId\\);\\s+\/\/ TRIGGER CEO FEEDBACK LOOP\\s+await CEOService\\.evaluateTaskResult\\(supabase, taskId, workflow\\.workspace_id, userId, agentId\\);/,
  \// TRIGGER CEO FEEDBACK LOOP\\n      await CEOService.evaluateTaskResult(supabase, taskId, workflow.workspace_id, userId, agentId);\);

// Implement Retry Logic
content = content.replace(
  /const success = !finalState\.error;\\s+const finalStatus = success \? 'COMPLETED' : "FAILED";[\\s\\S]*?await CEOService\.evaluateTaskResult\(supabase, taskId, workflow\.workspace_id, userId, agentId\);/,
  \const success = !finalState.error;
      const { data: taskInfo } = await supabase.from('tasks').select('retry_count, max_retries').eq('id', taskId).single();
      
      if (!success && taskInfo && taskInfo.retry_count < taskInfo.max_retries) {
        // Retry
        console.log(\\\[CEOService] Retrying task \\\ (\\\/\\\)\\\);
        await supabase.from('tasks').update({ 
          status: 'PENDING', 
          retry_count: taskInfo.retry_count + 1,
          error: finalState.error || 'Retry'
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
        
        // Schedule retry execution
        setTimeout(() => {
          this.executeTaskWorkflow(supabase, taskId, workflowId, inputData, userId, agentId).catch(console.error);
        }, 3000);
        return;
      }

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
      await CEOService.evaluateTaskResult(supabase, taskId, workflow.workspace_id, userId, agentId);\
);

// Fix the catch block retry
content = content.replace(
  /\} catch \(e: any\) \{[\\s\\S]*?event_type: 'TASK_FAILED',[\\s\\S]*?details: \{ error: e\.message \}[\\s\\S]*?\}\);[\\s\\S]*?if \(agentId\) \{[\\s\\S]*?await supabase\.from\('agents'\)\.update\(\{ status: 'idle' \}\)\.eq\('id', agentId\);[\\s\\S]*?\}[\\s\\S]*?\/\/ TRIGGER CEO FEEDBACK LOOP[\\s\\S]*?await CEOService\.evaluateTaskResult\(supabase, taskId, workflow\.workspace_id, userId, agentId\);[\\s\\S]*?\}/,
  \} catch (e: any) {
      const { data: taskInfo } = await supabase.from('tasks').select('retry_count, max_retries').eq('id', taskId).single();
      
      if (taskInfo && taskInfo.retry_count < taskInfo.max_retries) {
         console.log(\\\[CEOService] Retrying task after catch \\\ (\\\/\\\)\\\);
         await supabase.from('tasks').update({ status: 'PENDING', retry_count: taskInfo.retry_count + 1, error: e.message }).eq('id', taskId);
         await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workflow.workspace_id, event_type: 'RETRY', details: { error: e.message, retry_count: taskInfo.retry_count + 1 } });
         if (agentId) await supabase.from('agents').update({ status: 'idle' }).eq('id', agentId);
         setTimeout(() => { this.executeTaskWorkflow(supabase, taskId, workflowId, inputData, userId, agentId).catch(console.error); }, 3000);
         return;
      }

      await supabase.from('tasks').update({ status: 'FAILED', error: e.message, completed_at: new Date().toISOString() }).eq('id', taskId);
      await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workflow.workspace_id, event_type: 'TASK_FAILED', details: { error: e.message } });
      if (agentId) await supabase.from('agents').update({ status: 'idle' }).eq('id', agentId);
      
      await CEOService.evaluateTaskResult(supabase, taskId, workflow.workspace_id, userId, agentId);
    }\
);

fs.writeFileSync('src/services/CEOService.ts', content);
console.log('Retry patched');
