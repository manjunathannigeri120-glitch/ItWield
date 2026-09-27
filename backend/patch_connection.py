import re

with open('backend/src/services/CEOService.ts', 'r') as f:
    c = f.read()

# 1. Update executeInlineTask to set BLOCKED for CONNECTION_REQUIRED
pattern1 = r"(} catch \(e: any\) {\s*)(await supabase\.from\('tasks'\)\.update\(\{ status: 'FAILED', error: e\.message, completed_at: new Date\(\)\.toISOString\(\) \}\)\.eq\('id', taskId\);\s*await supabase\.from\('task_events'\)\.insert\(\{ task_id: taskId, workspace_id: workspaceId, event_type: 'TASK_FAILED', details: \{ error: e\.message \} \}\);)"
replacement1 = r"""\1let finalStatus = 'FAILED';
      if (e.message && e.message.startsWith('CONNECTION_REQUIRED')) {
          finalStatus = 'BLOCKED';
      }
      await supabase.from('tasks').update({ status: finalStatus, error: e.message, completed_at: new Date().toISOString() }).eq('id', taskId);
      await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workspaceId, event_type: finalStatus === 'BLOCKED' ? 'TASK_BLOCKED' : 'TASK_FAILED', details: { error: e.message } });"""
c = re.sub(pattern1, replacement1, c)

# 2. Update evaluateTaskResult to mark step as BLOCKED if task is BLOCKED or FAILED due to CONNECTION_REQUIRED
pattern2 = r"if \(task\.status === 'FAILED' && task\.mission_id\) \{"
replacement2 = r"""if ((task.status === 'FAILED' || task.status === 'BLOCKED') && task.mission_id) {"""
c = re.sub(pattern2, replacement2, c)

pattern3 = r"(if \(runningSteps && runningSteps\.length > 0\) \{\s*for \(const s of runningSteps\) \{\s*)(await supabase\.from\('mission_plan_steps'\)\.update\(\{ status: 'FAILED', updated_at: new Date\(\)\.toISOString\(\) \}\)\.eq\('id', s\.id\);)"
replacement3 = r"""\1let stepStatus = task.status;
                        if (task.status === 'FAILED' && task.error && String(task.error).includes('CONNECTION_REQUIRED')) {
                            stepStatus = 'BLOCKED';
                        }
                        await supabase.from('mission_plan_steps').update({ status: stepStatus, updated_at: new Date().toISOString() }).eq('id', s.id);"""
c = re.sub(pattern3, replacement3, c)

# 3. Add Connection Recovery logic in observeWorkspace
pattern4 = r"(if \(!readyStep\) \{\s*if \(progress\.blocker\) \{)(\s*// E\.g\., CONNECTION_REQUIRED)"
replacement4 = r"""\1
               // === CONNECTION RECOVERY LOGIC ===
               if (progress.blocker.type === 'CONNECTION_REQUIRED') {
                   const { data: stalledSteps } = await supabase.from('mission_plan_steps')
                      .select('*')
                      .eq('plan_id', planData.plan.id)
                      .in('status', ['BLOCKED', 'FAILED']);
                      
                   if (stalledSteps && stalledSteps.length > 0) {
                      const { AuthorizationRegistry } = await import('./AuthorizationRegistry');
                      for (const s of stalledSteps) {
                         const authResult = AuthorizationRegistry.authorize(s.authorization_class, {});
                         const reqConn = authResult.definition?.requiredConnection;
                         if (reqConn) {
                             let connValid = false;
                             if (reqConn === 'web_search') {
                                 connValid = !!process.env.TAVILY_API_KEY || process.env.NODE_ENV === 'test';
                             } else {
                                 const { data: conn } = await supabase.from('connections')
                                    .select('status')
                                    .eq('workspace_id', workspaceId)
                                    .eq('provider', reqConn).single();
                                 connValid = !!(conn && conn.status === 'connected');
                             }
                             if (connValid) {
                                 console.log(`[CEOService] Connection ${reqConn} recovered. Unblocking step ${s.id}.`);
                                 
                                 // To prevent MissionProgressService from instantly re-blocking due to the old task,
                                 // we mark the old CONNECTION_REQUIRED tasks for this mission as RETRIED (a safe ignored status).
                                 await supabase.from('tasks')
                                    .update({ status: 'CANCELLED', error: 'Recovered via connection readiness.' })
                                    .eq('mission_id', mission.id)
                                    .in('status', ['BLOCKED', 'FAILED']);
                                    
                                 await supabase.from('mission_plan_steps').update({ status: 'READY', updated_at: new Date().toISOString() }).eq('id', s.id);
                                 s.status = 'READY';
                             }
                         }
                      }
                   }
               }\2"""
c = re.sub(pattern4, replacement4, c)

with open('backend/src/services/CEOService.ts', 'w') as f:
    f.write(c)
print("Patched CEOService.ts")
