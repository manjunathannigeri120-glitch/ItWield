const fs = require('fs');
let file = 'backend/src/services/WorkforceIntegrityService.ts';
let content = fs.readFileSync(file, 'utf8');

// We need to inject the company_systems capability check in step 3.
let fix = `    // 3. Connection Validation
    const authResult = AuthorizationRegistry.authorize(actionId, permissions);
    const reqConn = authResult.definition?.requiredConnection || capability?.requiredConnection;
    
    let requiresApproval = authResult.requiresApproval || false;
    let authReason = authResult.reason;

    if (reqConn) {
      if (reqConn === 'web_search') {
        if (!process.env.TAVILY_API_KEY && process.env.NODE_ENV !== 'test') {
          return { valid: false, status: 'CONNECTION_REQUIRED', reason: \`Missing \${reqConn} API configuration.\`, capability };
        }
      } else {
        // Query the new company_systems table!
        const { data: conn } = await supabase.from('company_systems').select('status, capabilities').eq('workspace_id', workspaceId).eq('system_type', reqConn.toUpperCase()).single();
        if (!conn || conn.status !== 'CONNECTED') {
          return { valid: false, status: 'CONNECTION_REQUIRED', reason: \`Worker needs an active \${reqConn} connection to execute \${actionId}.\`, capability };
        }
        
        // Check if the specific capability is authorized
        const sysCaps = conn.capabilities || [];
        if (!sysCaps.includes(actionId)) {
          // If not directly authorized, it needs owner approval
          requiresApproval = true;
          authReason = \`The \${reqConn} connection does not have the '\${actionId}' capability enabled by the Founder. Approval required.\`;
        }
      }
    }

    // 4. Authorization Validation
    if (!authResult.authorized || requiresApproval) {
      if (requiresApproval) {
        return { valid: false, status: 'AUTHORIZATION_REQUIRED', reason: authReason, capability };
      }
      return { valid: false, status: 'PROHIBITED', reason: authReason, capability };
    }

    return { valid: true, status: 'VALID', reason: 'Worker is fully capable and authorized.', capability };`;

content = content.replace(/\/\/ 3\. Connection Validation[\s\S]*?return \{ valid: true, status: 'VALID', reason: 'Worker is fully capable and authorized.', capability \};/, fix);

fs.writeFileSync(file, content);
