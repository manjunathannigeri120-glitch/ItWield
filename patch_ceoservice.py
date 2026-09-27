import re

with open('backend/src/services/CEOService.ts', 'r') as f:
    c = f.read()

# Fix 1: Better deterministic worker assignment
c = c.replace(
"""            } else {
              const assignee = agents && agents.length > 0 ? agents[0] : null;""",
"""            } else {
              const { WorkforceIntegrityService } = await import('./WorkforceIntegrityService');
              const capableWorker = await WorkforceIntegrityService.findCapableWorker(supabase, workspaceId, taskType);
              const assignee = capableWorker || (agents && agents.length > 0 ? agents[0] : null);"""
)

# Fix 2: Insert BLOCKED task if authorization or delegation is blocked
# Look for the PROHIBITED branch
prohibited_branch = """                if (validation.status === 'AUTHORIZATION_REQUIRED' || validation.status === 'PROHIBITED') {
                   // Use authResult to trigger the same block logic
                   const authResult = AuthorizationRegistry.authorize(actionId, aiPermissions);
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
                       details: { action: actionId, reason: authResult.reason, executive: t.agent_id, objective: t.title }
                     });
                   } else {
                     await supabase.from('task_events').insert({
                       task_id: null,
                       workspace_id: workspaceId,
                       event_type: 'ACTION_BLOCKED',
                       details: { action: actionId, decision: 'BLOCKED', reason: authResult.reason, executive: t.agent_id, objective: t.title, authorization_source: 'AuthorizationRegistry' }
                     });
                   }
                   continue;
                } else {
                   // Missing Capability or missing connection
                   console.warn(`[CEOService] Delegation BLOCKED: ${validation.reason}`);
                   await supabase.from('task_events').insert({
                       task_id: null,
                       workspace_id: workspaceId,
                       event_type: 'DELEGATION_BLOCKED',
                       details: { action: actionId, reason: validation.reason, executive: t.agent_id, status: validation.status }
                   });
                   continue;
                }"""

new_prohibited_branch = """                // Create a BLOCKED task so the mission progress does not stall infinitely
                const { data: bTask } = await supabase.from('tasks').insert({
                  workspace_id: workspaceId,
                  mission_id: missionId || null,
                  title: t.title,
                  description: t.description,
                  assigned_agent_id: t.agent_id,
                  status: 'BLOCKED',
                  error: validation.reason || 'Delegation blocked',
                  input: t.input || {}
                }).select().single();
                const bTaskId = bTask ? bTask.id : null;

                if (validation.status === 'AUTHORIZATION_REQUIRED' || validation.status === 'PROHIBITED') {
                   // Use authResult to trigger the same block logic
                   const authResult = AuthorizationRegistry.authorize(actionId, aiPermissions);
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
                       expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                       task_id: bTaskId
                     });
                     await supabase.from('task_events').insert({
                       task_id: bTaskId,
                       workspace_id: workspaceId,
                       event_type: 'OWNER_APPROVAL_REQUIRED',
                       details: { action: actionId, reason: authResult.reason, executive: t.agent_id, objective: t.title }
                     });
                   } else {
                     await supabase.from('task_events').insert({
                       task_id: bTaskId,
                       workspace_id: workspaceId,
                       event_type: 'ACTION_BLOCKED',
                       details: { action: actionId, decision: 'BLOCKED', reason: authResult.reason, executive: t.agent_id, objective: t.title, authorization_source: 'AuthorizationRegistry' }
                     });
                   }
                   continue;
                } else {
                   // Missing Capability or missing connection
                   console.warn(`[CEOService] Delegation BLOCKED: ${validation.reason}`);
                   await supabase.from('task_events').insert({
                       task_id: bTaskId,
                       workspace_id: workspaceId,
                       event_type: 'DELEGATION_BLOCKED',
                       details: { action: actionId, reason: validation.reason, executive: t.agent_id, status: validation.status }
                   });
                   continue;
                }"""

c = c.replace(prohibited_branch, new_prohibited_branch)

# Also fix the duplicate auth check block below that does the exact same thing
duplicate_auth_branch = """            if (!authResult.authorized) {
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
            }"""

new_duplicate_auth_branch = """            if (!authResult.authorized) {
              console.warn(`[CEOService] Action BLOCKED by registry: ${actionId}. Reason: ${authResult.reason}`);
              
              const { data: bTask2 } = await supabase.from('tasks').insert({
                workspace_id: workspaceId,
                mission_id: missionId || null,
                title: t.title,
                description: t.description,
                assigned_agent_id: t.agent_id,
                status: 'BLOCKED',
                error: authResult.reason,
                input: t.input || {}
              }).select().single();
              const bTask2Id = bTask2 ? bTask2.id : null;

              if (authResult.requiresApproval) {
                await supabase.from('approvals').insert({
                  workspace_id: workspaceId,
                  action: actionId,
                  title: t.title || actionId,
                  reason: authResult.reason,
                  requested_by_executive: t.agent_id,
                  risk_level: authResult.definition?.riskLevel || 'high',
                  status: 'PENDING_APPROVAL',
                  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  task_id: bTask2Id
                });
  
                await supabase.from('task_events').insert({
                  task_id: bTask2Id,
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
                  task_id: bTask2Id,
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
            }"""

c = c.replace(duplicate_auth_branch, new_duplicate_auth_branch)

with open('backend/src/services/CEOService.ts', 'w') as f:
    f.write(c)
