const fs = require('fs');
const file = 'backend/src/services/CEOService.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  /\/\/ 1\. Worker Capability Validation[\s\S]*?\/\/ 2\. Connection Validation[\s\S]*?decryptedConnection = decryptObject\(conn\.credentials\);\n          }\n        }/,
  `        if (executorId) {
          const validation = await WorkforceIntegrityService.validateAssignment(supabase, workspaceId, executorId, actionType);
          if (!validation.valid) {
            if (validation.status === 'MISSING_CAPABILITY' || validation.status === 'UNKNOWN_CAPABILITY' || validation.status === 'MISCONFIGURED_WORKER') {
              await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workspaceId, event_type: 'TASK_BLOCKED', details: { error: validation.reason } });
              throw new Error(\`Worker missing required capability: \${actionType}\`);
            } else if (validation.status === 'CONNECTION_REQUIRED') {
              await supabase.from('task_events').insert({ task_id: taskId, workspace_id: workspaceId, event_type: 'CONNECTION_REQUIRED', details: { provider: validation.capability?.requiredConnection, note: validation.reason } });
              throw new Error(\`CONNECTION_REQUIRED: \${validation.capability?.requiredConnection}\`);
            } else {
              throw new Error(\`Task blocked: \${validation.reason}\`);
            }
          }
        }
        
        // Setup decrypted connection if required
        const reqConn = AuthorizationRegistry.authorize(actionType).definition?.requiredConnection;
        let decryptedConnection = null;
        if (reqConn && reqConn !== 'web_search') {
             const { data: conn } = await supabase.from('connections').select('*').eq('workspace_id', workspaceId).eq('provider', reqConn).single();
             if (conn && conn.status === 'connected') {
                const { decryptObject } = await import('../utils/encryption');
                decryptedConnection = decryptObject(conn.credentials);
             }
        }`
);

// Second replacement: inside `run()` where CEO delegates task to worker:
// `const authResult = AuthorizationRegistry.authorize(actionId, aiPermissions);`
c = c.replace(
  /const authResult = AuthorizationRegistry\.authorize\(actionId, aiPermissions\);[\s\S]*?if \(!authResult\.authorized\) \{/,
  `const validation = await WorkforceIntegrityService.validateAssignment(supabase, workspaceId, t.agent_id, actionId, aiPermissions);
            
            if (!validation.valid) {
              if (validation.status === 'AUTHORIZATION_REQUIRED' || validation.status === 'PROHIBITED') {
                 // Use authResult to trigger the same block logic
                 const authResult = AuthorizationRegistry.authorize(actionId, aiPermissions);
                 console.warn(\`[CEOService] Action BLOCKED by registry: \${actionId}. Reason: \${authResult.reason}\`);
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
                 console.warn(\`[CEOService] Delegation BLOCKED: \${validation.reason}\`);
                 await supabase.from('task_events').insert({
                     task_id: null,
                     workspace_id: workspaceId,
                     event_type: 'DELEGATION_BLOCKED',
                     details: { action: actionId, reason: validation.reason, executive: t.agent_id, status: validation.status }
                 });
                 continue;
              }
            }
            // If valid, just construct a fake authorized authResult to pass the existing below check
            const authResult = { authorized: true, reason: 'Authorized' };
            if (!authResult.authorized) {`
);

fs.writeFileSync(file, c);
console.log('patched CEOService');
