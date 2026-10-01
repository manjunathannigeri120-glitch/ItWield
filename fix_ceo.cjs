const fs = require('fs');
let file = 'backend/src/services/CEOService.ts';
let content = fs.readFileSync(file, 'utf8');

// The block starts with "if (validation.status === 'AUTHORIZATION_REQUIRED' || validation.status === 'PROHIBITED') {"
// And we need to fix BOTH occurrences (there are two in CEOService.ts usually, one for generated tasks, one for follow-ups... actually maybe just one in the main execute logic).

let fixCEOService = `                if (validation.status === 'AUTHORIZATION_REQUIRED' || validation.status === 'PROHIBITED') {
                     const requiresApproval = validation.status === 'AUTHORIZATION_REQUIRED';
                     const reason = validation.reason || 'Action requires Founder authorization.';
                     console.warn(\`[CEOService] Action BLOCKED by registry: \${actionId}. Reason: \${reason}\`);
                     if (requiresApproval) {
                       const authDef = AuthorizationRegistry.authorize(actionId, aiPermissions).definition;
                       await supabase.from('approvals').insert({
                         workspace_id: workspaceId,
                         action: actionId,
                         title: t.title || actionId,
                         reason: reason,
                         requested_by_executive: t.agent_id,
                         risk_level: authDef?.riskLevel || 'high',
                         status: 'PENDING_APPROVAL',
                         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                         task_id: bTaskId
                       });
                       await supabase.from('task_events').insert({
                         task_id: bTaskId,
                         workspace_id: workspaceId,
                         event_type: 'OWNER_APPROVAL_REQUIRED',
                         details: { action: actionId, reason: reason, executive: t.agent_id, objective: t.title }
                       });
                     } else {
                       await supabase.from('task_events').insert({
                         task_id: bTaskId,
                         workspace_id: workspaceId,
                         event_type: 'ACTION_BLOCKED',
                         details: { action: actionId, reason: reason, executive: t.agent_id, objective: t.title }
                       });
                     }`;

content = content.replace(/if \(validation\.status === 'AUTHORIZATION_REQUIRED' \|\| validation\.status === 'PROHIBITED'\) \{[\s\S]*?event_type: 'ACTION_BLOCKED',[\s\S]*?\}\s*\}/g, fixCEOService);

fs.writeFileSync(file, content);
