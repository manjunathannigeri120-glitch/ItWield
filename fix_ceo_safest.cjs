const fs = require('fs');
let file = 'backend/src/services/CEOService.ts';
let content = fs.readFileSync(file, 'utf8');

// We will exactly match the block.
content = content.replace(
  /if \(validation\.status === 'AUTHORIZATION_REQUIRED' \|\| validation\.status === 'PROHIBITED'\) \{\s*const authResult = AuthorizationRegistry\.authorize\(actionId, aiPermissions\);\s*console\.warn\(\`\[CEOService\] Action BLOCKED by registry: \$\{actionId\}\. Reason: \$\{authResult\.reason\}\`\);\s*if \(authResult\.requiresApproval\) \{\s*await supabase\.from\('approvals'\)\.insert\(\{\s*workspace_id: workspaceId,\s*action: actionId,\s*title: t\.title \|\| actionId,\s*reason: authResult\.reason,\s*requested_by_executive: t\.agent_id,\s*risk_level: authResult\.definition\?\.riskLevel \|\| 'high',\s*status: 'PENDING_APPROVAL',\s*expires_at: new Date\(Date\.now\(\) \+ 24 \* 60 \* 60 \* 1000\)\.toISOString\(\),\s*task_id: bTaskId\s*\}\);\s*await supabase\.from\('task_events'\)\.insert\(\{\s*task_id: bTaskId,\s*workspace_id: workspaceId,\s*event_type: 'OWNER_APPROVAL_REQUIRED',\s*details: \{ action: actionId, reason: authResult\.reason, executive: t\.agent_id, objective: t\.title \}\s*\}\);\s*\} else \{\s*await supabase\.from\('task_events'\)\.insert\(\{\s*task_id: bTaskId,\s*workspace_id: workspaceId,\s*event_type: 'ACTION_BLOCKED',\s*details: \{ action: actionId, reason: authResult\.reason, executive: t\.agent_id, objective: t\.title \}\s*\}\);\s*\}/g,
  `if (validation.status === 'AUTHORIZATION_REQUIRED' || validation.status === 'PROHIBITED') {
                     const authResult = AuthorizationRegistry.authorize(actionId, aiPermissions);
                     const combinedReason = validation.reason || authResult.reason;
                     const requiresApp = validation.status === 'AUTHORIZATION_REQUIRED' || authResult.requiresApproval;
                     console.warn(\`[CEOService] Action BLOCKED by registry: \${actionId}. Reason: \${combinedReason}\`);
                     if (requiresApp) {
                       await supabase.from('approvals').insert({
                         workspace_id: workspaceId,
                         action: actionId,
                         title: t.title || actionId,
                         reason: combinedReason,
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
                         details: { action: actionId, reason: combinedReason, executive: t.agent_id, objective: t.title }
                       });
                     } else {
                       await supabase.from('task_events').insert({
                         task_id: bTaskId,
                         workspace_id: workspaceId,
                         event_type: 'ACTION_BLOCKED',
                         details: { action: actionId, reason: combinedReason, executive: t.agent_id, objective: t.title }
                       });
                     }`
);

fs.writeFileSync(file, content);
