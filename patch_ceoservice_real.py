import re

with open('backend/src/services/CEOService.ts', 'r') as f:
    c = f.read()

# Fix 1: findCapableWorker
pattern = r"\} else \{\s*const assignee = agents && agents\.length > 0 \? agents\[0\] : null;"
replacement = """} else {
              const { WorkforceIntegrityService } = await import('./WorkforceIntegrityService');
              const capableWorker = await WorkforceIntegrityService.findCapableWorker(supabase, workspaceId, taskType);
              const assignee = capableWorker || (agents && agents.length > 0 ? agents[0] : null);"""

if re.search(pattern, c):
    c = re.sub(pattern, replacement, c)
    print("Fix 1 applied")
else:
    print("Fix 1 pattern not found")

# Fix 2: Blocked task insertion for DELEGATION_BLOCKED
pattern2 = r"if \(!validation\.valid\) \{\s*if \(validation\.status === 'AUTHORIZATION_REQUIRED' \|\| validation\.status === 'PROHIBITED'\) \{(.*?)\s*continue;\s*\} else \{\s*// Missing Capability or missing connection\s*console\.warn\(`\[CEOService\] Delegation BLOCKED: \$\{validation\.reason\}`\);\s*await supabase\.from\('task_events'\)\.insert\(\{\s*task_id: null,\s*workspace_id: workspaceId,\s*event_type: 'DELEGATION_BLOCKED',\s*details: \{ action: actionId, reason: validation\.reason, executive: t\.agent_id, status: validation\.status \}\s*\}\);\s*continue;\s*\}"

# It's easier to just do string matching for the whole delegation block.
block_start = "const validation = await WorkforceIntegrityService.validateAssignment(supabase, workspaceId, t.agent_id, actionId, aiPermissions);"
block_end = "// If valid, just construct a fake authorized authResult"

idx1 = c.find(block_start)
idx2 = c.find(block_end)

if idx1 != -1 and idx2 != -1:
    old_block = c[idx1:idx2]
    new_block = """const validation = await WorkforceIntegrityService.validateAssignment(supabase, workspaceId, t.agent_id, actionId, aiPermissions);
            
            if (!validation.valid) {
                // Create a BLOCKED task so the mission progress does not stall infinitely
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
                   console.warn(`[CEOService] Delegation BLOCKED: ${validation.reason}`);
                   await supabase.from('task_events').insert({
                       task_id: bTaskId,
                       workspace_id: workspaceId,
                       event_type: 'DELEGATION_BLOCKED',
                       details: { action: actionId, reason: validation.reason, executive: t.agent_id, status: validation.status }
                   });
                   continue;
                }
            }
            
            """
    c = c[:idx1] + new_block + c[idx2:]
    print("Fix 2 applied")
else:
    print("Fix 2 boundaries not found")

with open('backend/src/services/CEOService.ts', 'w') as f:
    f.write(c)
